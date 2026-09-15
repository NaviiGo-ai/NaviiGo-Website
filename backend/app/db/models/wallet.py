# ─── Wallet & Ledger: Server-authoritative balance, transactions, and coupons ───
# Every financial mutation is strictly executed by the backend using PostgreSQL
# row-level locking and unique idempotency keys to ensure zero double-spend.
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import CouponDiscountType, WalletTxStatus, WalletTxType


class WalletAccount(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wallet_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    available_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    pending_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    reward_points: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    lock_reason: Mapped[str | None] = mapped_column(String(240))

    user: Mapped["User"] = relationship("User", lazy="joined")
    transactions: Mapped[list["WalletTransaction"]] = relationship(
        "WalletTransaction", back_populates="wallet", cascade="all, delete-orphan"
    )


class WalletTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wallet_transactions"

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("wallet_accounts.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    type: Mapped[WalletTxType] = mapped_column(default=WalletTxType.DEBIT, index=True)
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    balance_after_minor: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[WalletTxStatus] = mapped_column(
        default=WalletTxStatus.COMPLETED, index=True
    )

    idempotency_key: Mapped[str | None] = mapped_column(
        String(160), unique=True, index=True
    )
    reference_type: Mapped[str] = mapped_column(String(64), default="BOOKING")
    reference_id: Mapped[str | None] = mapped_column(String(128), index=True)
    description: Mapped[str] = mapped_column(
        String(255), default="Naviigo Credit transaction"
    )
    metadata_json: Mapped[dict] = mapped_column("metadata", JsonB, default=dict)

    @property
    def direction(self) -> str:
        return "-" if self.type == WalletTxType.DEBIT else "+"

    wallet: Mapped[WalletAccount] = relationship(
        "WalletAccount", back_populates="transactions"
    )


class Coupon(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    discount_type: Mapped[CouponDiscountType] = mapped_column(
        default=CouponDiscountType.FIXED
    )
    discount_value: Mapped[int] = mapped_column(Integer)
    max_discount_minor: Mapped[int | None] = mapped_column(Integer)
    min_booking_amount_minor: Mapped[int] = mapped_column(Integer, default=0)

    max_uses_per_user: Mapped[int] = mapped_column(Integer, default=1)
    total_usage_limit: Mapped[int | None] = mapped_column(Integer)
    current_usage_count: Mapped[int] = mapped_column(Integer, default=0)

    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(String(255))

    redemptions: Mapped[list["CouponRedemption"]] = relationship(
        "CouponRedemption", back_populates="coupon", cascade="all, delete-orphan"
    )


class CouponRedemption(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "coupon_redemptions"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("coupons.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    booking_id: Mapped[str | None] = mapped_column(String(128), index=True)
    discount_applied_minor: Mapped[int] = mapped_column(Integer)

    coupon: Mapped[Coupon] = relationship("Coupon", back_populates="redemptions")
