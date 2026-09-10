from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.db.models.enums import BookingStatus, ItemKind


class TravelerDetail(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None


class BookingCreate(BaseModel):
    trip_id: uuid.UUID | None = None
    supplier_offer_id: uuid.UUID
    traveler_details: dict
    metadata: dict | None = None
    idempotency_key: str = Field(..., description="Unique key for safe retries")


class BookingRead(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID | None
    user_id: uuid.UUID
    booking_number: str
    idempotency_key: str
    kind: ItemKind
    title: str
    status: BookingStatus
    supplier_id: uuid.UUID | None
    supplier_offer_id: uuid.UUID | None
    supplier_booking_ref: str | None
    pnr: str | None
    total_price: Decimal
    currency: str
    traveler_details: dict
    metadata: dict | None = Field(None, alias="metadata_json")
    error_code: str | None
    error_message: str | None
    booked_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class BookingCancel(BaseModel):
    reason: str | None = None