# ─── Supplier abstraction: suppliers, offers, transactions ───────────────────
# The supplier layer normalizes external inventory into SupplierOffer rows with
# a TTL (expires_at) and full raw_payload capture for audit. SupplierTransaction
# records every outbound call (idempotency key + response) so outages are
# diagnosable and retries are safe.
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, JsonB, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.models.enums import (
    ItemKind,
    OfferStatus,
    SupplierKind,
    SupplierTxType,
    TransactionStatus,
)


class Supplier(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(String(80), unique=True)  # "travelpayouts"
    display_name: Mapped[str] = mapped_column(String(120))
    kind: Mapped[SupplierKind] = mapped_column(default=SupplierKind.LIVE_API)

    base_url: Mapped[str | None] = mapped_column(String(512))
    # Name of the env var holding credentials — never the secret itself.
    credentials_ref: Mapped[str | None] = mapped_column(String(80))

    is_active: Mapped[bool] = mapped_column(default=True)
    capabilities: Mapped[dict] = mapped_column(JsonB, default=dict)  # which ItemKinds it can book


class SupplierOffer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "supplier_offers"
    __table_args__ = (
        UniqueConstraint("supplier_id", "external_id", name="uq_supplier_external"),
    )

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), index=True
    )
    external_id: Mapped[str] = mapped_column(String(160))
    kind: Mapped[ItemKind] = mapped_column(default=ItemKind.ACTIVITY, index=True)

    name: Mapped[str] = mapped_column(String(240))
    description: Mapped[str | None] = mapped_column(Text)

    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))
    quantity: Mapped[int] = mapped_column(SmallInteger, default=1)

    city: Mapped[str | None] = mapped_column(String(120), index=True)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)

    # Availability / terms come from the supplier; stored verbatim + normalized.
    availability: Mapped[dict] = mapped_column(JsonB, default=dict)
    terms: Mapped[dict] = mapped_column(JsonB, default=dict)

    # The raw supplier response, captured for audit and reconciliation.
    raw_payload: Mapped[dict] = mapped_column(JsonB, default=dict)

    status: Mapped[OfferStatus] = mapped_column(default=OfferStatus.VALID, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime)


class SupplierTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "supplier_transactions"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), index=True
    )
    offer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("supplier_offers.id", ondelete="SET NULL")
    )
    tx_type: Mapped[SupplierTxType] = mapped_column(index=True)

    # Client-generated idempotency key for the supplier call (safe retries).
    idempotency_key: Mapped[str | None] = mapped_column(
        String(160), unique=True, index=True
    )
    supplier_request_id: Mapped[str | None] = mapped_column(String(160), index=True)

    request_payload: Mapped[dict] = mapped_column(JsonB, default=dict)
    response_payload: Mapped[dict] = mapped_column(JsonB, default=dict)

    status: Mapped[TransactionStatus] = mapped_column(default=TransactionStatus.PENDING)
    http_status: Mapped[int | None] = mapped_column(Integer)
    error_code: Mapped[str | None] = mapped_column(String(80))
    error_message: Mapped[str | None] = mapped_column(Text)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
