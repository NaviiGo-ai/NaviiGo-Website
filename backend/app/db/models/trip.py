# ─── Trip domain: trips, preferences, days, items, versions, saved ───────────
# The Trip is the central object of the product. The server owns its state;
# every mutation goes through the trip service which validates the lifecycle
# transition, snapshots the previous state into trip_versions, and records a
# TripEvent. This gives us undo, audit, and analytics for free.
from __future__ import annotations

import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import get_settings
from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import ActorType, SourceType, TripStatus


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trips"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(String(200))
    destination_name: Mapped[str] = mapped_column(String(200), index=True)
    destination_city: Mapped[str | None] = mapped_column(String(120))
    destination_country: Mapped[str | None] = mapped_column(String(120))
    origin_city: Mapped[str | None] = mapped_column(String(120))

    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    duration_days: Mapped[int] = mapped_column(SmallInteger, default=1)

    group_type: Mapped[str | None] = mapped_column(String(40))  # solo|couple|family|friends
    travel_purpose: Mapped[str | None] = mapped_column(String(40))

    # Money is always Decimal in Python and NUMERIC in Postgres — never float.
    budget_total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(
        String(3), default=lambda: get_settings().DEFAULT_CURRENCY
    )

    status: Mapped[TripStatus] = mapped_column(
        default=TripStatus.DRAFT, index=True
    )
    status_reason: Mapped[str | None] = mapped_column(String(200))

    # Provenance of the whole itinerary (VERIFIED_LIVE / ESTIMATED / AI_GENERATED…)
    source_type: Mapped[SourceType] = mapped_column(
        default=SourceType.AI_GENERATED
    )

    version: Mapped[int] = mapped_column(Integer, default=1)
    # Pointer to the active version row. use_alter breaks the trips↔trip_versions
    # FK cycle so Alembic can sort tables (and warn-free autogenerate).
    current_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("trip_versions.id", ondelete="SET NULL", use_alter=True)
    )

    # Free-form product payload (budget breakdown, logistics, map center…).
    data: Mapped[dict] = mapped_column(JsonB, default=dict)

    preferences: Mapped["TripPreference"] = relationship(
        back_populates="trip", uselist=False, cascade="all, delete-orphan"
    )
    days: Mapped[list["TripDay"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan"
    )
    versions: Mapped[list["TripVersion"]] = relationship(
        back_populates="trip",
        cascade="all, delete-orphan",
        foreign_keys="TripVersion.trip_id",
    )


class TripPreference(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_preferences"

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), unique=True
    )
    trip: Mapped[Trip] = relationship(back_populates="preferences")

    interests: Mapped[list] = mapped_column(JsonB, default=list)
    dietary_preferences: Mapped[list] = mapped_column(JsonB, default=list)
    accessibility_needs: Mapped[list] = mapped_column(JsonB, default=list)
    pace: Mapped[str | None] = mapped_column(String(20))          # relaxed|balanced|packed
    hotel_area: Mapped[str | None] = mapped_column(String(120))
    must_do: Mapped[list] = mapped_column(JsonB, default=list)     # user-pinned places
    browsing_signals: Mapped[dict] = mapped_column(JsonB, default=dict)


class TripDay(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_days"
    __table_args__ = (
        UniqueConstraint("trip_id", "day_number", name="uq_trip_day_number"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    trip: Mapped[Trip] = relationship(back_populates="days")

    day_number: Mapped[int] = mapped_column(SmallInteger)
    date: Mapped[date | None] = mapped_column(Date)
    title: Mapped[str | None] = mapped_column(String(160))
    is_transit_day: Mapped[bool] = mapped_column(Boolean, default=False)

    # Weather is a forecast; the model always records its provenance + fetched_at
    # so the UI can label it "estimate" and it can never be mistaken for current.
    weather: Mapped[dict] = mapped_column(JsonB, default=dict)

    items: Mapped[list["TripItem"]] = relationship(
        back_populates="day", cascade="all, delete-orphan", order_by="TripItem.position"
    )


class TripItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_items"

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    day_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trip_days.id", ondelete="CASCADE"), index=True
    )
    day: Mapped[TripDay] = relationship(back_populates="items")

    position: Mapped[int] = mapped_column(SmallInteger, default=0)
    item_type: Mapped[str] = mapped_column(String(30))  # attraction|restaurant|hotel|transit|activity|stay
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    # Whether the coordinates came from a live source or were AI-invented.
    coords_source: Mapped[SourceType] = mapped_column(
        default=SourceType.AI_GENERATED
    )

    slot: Mapped[str | None] = mapped_column(String(20))     # morning|afternoon|evening
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)
    duration_minutes: Mapped[int | None] = mapped_column(SmallInteger)

    category: Mapped[str | None] = mapped_column(String(80))
    is_must_do: Mapped[bool] = mapped_column(Boolean, default=False)

    # Pricing per item (entryFee etc.) — provenance tagged inside the JSON.
    pricing: Mapped[dict] = mapped_column(JsonB, default=dict)
    source_type: Mapped[SourceType] = mapped_column(default=SourceType.AI_GENERATED)

    # Link to the supplier offer this item was booked/derived from, if any.
    supplier_offer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("supplier_offers.id", ondelete="SET NULL")
    )
    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL")
    )

    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)


class TripVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_versions"

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    trip: Mapped[Trip] = relationship(
        back_populates="versions", foreign_keys=[trip_id]
    )

    version_number: Mapped[int] = mapped_column(Integer)
    # Full serialized snapshot of the trip at this version (undo source of truth).
    snapshot: Mapped[dict] = mapped_column(JsonB)
    change_description: Mapped[str | None] = mapped_column(String(300))
    action_id: Mapped[str | None] = mapped_column(String(80))  # AI action that caused it
    created_by: Mapped[ActorType] = mapped_column(default=ActorType.SYSTEM)


class SavedTrip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "saved_trips"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
