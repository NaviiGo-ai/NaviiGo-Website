import pytest
from uuid import uuid4
from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import razorpay

from app.db.models import User
from app.db.models.enums import BookingStatus, ItemKind, PaymentStatus
from app.bookings.service import BookingService
from app.payments.service import PaymentService
from app.trips.service import TripService
from app.trips.schemas import TripCreate
from app.core.errors import PaymentError, InvalidStateTransition, ForbiddenError

pytestmark = pytest.mark.asyncio


async def _user(db: AsyncSession, email: str) -> User:
    user = User(firebase_uid=f"fb_{email}", email=email, display_name="Test User")
    db.add(user)
    await db.flush()
    return user


class _MockSupplierService:
    """Concrete supplier/offer fixtures — no MagicMock values reach the DB."""

    def __init__(self, offer_id):
        self.offer_id = offer_id
        self.supplier_id = uuid4()

    async def get_suppliers(self):
        return [SimpleNamespace(id=self.supplier_id, name="Mock Supplier")]

    async def get_offer_by_id(self, supplier_id, offer_id):
        if offer_id != self.offer_id:
            return None
        return SimpleNamespace(
            id=self.offer_id,
            supplier_id=self.supplier_id,
            name="Hotel Paris",
            kind=ItemKind.HOTEL,
            price=Decimal("100.00"),
            currency="EUR",
        )


async def _booking(db: AsyncSession, user: User, idem_key: str) -> object:
    """Create a SELECTED booking (the state payments can be created from)."""
    trip_service = TripService(db)
    trip = await trip_service.create(
        user,
        TripCreate(
            title="Payment Trip",
            destination_name="Paris",
            destination_city="Paris",
            destination_country="France",
            origin_city="London",
            start_date=date(2025, 10, 1),
            end_date=date(2025, 10, 7),
            duration_days=6,
            group_type="solo",
            travel_purpose="leisure",
            budget_total=Decimal("1000.00"),
            currency="EUR",
        ),
    )

    offer_id = uuid4()

    booking_service = BookingService(db)
    booking_service.supplier_service = _MockSupplierService(offer_id)
    return await booking_service.create_booking(
        user=user,
        trip_id=trip.id,
        supplier_offer_id=offer_id,
        idempotency_key=idem_key,
        traveler_details={"name": "John Doe", "email": "john@example.com"},
    )


async def test_payment_create_and_verify(get_test_db: AsyncSession):
    """Test creating a payment order and verifying it with Razorpay."""
    user = await _user(get_test_db, "test@example.com")
    booking = await _booking(get_test_db, user, "payment-idem-1")

    payment_service = PaymentService(get_test_db)

    # Fake Razorpay client: order.create returns an order dict; signature verifies OK.
    mock_client = MagicMock()
    mock_client.order.create.return_value = {"id": "order_test_123"}
    payment_service.client = mock_client

    payment = await payment_service.create_payment_order(
        user=user,
        booking_id=booking.id,
        idempotency_key="pay-key-1",
        description="Hotel Paris",
    )

    assert payment.id is not None
    assert payment.booking_id == booking.id
    assert payment.amount == Decimal("100.00")
    assert payment.currency == "EUR"
    assert payment.status == PaymentStatus.CREATED
    assert payment.razorpay_order_id == "order_test_123"

    # Same idempotency key → existing payment returned.
    payment_again = await payment_service.create_payment_order(
        user=user, booking_id=booking.id, idempotency_key="pay-key-1"
    )
    assert payment_again.id == payment.id

    # Verify — signature check passes.
    verified = await payment_service.verify_payment(
        razorpay_order_id="order_test_123",
        razorpay_payment_id="pay_1234567890",
        razorpay_signature="valid_sig",
    )
    assert verified.status == PaymentStatus.VERIFIED
    assert verified.razorpay_payment_id == "pay_1234567890"
    assert verified.amount_paid == Decimal("100.00")
    assert verified.verified_at is not None

    # Booking moved to CONFIRMED.
    booking_row = await get_test_db.get(type(booking), booking.id)
    assert booking_row.status == BookingStatus.CONFIRMED


async def test_payment_verify_invalid_signature(get_test_db: AsyncSession):
    """Test payment verification fails on an invalid signature."""
    user = await _user(get_test_db, "test2@example.com")
    booking = await _booking(get_test_db, user, "payment-idem-2")

    payment_service = PaymentService(get_test_db)

    mock_client = MagicMock()
    mock_client.order.create.return_value = {"id": "order_invalid_1"}
    mock_client.utility.verify_payment_signature.side_effect = (
        razorpay.errors.SignatureVerificationError("Invalid signature")
    )
    payment_service.client = mock_client

    payment = await payment_service.create_payment_order(
        user=user, booking_id=booking.id, idempotency_key="pay-key-2"
    )

    with pytest.raises(PaymentError, match="Invalid payment signature"):
        await payment_service.verify_payment(
            razorpay_order_id="order_invalid_1",
            razorpay_payment_id="pay_invalid",
            razorpay_signature="bad_sig",
        )

    # Payment is marked FAILED and persisted.
    result = await get_test_db.execute(
        select(type(payment)).where(type(payment).id == payment.id)
    )
    failed = result.scalar_one()
    assert failed.status == PaymentStatus.FAILED
    assert failed.verification_errors == {"error": "Invalid signature"}


async def test_payment_verify_missing_credentials(get_test_db: AsyncSession):
    """Test payment verification fails when Razorpay credentials are absent."""
    user = await _user(get_test_db, "test3@example.com")
    booking = await _booking(get_test_db, user, "payment-idem-3")

    payment_service = PaymentService(get_test_db)
    payment_service.client = None  # no RAZORPAY_KEY_ID / SECRET configured

    with pytest.raises(PaymentError, match="Razorpay client not configured"):
        await payment_service.create_payment_order(
            user=user, booking_id=booking.id, idempotency_key="pay-key-3"
        )


async def test_payment_webhook_processing(get_test_db: AsyncSession):
    """Test processing of Razorpay webhook with a valid signature."""
    user = await _user(get_test_db, "test4@example.com")
    booking = await _booking(get_test_db, user, "payment-idem-4")

    payment_service = PaymentService(get_test_db)
    payment_service.settings.RAZORPAY_WEBHOOK_SECRET = "webhook_secret"

    mock_client = MagicMock()
    mock_client.order.create.return_value = {"id": "order_webhook_1"}
    payment_service.client = mock_client

    payment = await payment_service.create_payment_order(
        user=user, booking_id=booking.id, idempotency_key="pay-key-4"
    )

    webhook_body = (
        '{"event": "payment.captured", "payload": {"payment": {"entity": {'
        f'"id": "pay_webhook_1", "order_id": "{payment.razorpay_order_id}", '
        '"amount": 10000, "currency": "EUR", "status": "captured"}}}}'
    )

    await payment_service.process_webhook(
        raw_body=webhook_body, signature="valid_webhook_sig"
    )

    result = await get_test_db.execute(
        select(type(payment)).where(type(payment).id == payment.id)
    )
    captured = result.scalar_one()
    assert captured.status == PaymentStatus.CAPTURED
    assert captured.razorpay_payment_id == "pay_webhook_1"
    assert captured.amount_paid == Decimal("100.00")

    booking_row = await get_test_db.get(type(booking), booking.id)
    assert booking_row.status == BookingStatus.CONFIRMED


async def test_payment_webhook_invalid_signature(get_test_db: AsyncSession):
    """Test webhook processing fails when the signature is invalid."""
    user = await _user(get_test_db, "test5@example.com")
    booking = await _booking(get_test_db, user, "payment-idem-5")

    payment_service = PaymentService(get_test_db)
    payment_service.settings.RAZORPAY_WEBHOOK_SECRET = "webhook_secret"

    mock_client = MagicMock()
    mock_client.utility.verify_webhook_signature.side_effect = Exception("Bad signature")
    payment_service.client = mock_client

    with pytest.raises(PaymentError, match="Webhook signature verification failed"):
        await payment_service.process_webhook(raw_body="{}", signature="bad_sig")
