from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.db.models.enums import PaymentStatus, PaymentMethod

class PaymentCreate(BaseModel):
    booking_id: uuid.UUID
    method: PaymentMethod | None = None
    description: str | None = None
    idempotency_key: str = Field(..., description="Unique key for safe retries")

class PaymentRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str | None = None
    amount: Decimal
    amount_paid: Decimal | None = None
    amount_refunded: Decimal | None = None
    currency: str
    status: PaymentStatus
    method: PaymentMethod | None = None
    description: str | None = None
    idempotency_key: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RazorpayWebhookPayload(BaseModel):
    """
    Validation for incoming Razorpay webhooks.
    In practice, you need to verify the X-Razorpay-Signature header against the raw body.
    """
    event: str
    payload: dict
    created_at: int
