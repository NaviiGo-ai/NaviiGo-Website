from __future__ import annotations

import uuid
import razorpay
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import InvalidStateTransition, ForbiddenError, PaymentError
from app.db.models import Booking, Payment, PaymentAttempt, User
from app.db.models.enums import BookingStatus, PaymentStatus
from app.analytics.service import AnalyticsService

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.analytics = AnalyticsService(db)

        # Initialize Razorpay client only if keys are present
        self.client = None
        if self.settings.RAZORPAY_KEY_ID and self.settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(
                auth=(self.settings.RAZORPAY_KEY_ID, self.settings.RAZORPAY_KEY_SECRET)
            )

    async def create_payment_order(
        self,
        user: User,
        booking_id: uuid.UUID,
        idempotency_key: str,
        description: str | None = None
    ) -> Payment:
        """
        Creates a Razorpay order and a local Payment record for a booking.
        Implements idempotency mapping.
        """
        # Idempotency check
        result = await self.db.execute(select(Payment).where(Payment.idempotency_key == idempotency_key))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        # Fetch booking to ensure it belongs to the user and is valid for payment
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()

        if not booking:
            raise InvalidStateTransition("Booking not found.")

        if booking.user_id != user.id:
            raise ForbiddenError("You do not own this booking.")

        if booking.status not in {BookingStatus.SELECTED, BookingStatus.PRICE_CONFIRMED}:
            raise InvalidStateTransition(f"Cannot pay for booking in status {booking.status.value}")

        # If there's already an active payment for this booking, we might want to return it or cancel it.
        # For simplicity, we just create a new payment / override if needed? No, usually one active payment intent.

        # Razorpay amount is in smallest currency unit (e.g. paise for INR).
        amount_in_minor = int(booking.total_price * 100)
        receipt_id = f"rcpt_{uuid.uuid4().hex[:8]}"

        # Interact with Razorpay API (sync call wrapped in async ideally, but assuming minimal blocking)
        # Note: In production you should use an async HTTP client wrapper, or run in executor.
        if not self.client:
            raise PaymentError("Razorpay client not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
        try:
            razorpay_order = self.client.order.create(data={
                "amount": amount_in_minor,
                "currency": booking.currency,
                "receipt": receipt_id,
                "notes": {
                    "booking_id": str(booking.id),
                    "user_id": str(user.id)
                }
            })
        except Exception as e:
            raise PaymentError(f"Failed to create Razorpay order: {str(e)}")

        payment = Payment(
            booking_id=booking.id,
            razorpay_order_id=razorpay_order["id"],
            amount=booking.total_price,
            currency=booking.currency,
            status=PaymentStatus.CREATED,
            description=description,
            idempotency_key=idempotency_key
        )

        self.db.add(payment)

        await self.analytics.track(
            event_name="payment.order_created",
            user_id=user.id,
            properties={
                "payment_id": str(payment.id),
                "booking_id": str(booking.id),
                "amount": float(payment.amount),
                "currency": payment.currency,
                "order_id": razorpay_order["id"]
            }
        )

        await self.db.flush()

        return await self._reload(payment)

    async def verify_payment(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> Payment:
        """
        Verifies the Razorpay payment signature and marks the payment as successful.
        """
        result = await self.db.execute(select(Payment).where(Payment.razorpay_order_id == razorpay_order_id))
        payment = result.scalar_one_or_none()

        if not payment:
            raise PaymentError("Payment not found for order ID")

        if payment.status in {PaymentStatus.VERIFIED, PaymentStatus.CAPTURED}:
            return payment  # Already processed

        if not self.client:
            raise PaymentError("Razorpay credentials absent. Cannot verify payment.")

        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            payment.status = PaymentStatus.FAILED
            payment.verification_errors = {"error": "Invalid signature"}
            self.db.add(payment)
            await self.db.flush()
            raise PaymentError("Invalid payment signature")

        # Update payment status
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = PaymentStatus.VERIFIED
        payment.amount_paid = payment.amount
        payment.verified_at = datetime.now(timezone.utc)
        self.db.add(payment)

        # Also update booking status
        booking = await self.db.get(Booking, payment.booking_id)
        if booking and booking.status in {BookingStatus.SELECTED, BookingStatus.PRICE_CONFIRMED}:
            booking.status = BookingStatus.CONFIRMED
            booking.booked_at = datetime.now(timezone.utc)
            self.db.add(booking)

        await self.db.flush()
        return await self._reload(payment)

    async def process_webhook(self, raw_body: str, signature: str) -> None:
        """
        Process incoming Razorpay webhook.
        """
        if not self.settings.RAZORPAY_WEBHOOK_SECRET:
            raise PaymentError("Razorpay webhook secret absent")

        if not self.client:
            raise PaymentError("Razorpay credentials absent")

        try:
            self.client.utility.verify_webhook_signature(
                raw_body,
                signature,
                self.settings.RAZORPAY_WEBHOOK_SECRET
            )
        except Exception as e:
            raise PaymentError(f"Webhook signature verification failed: {str(e)}")

        import json
        payload = json.loads(raw_body)

        event = payload.get("event")
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = entity.get("order_id")
        payment_id = entity.get("id")

        if not order_id:
            return

        result = await self.db.execute(select(Payment).where(Payment.razorpay_order_id == order_id))
        payment = result.scalar_one_or_none()

        if not payment:
            return

        if event == "payment.captured":
            if payment.status not in {PaymentStatus.VERIFIED, PaymentStatus.CAPTURED}:
                payment.status = PaymentStatus.CAPTURED
                payment.razorpay_payment_id = payment_id
                payment.amount_paid = Decimal(str(entity.get("amount", 0))) / 100
                payment.verified_at = datetime.now(timezone.utc)
                self.db.add(payment)

                # Fetch booking via relation
                booking = await self.db.get(Booking, payment.booking_id)
                if booking and booking.status in {BookingStatus.SELECTED, BookingStatus.PRICE_CONFIRMED}:
                    booking.status = BookingStatus.CONFIRMED
                    booking.booked_at = datetime.now(timezone.utc)
                    self.db.add(booking)

                await self.db.flush()

        elif event == "payment.failed":
            if payment.status not in {PaymentStatus.VERIFIED, PaymentStatus.CAPTURED}:
                payment.status = PaymentStatus.FAILED
                self.db.add(payment)
                await self.db.flush()

    async def _reload(self, payment: Payment) -> Payment:
        payment_id = payment.id
        self.db.expire(payment)
        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one()
