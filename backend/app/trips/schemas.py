# ─── Trip API schemas (Pydantic v2) ──────────────────────────────────────────
# Request schemas are strict: enums, ranges, and no free-form money. Response
# schemas carry provenance (source_type) so the UI can label data honestly.
from __future__ import annotations

import uuid
from datetime import date as _date_cls
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.db.models.enums import SourceType, TripStatus

GroupType = Literal["solo", "couple", "family", "friends"]


# ── Create / update ──────────────────────────────────────────────────────────
class TripPreferenceIn(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=30)
    dietary_preferences: list[str] = Field(default_factory=list, max_length=20)
    accessibility_needs: list[str] = Field(default_factory=list, max_length=20)
    pace: Literal["relaxed", "balanced", "packed"] | None = None
    hotel_area: str | None = Field(default=None, max_length=120)
    must_do: list[str] = Field(default_factory=list, max_length=30)


class TripCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    destination_name: str = Field(min_length=1, max_length=200)
    destination_city: str | None = Field(default=None, max_length=120)
    destination_country: str | None = Field(default=None, max_length=120)
    origin_city: str | None = Field(default=None, max_length=120)

    start_date: _date_cls | None = None
    end_date: _date_cls | None = None
    duration_days: int = Field(default=1, ge=1, le=14)

    group_type: GroupType | None = None
    travel_purpose: str | None = Field(default=None, max_length=40)

    # Money as Decimal, server-side default currency from settings.
    budget_total: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)

    preferences: TripPreferenceIn | None = None
    # Free-form product payload (map center, logistics, AI context…)
    data: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def _dates_consistent(self) -> "TripCreate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        return self


class TripUpdate(BaseModel):
    """Partial update — only provided fields are changed."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    destination_name: str | None = Field(default=None, min_length=1, max_length=200)
    destination_city: str | None = Field(default=None, max_length=120)
    destination_country: str | None = Field(default=None, max_length=120)
    origin_city: str | None = Field(default=None, max_length=120)
    start_date: _date_cls | None = None
    end_date: _date_cls | None = None
    duration_days: int | None = Field(default=None, ge=1, le=14)
    group_type: GroupType | None = None
    travel_purpose: str | None = Field(default=None, max_length=40)
    budget_total: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    data: dict | None = None
    preferences: TripPreferenceIn | None = None


class TripStatusUpdate(BaseModel):
    status: TripStatus
    reason: str | None = Field(default=None, max_length=200)


# ── Days / items ─────────────────────────────────────────────────────────────
class TripDayIn(BaseModel):
    date: _date_cls | None = None
    title: str | None = Field(default=None, max_length=160)
    is_transit_day: bool = False


class TripItemIn(BaseModel):
    position: int = Field(default=0, ge=0)
    item_type: Literal["attraction", "restaurant", "hotel", "transit", "activity", "stay"]
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None

    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    coords_source: SourceType = SourceType.AI_GENERATED

    slot: Literal["morning", "afternoon", "evening"] | None = None
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    duration_minutes: int | None = Field(default=None, ge=0, le=24 * 60)

    category: str | None = Field(default=None, max_length=80)
    is_must_do: bool = False

    # Pricing tagged with provenance, e.g. {"entryFee": 500, "source": "AI_GENERATED"}
    pricing: dict = Field(default_factory=dict)
    source_type: SourceType = SourceType.AI_GENERATED
    metadata: dict = Field(default_factory=dict)


class TripItemUpdate(BaseModel):
    position: int | None = Field(default=None, ge=0)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    slot: Literal["morning", "afternoon", "evening"] | None = None
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    duration_minutes: int | None = Field(default=None, ge=0, le=24 * 60)
    is_must_do: bool | None = None
    pricing: dict | None = None


# ── Response schemas ─────────────────────────────────────────────────────────
class BudgetCategory(BaseModel):
    category: str
    label: str
    planned: Decimal = Decimal("0")
    booked: Decimal = Decimal("0")
    source: SourceType = SourceType.UNAVAILABLE
    item_count: int = 0


class TripBudget(BaseModel):
    currency: str = "INR"
    total_planned: Decimal = Decimal("0")
    total_booked: Decimal = Decimal("0")
    budget_total: Decimal | None = None
    remaining: Decimal | None = None
    contingency: Decimal = Decimal("0")       # 5% of planned, kept aside
    categories: list[BudgetCategory] = Field(default_factory=list)
    source: SourceType = SourceType.ESTIMATED


class TripItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    position: int
    item_type: str
    name: str
    description: str | None = None
    lat: float | None = None
    lng: float | None = None
    coords_source: SourceType
    slot: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration_minutes: int | None = None
    category: str | None = None
    is_must_do: bool
    pricing: dict = Field(default_factory=dict)
    source_type: SourceType
    supplier_offer_id: uuid.UUID | None = None
    booking_id: uuid.UUID | None = None
    metadata: dict = Field(
        default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata"
    )


class TripDayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    day_number: int
    date: _date_cls | None = None
    title: str | None = None
    is_transit_day: bool
    weather: dict = Field(default_factory=dict)
    items: list[TripItemRead] = Field(default_factory=list)


class TripRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    destination_name: str
    destination_city: str | None = None
    destination_country: str | None = None
    origin_city: str | None = None
    start_date: _date_cls | None = None
    end_date: _date_cls | None = None
    duration_days: int
    group_type: str | None = None
    travel_purpose: str | None = None
    budget_total: Decimal | None = None
    currency: str
    status: TripStatus
    status_reason: str | None = None
    source_type: SourceType
    version: int
    data: dict = Field(default_factory=dict)
    budget: TripBudget | None = None
    created_at: datetime
    updated_at: datetime

    # Filled by the serializer (relationships, not on the ORM row).
    days: list[TripDayRead] = Field(default_factory=list)
    preferences: TripPreferenceRead | None = None


class TripPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    interests: list[str] = Field(default_factory=list)
    dietary_preferences: list[str] = Field(default_factory=list)
    accessibility_needs: list[str] = Field(default_factory=list)
    pace: str | None = None
    hotel_area: str | None = None
    must_do: list[str] = Field(default_factory=list)


class TripSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    destination_name: str
    destination_city: str | None = None
    start_date: _date_cls | None = None
    end_date: _date_cls | None = None
    duration_days: int
    status: TripStatus
    source_type: SourceType
    version: int
    updated_at: datetime


class TripVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version_number: int
    change_description: str | None = None
    action_id: str | None = None
    created_by: str
    created_at: datetime
