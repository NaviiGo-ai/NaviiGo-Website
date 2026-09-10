# ─── Bookings: lifecycle, idempotency, money ─────────────────────────────────
# The booking row is the server-side authority for a purchase. status transitions
# are validated by the booking service; idempotency_key guarantees a retried
# create() returns the existing booking instead of duplicating it. Money fields
# are NUMERIC(12,2) — the browser never writes these.
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import BookingStatus, ItemKind


class Booking(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "bookings"

    trip_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Human-readable reference shown to the user (e.g. NVG-8F3K2A).
    booking_number: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    idempotency_key: Mapped[str] = mapped_column(
        String(160), unique=True, index=True
    )

    kind: Mapped[ItemKind] = mapped_column(index=True)
    title: Mapped[str] = mapped_column(String(240))
    status: Mapped[BookingStatus] = mapped_column(
        default=BookingStatus.SELECTED, index=True
    )

    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("suppliers.id", ondelete="SET NULL")
    )
    supplier_offer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("supplier_offers.id", ondelete="SET NULL")
    )
    supplier_booking_ref: Mapped[str | None] = mapped_column(String(160), index=True)
    pnr: Mapped[str | None] = mapped_column(String(20))

    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))

    traveler_details: Mapped[dict] = mapped_column(JsonB, default=dict)
    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)

    error_code: Mapped[str | None] = mapped_column(String(80))
    error_message: Mapped[str | None] = mapped_column(Text)

    booked_at: Mapped[datetime | None] = mapped_column(DateTime)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime)

    items: Mapped[list["BookingItem"]] = relationship(
        back_populates="booking", cascade="all, delete-orphan"
    )


class BookingItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "booking_items"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True
    )
    booking: Mapped[Booking] = relationship(back_populates="items")

    item_type: Mapped[str] = mapped_column(String(40))  # flight|hotel|train|cab|activity
    name: Mapped[str] = mapped_column(String(240))
    description: Mapped[str | None] = mapped_column(Text)

    quantity: Mapped[int] = mapped_column(SmallInteger, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    travel_date: Mapped[date | None] = mapped_column(Date)
    start_time: Mapped[str | None] = mapped_column(String(10))  # "09:30"
    from_place: Mapped[str | None] = mapped_column(String(120))
    to_place: Mapped[str | None] = mapped_column(String(120))

    passenger_names: Mapped[list] = mapped_column(JsonB, default=list)
    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)
