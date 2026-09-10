# ─── Users ───────────────────────────────────────────────────────────────────
# Identity stays in Firebase Auth (the only source of truth for auth). This
# table is a denormalized profile mirror used by the transactional layer:
# trips/bookings reference user.id (a UUID), never the Firebase UID directly.
from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import get_settings
from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    photo_url: Mapped[str | None] = mapped_column(String(1024))
    phone: Mapped[str | None] = mapped_column(String(32))

    home_city: Mapped[str | None] = mapped_column(String(120))
    currency: Mapped[str] = mapped_column(
        String(3), default=lambda: get_settings().DEFAULT_CURRENCY
    )

    # travelStyle, interests[], dietaryPreferences[], accessibilityNeeds[]
    preferences: Mapped[dict] = mapped_column(JsonB, default=dict)
    # tasteVector (768 floats), browsingSignals{}, pastDestinations[]
    ai_profile: Mapped[dict] = mapped_column(JsonB, default=dict)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
