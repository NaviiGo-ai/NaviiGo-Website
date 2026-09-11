from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.db.models.enums import ItemKind, OfferStatus, SupplierKind

class SupplierRead(BaseModel):
    id: uuid.UUID
    name: str
    display_name: str
    kind: SupplierKind
    capabilities: dict
    is_active: bool

class SupplierOfferRead(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    external_id: str
    kind: ItemKind
    name: str
    description: str | None
    price: Decimal
    original_price: Decimal | None
    currency: str
    quantity: int
    city: str | None
    lat: float | None
    lng: float | None
    availability: dict
    terms: dict
    status: OfferStatus
    expires_at: datetime
    fetched_at: datetime

class OfferSearchQuery(BaseModel):
    kind: ItemKind
    city: str | None = None
    lat: float | None = None
    lng: float | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    max_price: Decimal | None = None
    currency: str = "USD"
