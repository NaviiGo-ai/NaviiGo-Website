from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.enums import CouponDiscountType, WalletTxStatus, WalletTxType


class CouponApplyRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str
    booking_amount_minor: int = Field(..., alias="bookingAmountMinor", ge=0)


class CouponApplyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: str
    discount_type: CouponDiscountType = Field(..., alias="discountType")
    discount_value: int = Field(..., alias="discountValue")
    discount_amount_minor: int = Field(..., alias="discountAmountMinor")
    final_amount_minor: int = Field(..., alias="finalAmountMinor")
    description: Optional[str] = None


class WalletDebitRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    amount_minor: int = Field(..., alias="amountMinor", gt=0)
    reference_id: Optional[str] = Field(None, alias="referenceId")
    idempotency_key: Optional[str] = Field(None, alias="idempotencyKey")
    description: Optional[str] = "Naviigo Credit debit"


class WalletRefundRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    amount_minor: int = Field(..., alias="amountMinor", gt=0)
    reference_id: Optional[str] = Field(None, alias="referenceId")
    idempotency_key: Optional[str] = Field(None, alias="idempotencyKey")
    reason: Optional[str] = "Naviigo Credit refund"


class WalletAccountRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID = Field(..., alias="userId")
    available_minor: int = Field(..., alias="availableMinor")
    pending_minor: int = Field(..., alias="pendingMinor")
    reward_points: int = Field(..., alias="rewardPoints")
    currency: str = "INR"
    is_locked: bool = Field(False, alias="isLocked")
    lock_reason: Optional[str] = Field(None, alias="lockReason")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class WalletTransactionRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: uuid.UUID = Field(..., alias="transactionId")
    wallet_id: uuid.UUID = Field(..., alias="walletId")
    user_id: uuid.UUID = Field(..., alias="userId")
    type: WalletTxType
    direction: str = "+"
    amount_minor: int = Field(..., alias="amountMinor")
    balance_after_minor: int = Field(..., alias="balanceAfterMinor")
    status: WalletTxStatus
    idempotency_key: Optional[str] = Field(None, alias="idempotencyKey")
    reference_type: str = Field(..., alias="referenceType")
    reference_id: Optional[str] = Field(None, alias="referenceId")
    description: str
    metadata_json: dict[str, Any] = Field(default_factory=dict, alias="metadataJson")
    created_at: datetime = Field(..., alias="createdAt")
