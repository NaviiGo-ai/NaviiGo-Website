# ─── Reviews ─────────────────────────────────────────────────────────────────
# Only users with a CONFIRMED booking can review that trip; the booking link is
# enforced by the review service, so no anonymous/armchair ratings.
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin


class Review(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_review_trip_user"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    rating: Mapped[int] = mapped_column(SmallInteger)  # 1..5
    comment: Mapped[str | None] = mapped_column(Text)
    # Metadata: verified booking reference, photos, trip highlights.
    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)
