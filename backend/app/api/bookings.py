# ─── Bookings API ────────────────────────────────────────────────────────────
# Handles creating, confirming, and canceling reservations using BookingService.

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status

from app.core.dependencies import CurrentUserId, DBSession
from app.core.errors import ForbiddenError
from app.bookings.schemas import BookingCreate, BookingRead, BookingCancel
from app.bookings.service import BookingService
from app.users.service import get_or_create_user
from sqlalchemy import select
from app.db.models.booking import Booking

router = APIRouter(prefix="/bookings", tags=["bookings"])

async def _owned_booking(service: BookingService, booking_id: uuid.UUID, user_id: uuid.UUID) -> Booking:
    stmt = select(Booking).where(Booking.id == booking_id)
    result = await service.db.execute(stmt)
    booking = result.scalar_one_or_none()
    if not booking:
        raise ForbiddenError("Booking not found.")
    if booking.user_id != user_id:
        raise ForbiddenError("You do not own this booking.")
    return booking

@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> BookingRead:
    user = await get_or_create_user(db, firebase_uid)
    service = BookingService(db)

    booking = await service.create_booking(
        user=user,
        trip_id=payload.trip_id,
        supplier_offer_id=payload.supplier_offer_id,
        idempotency_key=payload.idempotency_key,
        traveler_details=payload.traveler_details,
        metadata=payload.metadata,
    )
    await db.commit()
    # Pydantic's from_attributes handles the conversion
    return booking

@router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(
    booking_id: uuid.UUID,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> BookingRead:
    user = await get_or_create_user(db, firebase_uid)
    service = BookingService(db)
    booking = await _owned_booking(service, booking_id, user.id)
    return booking

@router.post("/{booking_id}/cancel", response_model=BookingRead)
async def cancel_booking(
    booking_id: uuid.UUID,
    payload: BookingCancel,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> BookingRead:
    user = await get_or_create_user(db, firebase_uid)
    service = BookingService(db)
    booking = await _owned_booking(service, booking_id, user.id)

    booking = await service.cancel_booking(
        booking=booking,
        user_id=user.id,
        reason=payload.reason
    )
    await db.commit()
    return booking

# Note: Confirmation is typically handled by Payment Webhooks or a specific flow,
# but we provide a test/admin endpoint here for completeness.
@router.post("/{booking_id}/confirm", response_model=BookingRead)
async def confirm_booking(
    booking_id: uuid.UUID,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> BookingRead:
    user = await get_or_create_user(db, firebase_uid)
    service = BookingService(db)
    booking = await _owned_booking(service, booking_id, user.id)

    booking = await service.confirm_booking(
        booking=booking,
        user_id=user.id,
        payment_status="CAPTURED"
    )
    await db.commit()
    return booking
