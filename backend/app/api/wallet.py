# ─── Wallet API ───────────────────────────────────────────────────────────────
# Handles server-authoritative wallet balance, transactional debits, refunds,
# and coupon verification.

from __future__ import annotations

from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUserId, DBSession
from app.core.errors import WalletError
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
    """Unavailable until checkout derives the amount from an owned booking."""
    raise WalletError(
        "Wallet checkout is not available yet.",
        code="WALLET_CHECKOUT_UNAVAILABLE",
        status_code=503,
    )


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
    """Unavailable until cancellation verifies the original debit and amount."""
    raise WalletError(
        "Wallet refunds are not available yet. Please contact support.",
        code="WALLET_REFUND_UNAVAILABLE",
        status_code=503,
    )


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
