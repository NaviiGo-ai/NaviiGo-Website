"""Hermetic ledger checks. No Firebase, Razorpay, or production balance writes."""
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from sqlalchemy import func, select

from app.api import wallet as routes
from app.core.errors import (
    ForbiddenError, InsufficientBalanceError, WalletError, WalletLockedError,
)
from app.db.models.user import User
from app.db.models.wallet import WalletTransaction
from app.wallet.schemas import WalletDebitRequest, WalletRefundRequest
from app.wallet.service import WalletService


@pytest_asyncio.fixture
async def ledger(get_test_db, monkeypatch):
    monkeypatch.setattr(WalletService, "_sync_firestore_account", AsyncMock())
    monkeypatch.setattr(WalletService, "_sync_firestore_transaction", AsyncMock())
    users = [User(firebase_uid=f"wallet-pilot-{suffix}") for suffix in ("a", "b")]
    get_test_db.add_all(users)
    await get_test_db.flush()
    service = WalletService(get_test_db)
    account = await service.get_or_create_account(users[0])
    account.available_minor = 100_000  # INR 1,000; ephemeral test fixture only.
    await get_test_db.flush()
    return service, users, account


@pytest.mark.asyncio
async def test_debit_refund_retries_and_owner_history(ledger):
    service, (user, other), account = ledger
    debit = await service.debit_wallet(user, 25_000, "test-booking", "test-debit")
    assert account.available_minor == 75_000
    assert (await service.debit_wallet(user, 25_000, "test-booking", "test-debit")).id == debit.id
    assert account.available_minor == 75_000
    refund = await service.refund_wallet(user, 25_000, "test-booking", "test-refund")
    assert account.available_minor == 100_000
    assert (await service.refund_wallet(user, 25_000, "test-booking", "test-refund")).id == refund.id
    assert account.available_minor == 100_000
    assert len(await service.get_transactions(user)) == 2
    assert await service.get_transactions(other) == []


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["debit_wallet", "refund_wallet"])
async def test_replay_cannot_expose_another_users_transaction(ledger, operation):
    service, (user, other), _ = ledger
    await getattr(service, operation)(user, 100, "booking", "owned-key")
    with pytest.raises(ForbiddenError):
        await getattr(service, operation)(other, 100, "booking", "owned-key")


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["debit_wallet", "refund_wallet"])
@pytest.mark.parametrize("change", ["amount", "reference", "operation"])
async def test_replay_requires_same_transaction(ledger, operation, change):
    service, (user, _), account = ledger
    await getattr(service, operation)(user, 100, "booking", "replay-key")
    balance = account.available_minor
    method = operation
    if change == "operation":
        method = "refund_wallet" if operation == "debit_wallet" else "debit_wallet"
    with pytest.raises(WalletError) as error:
        await getattr(service, method)(
            user, 101 if change == "amount" else 100,
            "other" if change == "reference" else "booking", "replay-key",
        )
    assert error.value.code == "IDEMPOTENCY_CONFLICT"
    assert account.available_minor == balance
    assert await service.db.scalar(select(func.count()).select_from(WalletTransaction)) == 1


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["debit_wallet", "refund_wallet"])
@pytest.mark.parametrize("amount", [0, -1])
async def test_nonpositive_amounts_rejected(ledger, operation, amount):
    service, (user, _), account = ledger
    with pytest.raises(ValueError):
        await getattr(service, operation)(user, amount)
    assert account.available_minor == 100_000


@pytest.mark.asyncio
async def test_insufficient_funds_leave_balance_unchanged(ledger):
    service, (user, _), account = ledger
    with pytest.raises(InsufficientBalanceError):
        await service.debit_wallet(user, 100_001)
    assert account.available_minor == 100_000


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["debit_wallet", "refund_wallet"])
async def test_locked_account_cannot_mutate(ledger, operation):
    service, (user, _), account = ledger
    account.is_locked = True
    with pytest.raises(WalletLockedError):
        await getattr(service, operation)(user, 100)
    assert account.available_minor == 100_000


@pytest.mark.asyncio
@pytest.mark.parametrize("operation,schema,code", [
    ("debit_wallet", WalletDebitRequest, "WALLET_CHECKOUT_UNAVAILABLE"),
    ("refund_wallet", WalletRefundRequest, "WALLET_REFUND_UNAVAILABLE"),
])
async def test_public_mutation_is_unavailable_without_touching_ledger(monkeypatch, operation, schema, code):
    lookup = AsyncMock()
    monkeypatch.setattr(routes, "get_or_create_user", lookup)
    db = AsyncMock()
    with pytest.raises(WalletError) as error:
        await getattr(routes, operation)(schema(amountMinor=25000), db, "pilot-user")
    assert error.value.status_code == 503
    assert error.value.code == code
    lookup.assert_not_called()
    db.commit.assert_not_called()
