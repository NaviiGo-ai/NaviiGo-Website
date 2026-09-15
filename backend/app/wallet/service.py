from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    CouponExpiredError,
    CouponMinBookingAmountError,
    CouponUsageLimitError,
    InsufficientBalanceError,
    InvalidCouponError,
    WalletLockedError,
)
from app.core.logging import get_logger
from app.db.models.enums import CouponDiscountType, WalletTxStatus, WalletTxType
from app.db.models.user import User
from app.db.models.wallet import (
    Coupon,
    CouponRedemption,
    WalletAccount,
    WalletTransaction,
)
from app.wallet.schemas import CouponApplyResponse

logger = get_logger(__name__)


class WalletService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_account(self, user: User) -> WalletAccount:
        """Fetch the authoritative WalletAccount or initialize a zero-balance account."""
        stmt = select(WalletAccount).where(WalletAccount.user_id == user.id)
        account = await self.db.scalar(stmt)
        if account is None:
            account = WalletAccount(
                user_id=user.id,
                available_minor=0,
                pending_minor=0,
                reward_points=0,
                currency="INR",
                is_locked=False,
            )
            self.db.add(account)
            await self.db.flush()
            await self._sync_firestore_account(user.firebase_uid, account)
        return account

    async def get_transactions(
        self, user: User, limit: int = 50
    ) -> list[WalletTransaction]:
        """Fetch user's transaction ledger in reverse chronological order."""
        stmt = (
            select(WalletTransaction)
            .where(WalletTransaction.user_id == user.id)
            .order_by(WalletTransaction.created_at.desc())
            .limit(limit)
        )
        result = await self.db.scalars(stmt)
        return list(result.all())

    async def debit_wallet(
        self,
        user: User,
        amount_minor: int,
        reference_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        description: Optional[str] = None,
    ) -> WalletTransaction:
        """
        Deduct credit from user's wallet with row-level locking and idempotency.
        """
        if amount_minor <= 0:
            raise ValueError("Debit amount must be strictly greater than 0.")

        # Idempotency check: replay previous completed transaction if idempotency_key is repeated
        if idempotency_key:
            stmt = select(WalletTransaction).where(
                WalletTransaction.idempotency_key == idempotency_key
            )
            existing_tx = await self.db.scalar(stmt)
            if existing_tx is not None:
                logger.info(
                    "Replaying idempotent wallet debit",
                    extra={"idempotency_key": idempotency_key, "tx_id": str(existing_tx.id)},
                )
                return existing_tx

        # Acquire row lock on WalletAccount to prevent race conditions & double-spend
        stmt = (
            select(WalletAccount)
            .where(WalletAccount.user_id == user.id)
            .with_for_update()
        )
        account = await self.db.scalar(stmt)
        if account is None:
            account = WalletAccount(
                user_id=user.id,
                available_minor=0,
                pending_minor=0,
                reward_points=0,
                currency="INR",
                is_locked=False,
            )
            self.db.add(account)
            await self.db.flush()

        if account.is_locked:
            raise WalletLockedError(
                account.lock_reason or "Your wallet is temporarily locked."
            )

        if account.available_minor < amount_minor:
            raise InsufficientBalanceError(
                f"Insufficient balance. Available: INR {account.available_minor / 100:.2f}, Required: INR {amount_minor / 100:.2f}"
            )

        account.available_minor -= amount_minor

        tx = WalletTransaction(
            wallet_id=account.id,
            user_id=user.id,
            type=WalletTxType.DEBIT,
            amount_minor=amount_minor,
            balance_after_minor=account.available_minor,
            status=WalletTxStatus.COMPLETED,
            idempotency_key=idempotency_key,
            reference_type="BOOKING",
            reference_id=reference_id,
            description=description or "Naviigo Credit debit",
            metadata_json={"reference_id": reference_id},
        )
        self.db.add(tx)
        await self.db.flush()

        await self._sync_firestore_account(user.firebase_uid, account)
        await self._sync_firestore_transaction(user.firebase_uid, tx)

        return tx

    async def refund_wallet(
        self,
        user: User,
        amount_minor: int,
        reference_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> WalletTransaction:
        """
        Credit refund back to user's wallet with row-level locking and idempotency.
        """
        if amount_minor <= 0:
            raise ValueError("Refund amount must be strictly greater than 0.")

        if idempotency_key:
            stmt = select(WalletTransaction).where(
                WalletTransaction.idempotency_key == idempotency_key
            )
            existing_tx = await self.db.scalar(stmt)
            if existing_tx is not None:
                logger.info(
                    "Replaying idempotent wallet refund",
                    extra={"idempotency_key": idempotency_key, "tx_id": str(existing_tx.id)},
                )
                return existing_tx

        stmt = (
            select(WalletAccount)
            .where(WalletAccount.user_id == user.id)
            .with_for_update()
        )
        account = await self.db.scalar(stmt)
        if account is None:
            account = WalletAccount(
                user_id=user.id,
                available_minor=0,
                pending_minor=0,
                reward_points=0,
                currency="INR",
                is_locked=False,
            )
            self.db.add(account)
            await self.db.flush()

        if account.is_locked:
            raise WalletLockedError(
                account.lock_reason or "Your wallet is temporarily locked."
            )

        account.available_minor += amount_minor

        tx = WalletTransaction(
            wallet_id=account.id,
            user_id=user.id,
            type=WalletTxType.REFUND,
            amount_minor=amount_minor,
            balance_after_minor=account.available_minor,
            status=WalletTxStatus.COMPLETED,
            idempotency_key=idempotency_key,
            reference_type="REFUND",
            reference_id=reference_id,
            description=reason or "Naviigo Credit refund",
            metadata_json={"reference_id": reference_id},
        )
        self.db.add(tx)
        await self.db.flush()

        await self._sync_firestore_account(user.firebase_uid, account)
        await self._sync_firestore_transaction(user.firebase_uid, tx)

        return tx

    async def apply_coupon(
        self,
        user: User,
        code: str,
        booking_amount_minor: int,
    ) -> CouponApplyResponse:
        """
        Validate coupon code and calculate discount amount without double-redeeming.
        """
        clean_code = code.strip().upper()
        stmt = select(Coupon).where(Coupon.code == clean_code)
        coupon = await self.db.scalar(stmt)

        if coupon is None or not coupon.is_active:
            raise InvalidCouponError(f"Coupon '{clean_code}' is not valid or does not exist.")

        now = datetime.now(timezone.utc)
        if coupon.valid_from and coupon.valid_from > now:
            raise CouponExpiredError(f"Coupon '{clean_code}' is not active yet.")
        if coupon.valid_until and coupon.valid_until < now:
            raise CouponExpiredError(f"Coupon '{clean_code}' has expired.")

        if booking_amount_minor < coupon.min_booking_amount_minor:
            min_inr = coupon.min_booking_amount_minor / 100.0
            raise CouponMinBookingAmountError(
                f"Booking amount does not meet the minimum requirement of ₹{min_inr:.2f}."
            )

        if coupon.total_usage_limit is not None and coupon.current_usage_count >= coupon.total_usage_limit:
            raise CouponUsageLimitError("This coupon has reached its total usage limit.")

        redemption_count_stmt = (
            select(func.count())
            .select_from(CouponRedemption)
            .where(
                CouponRedemption.coupon_id == coupon.id,
                CouponRedemption.user_id == user.id,
            )
        )
        user_uses = (await self.db.scalar(redemption_count_stmt)) or 0
        if user_uses >= coupon.max_uses_per_user:
            raise CouponUsageLimitError(
                f"You have already redeemed coupon '{clean_code}' the maximum allowed times ({coupon.max_uses_per_user})."
            )

        if coupon.discount_type == CouponDiscountType.PERCENTAGE:
            raw_discount = (booking_amount_minor * coupon.discount_value) // 100
            if coupon.max_discount_minor is not None:
                discount = min(raw_discount, coupon.max_discount_minor)
            else:
                discount = min(raw_discount, booking_amount_minor)
        else:
            discount = min(coupon.discount_value, booking_amount_minor)

        final_amount = max(0, booking_amount_minor - discount)

        return CouponApplyResponse(
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            discount_amount_minor=discount,
            final_amount_minor=final_amount,
            description=coupon.description,
        )

    # ─── Firestore Read-Mirror Synchronizers ──────────────────────────────────
    async def _sync_firestore_account(self, firebase_uid: str, account: WalletAccount) -> None:
        """Mirrors the verified balance into Firestore so Flutter realtime streams stay updated."""
        try:
            from services.firebase_client import get_db
            from firebase_admin import firestore

            db = get_db()
            if not db:
                return

            def _write():
                ref = (
                    db.collection("users")
                    .document(firebase_uid)
                    .collection("wallet")
                    .document("account")
                )
                ref.set(
                    {
                        "availableMinor": account.available_minor,
                        "pendingMinor": account.pending_minor,
                        "currency": account.currency,
                        "rewardPoints": account.reward_points,
                        "isLocked": account.is_locked,
                        "updatedAt": firestore.SERVER_TIMESTAMP,
                    },
                    merge=True,
                )

            await asyncio.to_thread(_write)
        except Exception as e:
            logger.warning(
                "Firestore wallet account mirror failed (non-fatal)",
                extra={"firebase_uid": firebase_uid, "error": str(e)},
            )

    async def _sync_firestore_transaction(
        self, firebase_uid: str, tx: WalletTransaction
    ) -> None:
        """Mirrors the append-only ledger record to Firestore."""
        try:
            from services.firebase_client import get_db
            from firebase_admin import firestore

            db = get_db()
            if not db:
                return

            direction_str = "DEBIT" if tx.type == WalletTxType.DEBIT else "CREDIT"

            def _write():
                ref = (
                    db.collection("users")
                    .document(firebase_uid)
                    .collection("wallet_transactions")
                    .document(str(tx.id))
                )
                ref.set(
                    {
                        "transactionId": str(tx.id),
                        "userId": firebase_uid,
                        "type": tx.type.value,
                        "direction": direction_str,
                        "amountMinor": tx.amount_minor,
                        "balanceAfterMinor": tx.balance_after_minor,
                        "currency": "INR",
                        "status": "SUCCEEDED",
                        "source": "NAVIIGO_WALLET",
                        "referenceType": tx.reference_type,
                        "referenceId": tx.reference_id,
                        "idempotencyKey": tx.idempotency_key,
                        "description": tx.description,
                        "createdAt": firestore.SERVER_TIMESTAMP,
                    }
                )

            await asyncio.to_thread(_write)
        except Exception as e:
            logger.warning(
                "Firestore wallet transaction mirror failed (non-fatal)",
                extra={"firebase_uid": firebase_uid, "error": str(e)},
            )
