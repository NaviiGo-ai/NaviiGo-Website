# ─── Wallet API ───────────────────────────────────────────────────────────────
# Handles server-authoritative wallet balance, transactional debits, refunds,
# and coupon verification.

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUserId, DBSession
from app.users.service import get_or_create_user
from app.wallet.schemas import (
    CouponApplyRequest,
    CouponApplyResponse,
    WalletAccountRead,
    WalletDebitRequest,
    WalletRefundRequest,
    WalletTransactionRead,
)
from app.wallet.service import WalletService

router = APIRouter(tags=["wallet"])


@router.post("/coupons/apply", response_model=CouponApplyResponse)
async def apply_coupon(
    payload: CouponApplyRequest,
    db: DBSession,
    firebase_uid: CurrentUserId,
) -> CouponApplyResponse:
    """Validate a coupon code and calculate applicable discount."""
    user = await get_or_create_user(db, firebase_uid)
    service = WalletService(db)
    result = await service.apply_coupon(
        user=user,
        code=payload.code,
        booking_amount_minor=payload.booking_amount_minor,
    )
    return result


@router.post(
    "/debit",
    response_model=WalletTransactionRead,
    status_code=status.HTTP_200_OK,
)
async def debit_wallet(
    payload: WalletDebitRequest,
    db: DBSession,
    firebase_uid: CurrentUserId,
) -> WalletTransactionRead:
    """Deduct balance from user's wallet with row locking and idempotency."""
    user = await get_or_create_user(db, firebase_uid)
    service = WalletService(db)
    tx = await service.debit_wallet(
        user=user,
        amount_minor=payload.amount_minor,
        reference_id=payload.reference_id,
        idempotency_key=payload.idempotency_key,
        description=payload.description,
    )
    await db.commit()
    return tx


@router.post(
    "/refund",
    response_model=WalletTransactionRead,
    status_code=status.HTTP_200_OK,
)
async def refund_wallet(
    payload: WalletRefundRequest,
    db: DBSession,
    firebase_uid: CurrentUserId,
) -> WalletTransactionRead:
    """Credit refund back to user's wallet with row locking and idempotency."""
    user = await get_or_create_user(db, firebase_uid)
    service = WalletService(db)
    tx = await service.refund_wallet(
        user=user,
        amount_minor=payload.amount_minor,
        reference_id=payload.reference_id,
        idempotency_key=payload.idempotency_key,
        reason=payload.reason,
    )
    await db.commit()
    return tx


@router.get("/account", response_model=WalletAccountRead)
async def get_wallet_account(
    db: DBSession,
    firebase_uid: CurrentUserId,
) -> WalletAccountRead:
    """Fetch authoritative wallet account."""
    user = await get_or_create_user(db, firebase_uid)
    service = WalletService(db)
    account = await service.get_or_create_account(user)
    await db.commit()
    return account


@router.get("/transactions", response_model=list[WalletTransactionRead])
async def get_wallet_transactions(
    db: DBSession,
    firebase_uid: CurrentUserId,
    limit: int = Query(50, ge=1, le=100),
) -> list[WalletTransactionRead]:
    """Fetch append-only transaction history."""
    user = await get_or_create_user(db, firebase_uid)
    service = WalletService(db)
    transactions = await service.get_transactions(user=user, limit=limit)
    return transactions
