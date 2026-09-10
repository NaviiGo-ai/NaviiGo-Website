import pytest
from uuid import uuid4
from datetime import date
from decimal import Decimal
from types import SimpleNamespace

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.models.enums import BookingStatus, ItemKind
from app.bookings.service import BookingService
from app.trips.service import TripService
from app.trips.schemas import TripCreate
from app.core.errors import InvalidStateTransition, ForbiddenError

pytestmark = pytest.mark.asyncio


async def _user(db: AsyncSession, email: str) -> User:
    user = User(firebase_uid=f"fb_{email}", email=email, display_name="Test User")
    db.add(user)
    await db.flush()
    return user


async def _trip(db: AsyncSession, user: User, title: str) -> object:
    service = TripService(db)
    return await service.create(
        user,
        TripCreate(
            title=title,
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


class MockSupplierService:
    """Returns one supplier with one offer — enough to exercise the booking path."""

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
            supplier_id=supplier_id,
            name="Hotel Paris",
            kind=ItemKind.HOTEL,
            price=Decimal("100.00"),
            currency="EUR",
        )


async def test_booking_create_idempotency(get_test_db: AsyncSession):
    """Test booking creation with idempotency key."""
    user = await _user(get_test_db, "test@example.com")
    trip = await _trip(get_test_db, user, "Trip for Booking")

    offer_id = uuid4()
    booking_service = BookingService(get_test_db)
    booking_service.supplier_service = MockSupplierService(offer_id)

    traveler = {"name": "John Doe", "email": "john@example.com"}
    booking1 = await booking_service.create_booking(
        user=user,
        trip_id=trip.id,
        supplier_offer_id=offer_id,
        idempotency_key="test-key-123",
        traveler_details=traveler,
    )

    assert booking1.id is not None
    assert booking1.status == BookingStatus.SELECTED
    assert booking1.idempotency_key == "test-key-123"
    assert booking1.title == "Hotel Paris"
    assert booking1.total_price == Decimal("100.00")
    assert booking1.currency == "EUR"

    # Same idempotency key returns the existing booking — no duplicate.
    booking2 = await booking_service.create_booking(
        user=user,
        trip_id=trip.id,
        supplier_offer_id=offer_id,
        idempotency_key="test-key-123",
        traveler_details=traveler,
    )
    assert booking2.id == booking1.id


async def test_booking_confirm_and_cancel(get_test_db: AsyncSession):
    """Test booking confirmation and cancellation."""
    user = await _user(get_test_db, "test2@example.com")
    trip = await _trip(get_test_db, user, "Trip Confirm/Cancel")

    offer_id = uuid4()
    booking_service = BookingService(get_test_db)
    booking_service.supplier_service = MockSupplierService(offer_id)

    booking = await booking_service.create_booking(
        user=user,
        trip_id=trip.id,
        supplier_offer_id=offer_id,
        idempotency_key="confirm-test-key",
        traveler_details={"name": "Jane Doe", "email": "jane@example.com"},
    )
    assert booking.status == BookingStatus.SELECTED

    confirmed = await booking_service.confirm_booking(booking, user.id)
    assert confirmed.status == BookingStatus.CONFIRMED
    assert confirmed.booked_at is not None

    cancelled = await booking_service.cancel_booking(
        confirmed, user.id, reason="Changed plans"
    )
    assert cancelled.status == BookingStatus.CANCELLED
    assert cancelled.cancelled_at is not None
    assert cancelled.error_message == "Changed plans"

    # Terminal state cannot be cancelled again.
    with pytest.raises(InvalidStateTransition):
        await booking_service.cancel_booking(cancelled, user.id)


async def test_booking_forbidden_access(get_test_db: AsyncSession):
    """Test that users cannot confirm/cancel bookings they don't own."""
    user1 = await _user(get_test_db, "user1@example.com")
    user2 = await _user(get_test_db, "user2@example.com")
    trip = await _trip(get_test_db, user1, "Forbidden Trip")

    offer_id = uuid4()
    booking_service = BookingService(get_test_db)
    booking_service.supplier_service = MockSupplierService(offer_id)

    booking = await booking_service.create_booking(
        user=user1,
        trip_id=trip.id,
        supplier_offer_id=offer_id,
        idempotency_key="forbidden-test-key",
        traveler_details={"name": "User One", "email": "user1@example.com"},
    )

    with pytest.raises(ForbiddenError):
        await booking_service.confirm_booking(booking, user2.id)

    with pytest.raises(ForbiddenError):
        await booking_service.cancel_booking(booking, user2.id)


async def test_booking_offer_not_found(get_test_db: AsyncSession):
    """Test that booking fails when the offer does not exist."""
    user = await _user(get_test_db, "test3@example.com")
    trip = await _trip(get_test_db, user, "Missing Offer Trip")

    booking_service = BookingService(get_test_db)
    booking_service.supplier_service = MockSupplierService(uuid4())

    with pytest.raises(InvalidStateTransition, match="Offer not found"):
        await booking_service.create_booking(
            user=user,
            trip_id=trip.id,
            supplier_offer_id=uuid4(),  # not the id the mock will find
            idempotency_key="missing-offer-key",
            traveler_details={"name": "No Offer", "email": "no@example.com"},
        )
