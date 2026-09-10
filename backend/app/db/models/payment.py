# ─── Payments: Razorpay orders, attempts, refunds ────────────────────────────
# Payment lifecycle mirrors Razorpay's order/payment split. The server creates
# the order (amount set server-side), the client only collects the payment
# method, and the server verifies the signature + amount before any booking
# is attempted. Everything here is append-only audit data.
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import PaymentMethod, PaymentStatus


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True
    )
    # Unique per booking — one live payment intent at a time.
    __table_args__ = (
        UniqueConstraint("booking_id", "razorpay_order_id", name="uq_booking_order"),
    )

    razorpay_order_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(64), index=True
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    amount_paid: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    amount_refunded: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3))

    status: Mapped[PaymentStatus] = mapped_column(default=PaymentStatus.CREATED, index=True)
    method: Mapped[PaymentMethod | None] = mapped_column(String(20))
    description: Mapped[str | None] = mapped_column(String(240))

    idempotency_key: Mapped[str | None] = mapped_column(
        String(160), unique=True, index=True
    )

    # Server-side verification result (signature match + amount match).
    verified_at: Mapped[datetime | None] = mapped_column()
    verification_errors: Mapped[dict] = mapped_column(JsonB, default=dict)

    attempts: Mapped[list["PaymentAttempt"]] = relationship(
        back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentAttempt(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_attempts"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"), index=True
    )
    payment: Mapped[Payment] = relationship(back_populates="attempts")

    attempt_no: Mapped[int] = mapped_column(SmallInteger, default=1)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(40), default="created")

    error_code: Mapped[str | None] = mapped_column(String(120))
    error_description: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)


class Refund(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refunds"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"), index=True
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True
    )

    razorpay_refund_id: Mapped[str | None] = mapped_column(String(64), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))

    status: Mapped[str] = mapped_column(String(40), default="pending")  # pending|processed|failed
    reason: Mapped[str | None] = mapped_column(String(240))
    error_message: Mapped[str | None] = mapped_column(Text)
