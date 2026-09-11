# ─── Events: audit trail + product analytics ─────────────────────────────────
# Every meaningful state change writes an event row. trip_events power undo +
# audit for a specific trip; user_events are the durable product-analytics log
# (mirrored to PostHog when configured, but never dependent on it).
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import ActorType


class TripEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_events"

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    event_type: Mapped[str] = mapped_column(String(80), index=True)
    actor: Mapped[ActorType] = mapped_column(default=ActorType.SYSTEM)
    action_id: Mapped[str | None] = mapped_column(String(80))
    payload: Mapped[dict] = mapped_column(JsonB, default=dict)


class UserEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_events"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    event_name: Mapped[str] = mapped_column(String(80), index=True)
    properties: Mapped[dict] = mapped_column(JsonB, default=dict)
    source: Mapped[str] = mapped_column(String(40), default="api")  # api|web|mobile
