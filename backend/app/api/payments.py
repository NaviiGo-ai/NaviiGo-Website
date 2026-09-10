# ─── Payments API ────────────────────────────────────────────────────────────
# Handles creating Razorpay orders, verifying payments, and webhooks.

from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Request, status, Header, HTTPException
from pydantic import BaseModel

from app.core.dependencies import CurrentUserId, DBSession
from app.payments.schemas import PaymentCreate, PaymentRead
from app.payments.service import PaymentService
from app.users.service import get_or_create_user
from app.core.errors import PaymentError

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/order", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment_order(
    payload: PaymentCreate,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> PaymentRead:
    user = await get_or_create_user(db, firebase_uid)
    service = PaymentService(db)

    payment = await service.create_payment_order(
        user=user,
        booking_id=payload.booking_id,
        idempotency_key=payload.idempotency_key,
        description=payload.description
    )
    await db.commit()
    return payment

@router.post("/verify", response_model=PaymentRead)
async def verify_payment(
    payload: PaymentVerifyRequest,
    db: DBSession,
    firebase_uid: CurrentUserId
) -> PaymentRead:
    # We load user to establish auth, although verification is theoretically bound to the order ID.
    _ = await get_or_create_user(db, firebase_uid)
    service = PaymentService(db)

    payment = await service.verify_payment(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )
    await db.commit()
    return payment

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    db: DBSession,
    x_razorpay_signature: str = Header(None)
):
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    raw_body = await request.body()
    service = PaymentService(db)

    try:
        await service.process_webhook(raw_body.decode('utf-8'), x_razorpay_signature)
        await db.commit()
    except PaymentError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "ok"}
