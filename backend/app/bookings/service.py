# ─── Booking service ────────────────────────────────────────────────────────────────
# Handles the lifecycle of a booking: from selection to payment, confirmation, and cancellation.
# Implements idempotency for safe retries.
from __future__ import annotations

import uuid
import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Booking, User
from app.db.models.enums import BookingStatus, ItemKind
from app.suppliers.service import SupplierService
from app.analytics.service import AnalyticsService
from app.core.errors import InvalidStateTransition, ForbiddenError


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.supplier_service = SupplierService(db)
        self.analytics = AnalyticsService(db)

    async def create_booking(
        self,
        user: User,
        trip_id: uuid.UUID | None,
        supplier_offer_id: uuid.UUID,
        idempotency_key: str,
        traveler_details: dict,
        metadata: dict | None = None,
    ) -> Booking:
        """
        Create a new booking with idempotency.
        If a booking with the same idempotency_key exists, return it.
        """
        # Check for existing booking with this idempotency key
        stmt = select(Booking).where(Booking.idempotency_key == idempotency_key)
        result = await self.db.execute(stmt)
        existing_booking = result.scalar_one_or_none()
        if existing_booking:
            return existing_booking

        # Fetch the supplier offer to get price and details
        # We need the supplier ID to fetch the offer, but we don't have it directly.
        # We'll search for the offer by scanning through suppliers (not ideal but works for now)
        # In a production system, we would have a direct lookup or the supplier_offer_id would contain supplier info
        offer = None
        suppliers = await self.supplier_service.get_suppliers()
        for supplier in suppliers:
            offer_candidate = await self.supplier_service.get_offer_by_id(supplier.id, supplier_offer_id)
            if offer_candidate:
                offer = offer_candidate
                break

        if not offer:
            raise InvalidStateTransition("Offer not found or access denied")

        # Create the booking
        booking = Booking(
            trip_id=trip_id,
            user_id=user.id,
            booking_number=f"NVG-{secrets.token_hex(4).upper()}",
            supplier_id=offer.supplier_id,
            supplier_offer_id=supplier_offer_id,
            idempotency_key=idempotency_key,
            kind=offer.kind,
            title=offer.name,
            total_price=offer.price,
            currency=offer.currency,
            traveler_details=traveler_details,
            metadata_json=metadata or {},
            status=BookingStatus.SELECTED,  # Initial status after selection
        )

        self.db.add(booking)
        await self.analytics.track(
            event_name="booking.created",
            user_id=user.id,
            properties={
                "booking_id": str(booking.id),
                "trip_id": str(trip_id) if trip_id else None,
                "amount": str(booking.total_price),
                "currency": booking.currency,
                "kind": booking.kind.value if booking.kind else None
            }
        )
        await self.db.flush()
        return await self._reload(booking)

    async def _reload(self, booking: Booking) -> Booking:
        """Re-fetch the booking after flush."""
        booking_id = booking.id
        self.db.expire(booking)
        result = await self.db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        return result.scalar_one()

    async def confirm_booking(
        self,
        booking: Booking,
        user_id: uuid.UUID,
        payment_status: str = "CAPTURED",  # This would come from the payment service
    ) -> Booking:
        """
        Confirm the booking after payment is successful.
        """
        if booking.user_id != user_id:
            raise ForbiddenError("You do not own this booking.")

        # Validate transition: from SELECTED or PRICE_CONFIRMED to CONFIRMED
        allowed_transitions = {
            BookingStatus.SELECTED: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
            BookingStatus.PRICE_CONFIRMED: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
        }
        if booking.status not in allowed_transitions:
            raise InvalidStateTransition(
                f"Cannot confirm a booking in status {booking.status.value}."
            )

        await self._snapshot(booking, "Booking confirmed", user_id)
        booking.status = BookingStatus.CONFIRMED
        booking.booked_at = datetime.now(timezone.utc)
        # In a real system, we would set the payment status here, but we don't have a payment field in the booking model.
        # We have a separate payment model? Not yet. We'll assume the payment service updates the booking.
        # For now, we'll just update the status and booked_at.
        self.db.add(booking)
        await self.db.flush()
        return await self._reload(booking)

    async def cancel_booking(
        self,
        booking: Booking,
        user_id: uuid.UUID,
        reason: str | None = None,
    ) -> Booking:
        """
        Cancel the booking.
        """
        if booking.user_id != user_id:
            raise ForbiddenError("You do not own this booking.")

        # Validate transition: can cancel from SELECTED, PRICE_CONFIRMED, CONFIRMED?
        # Let's assume we can cancel until it's completed or expired.
        # We'll follow the booking status enum: we can cancel from any non-terminal state.
        # Terminal states: FAILED, CANCELLED, REFUNDED, EXPIRED
        if booking.status in {
            BookingStatus.FAILED,
            BookingStatus.CANCELLED,
            BookingStatus.REFUNDED,
            BookingStatus.EXPIRED,
        }:
            raise InvalidStateTransition(
                f"Cannot cancel a booking in terminal status {booking.status.value}."
            )

        await self._snapshot(booking, "Booking cancelled", user_id)
        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = datetime.now(timezone.utc)
        if reason:
            booking.error_message = reason
        self.db.add(booking)
        await self.db.flush()
        return await self._reload(booking)

    async def _snapshot(
        self,
        booking: Booking,
        description: str | None,
        user_id: uuid.UUID,
    ) -> None:
        """
        Create a snapshot of the booking for audit/history.
        For bookings, we use AnalyticsService to track the state change as a UserEvent.
        """
        await self.analytics.track(
            event_name="booking.status_changed",
            user_id=user_id,
            properties={
                "booking_id": str(booking.id),
                "trip_id": str(booking.trip_id) if booking.trip_id else None,
                "description": description,
                "status": booking.status.value,
            }
        )