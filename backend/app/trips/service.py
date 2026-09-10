# ─── Trip service ────────────────────────────────────────────────────────────
# The server owns Trip state. Every mutation here:
#   1. validates the caller owns the trip (ownership enforced in the router),
#   2. snapshots the current state into trip_versions (undo / audit / analytics),
#   3. records a TripEvent,
#   4. applies the change.
# The browser never mutates trip state directly — it calls these endpoints.
from __future__ import annotations

import uuid
from datetime import datetime, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import InvalidStateTransition, TripNotFoundError
from app.db.models import (
    Trip,
    TripDay,
    TripEvent,
    TripItem,
    TripPreference,
    TripVersion,
    User,
)
from app.db.models.enums import ActorType, SourceType, TripStatus
from app.trips.budget import BudgetResult, compute_budget
from app.trips.schemas import (
    BudgetCategory,
    TripBudget,
    TripCreate,
    TripDayIn,
    TripDayRead,
    TripItemIn,
    TripItemRead,
    TripItemUpdate,
    TripPreferenceIn,
    TripPreferenceRead,
    TripRead,
    TripStatusUpdate,
    TripSummary,
    TripUpdate,
    TripVersionRead,
)

# ── Lifecycle state machine ──────────────────────────────────────────────────
# READY cannot go straight to BOOKED: bookings are created one item at a time,
# which moves the trip to PARTIALLY_BOOKED first (enforced by the booking
# service). Terminal states (COMPLETED / CANCELLED / ARCHIVED) never reopen.
_TRANSITIONS: dict[TripStatus, set[TripStatus]] = {
    TripStatus.DRAFT: {TripStatus.PLANNING, TripStatus.CANCELLED, TripStatus.ARCHIVED},
    TripStatus.PLANNING: {TripStatus.READY, TripStatus.DRAFT, TripStatus.CANCELLED},
    TripStatus.READY: {TripStatus.PLANNING, TripStatus.PARTIALLY_BOOKED, TripStatus.CANCELLED},
    TripStatus.PARTIALLY_BOOKED: {TripStatus.BOOKED, TripStatus.READY, TripStatus.CANCELLED},
    TripStatus.BOOKED: {TripStatus.PARTIALLY_BOOKED, TripStatus.IN_PROGRESS, TripStatus.CANCELLED},
    TripStatus.IN_PROGRESS: {TripStatus.COMPLETED, TripStatus.CANCELLED},
    TripStatus.COMPLETED: set(),
    TripStatus.CANCELLED: set(),
    TripStatus.ARCHIVED: set(),
}


def _load_options():
    return (
        selectinload(Trip.days).selectinload(TripDay.items),
        selectinload(Trip.preferences),
    )


class TripService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Queries ────────────────────────────────────────────────────────────
    async def get(self, trip_id: uuid.UUID) -> Trip:
        trip = await self.db.scalar(
            select(Trip).options(*_load_options()).where(Trip.id == trip_id)
        )
        if trip is None:
            raise TripNotFoundError()
        return trip

    async def list_for_user(self, user_id: uuid.UUID) -> list[Trip]:
        result = await self.db.scalars(
            select(Trip)
            .where(Trip.user_id == user_id)
            .order_by(Trip.updated_at.desc())
        )
        return list(result)

    async def versions(self, trip: Trip) -> list[TripVersion]:
        result = await self.db.scalars(
            select(TripVersion)
            .where(TripVersion.trip_id == trip.id)
            .order_by(TripVersion.version_number.desc())
        )
        return list(result)

    # ── Create / update ────────────────────────────────────────────────────
    async def create(self, user: User, payload: TripCreate) -> Trip:
        trip = Trip(
            user_id=user.id,
            title=payload.title,
            destination_name=payload.destination_name,
            destination_city=payload.destination_city,
            destination_country=payload.destination_country,
            origin_city=payload.origin_city,
            start_date=payload.start_date,
            end_date=payload.end_date,
            duration_days=payload.duration_days,
            group_type=payload.group_type,
            travel_purpose=payload.travel_purpose,
            budget_total=payload.budget_total,
            currency=payload.currency,
            status=TripStatus.DRAFT,
            source_type=SourceType.USER_PROVIDED,
            data=payload.data or {},
        )
        # A trip created with preferences is already being planned, not a bare draft.
        if payload.preferences is not None:
            trip.status = TripStatus.PLANNING
        self.db.add(trip)
        await self.db.flush()

        if payload.preferences is not None:
            self.db.add(
                TripPreference(
                    trip_id=trip.id,
                    **_pref_dict(payload.preferences),
                )
            )
        await self._record_event(trip, user.id, "trip.created", actor=ActorType.USER)
        await self.db.flush()
        return await self._reload(trip)

    async def update(self, trip: Trip, user_id: uuid.UUID, payload: TripUpdate) -> Trip:
        changes = payload.model_dump(exclude_unset=True)
        pref_payload = changes.pop("preferences", None)

        if changes:
            await self._snapshot(trip, "Updated trip details", ActorType.USER)
            for field, value in changes.items():
                setattr(trip, field, value)
            self.db.add(trip)

        if pref_payload is not None:
            await self._snapshot(trip, "Updated trip preferences", ActorType.USER)
            if trip.preferences is None:
                trip.preferences = TripPreference(trip_id=trip.id, **_pref_dict(pref_payload))
            else:
                for field, value in _pref_dict(pref_payload).items():
                    setattr(trip.preferences, field, value)
                self.db.add(trip.preferences)

        await self._record_event(trip, user_id, "trip.updated", actor=ActorType.USER)
        await self.db.flush()
        return await self._reload(trip)

    # ── Lifecycle ──────────────────────────────────────────────────────────
    async def transition(self, trip: Trip, user_id: uuid.UUID,
                         payload: TripStatusUpdate) -> Trip:
        target = payload.status
        if target == trip.status:
            return trip
        prev = trip.status
        allowed = _TRANSITIONS.get(trip.status, set())
        if target not in allowed:
            raise InvalidStateTransition(
                f"Cannot move a {trip.status.value} trip to {target.value}."
            )
        await self._snapshot(
            trip, f"Status {trip.status.value} → {target.value}", ActorType.USER
        )
        trip.status = target
        trip.status_reason = payload.reason
        self.db.add(trip)
        await self._record_event(
            trip, user_id, "trip.status_changed",
            actor=ActorType.USER, payload={"to": target.value, "from": prev.value},
        )
        await self.db.flush()
        return await self._reload(trip)

    # ── Days ───────────────────────────────────────────────────────────────
    async def add_day(self, trip: Trip, user_id: uuid.UUID, payload: TripDayIn) -> Trip:
        await self._snapshot(trip, "Added a day", ActorType.USER)
        max_day = max((d.day_number for d in trip.days), default=0)
        self.db.add(
            TripDay(
                trip_id=trip.id,
                day_number=max_day + 1,
                date=payload.date,
                title=payload.title,
                is_transit_day=payload.is_transit_day,
            )
        )
        await self._record_event(trip, user_id, "trip.day_added", actor=ActorType.USER)
        await self.db.flush()
        return await self._reload(trip)

    # ── Items ──────────────────────────────────────────────────────────────
    async def add_item(self, trip: Trip, user_id: uuid.UUID, day_id: uuid.UUID,
                       payload: TripItemIn) -> Trip:
        day = next((d for d in trip.days if d.id == day_id), None)
        if day is None:
            raise TripNotFoundError(f"Day {day_id} not found on this trip.")

        await self._snapshot(trip, f"Added '{payload.name}'", ActorType.USER)
        self.db.add(
            TripItem(
                trip_id=trip.id,
                day_id=day.id,
                position=payload.position,
                item_type=payload.item_type,
                name=payload.name,
                description=payload.description,
                lat=payload.lat,
                lng=payload.lng,
                coords_source=payload.coords_source,
                slot=payload.slot,
                start_time=_parse_time(payload.start_time),
                end_time=_parse_time(payload.end_time),
                duration_minutes=payload.duration_minutes,
                category=payload.category,
                is_must_do=payload.is_must_do,
                pricing=payload.pricing,
                source_type=payload.source_type,
                metadata_json=payload.metadata,
            )
        )
        await self._record_event(
            trip, user_id, "trip.item_added",
            actor=ActorType.USER, payload={"item": payload.name, "type": payload.item_type},
        )
        await self.db.flush()
        return await self._reload(trip)

    async def update_item(self, trip: Trip, user_id: uuid.UUID, item_id: uuid.UUID,
                          payload: TripItemUpdate) -> Trip:
        item = await self._get_item(trip, item_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            return trip

        await self._snapshot(trip, f"Updated '{item.name}'", ActorType.USER)
        for field, value in changes.items():
            if field in ("start_time", "end_time"):
                setattr(item, field, _parse_time(value))
            else:
                setattr(item, field, value)
        self.db.add(item)
        await self._record_event(trip, user_id, "trip.item_updated", actor=ActorType.USER,
                                 payload={"item_id": str(item_id)})
        await self.db.flush()
        return await self._reload(trip)

    async def remove_item(self, trip: Trip, user_id: uuid.UUID, item_id: uuid.UUID) -> Trip:
        item = await self._get_item(trip, item_id)
        if item.booking_id is not None:
            raise InvalidStateTransition(
                "This item is booked — cancel the booking before removing it."
            )
        await self._snapshot(trip, f"Removed '{item.name}'", ActorType.USER)
        await self.db.delete(item)
        await self._record_event(trip, user_id, "trip.item_removed", actor=ActorType.USER,
                                 payload={"item_id": str(item_id), "name": item.name})
        await self.db.flush()
        return await self._reload(trip)

    # ── Undo / versions ────────────────────────────────────────────────────
    async def undo(self, trip: Trip, user_id: uuid.UUID) -> Trip:
        latest = await self.db.scalar(
            select(TripVersion)
            .where(TripVersion.trip_id == trip.id)
            .order_by(TripVersion.version_number.desc())
        )
        if latest is None:
            raise InvalidStateTransition("Nothing to undo — this trip has no previous version.")

        await self._restore(trip, latest.snapshot)
        trip.version = max(latest.version_number, 1)
        trip.current_version_id = None
        # Keep the snapshot row for the audit trail — re-label it as consumed so
        # the version history still reads correctly after an undo.
        latest.change_description = (
            f"UNDONE — restored from version {latest.version_number} "
            f"({latest.change_description or 'snapshot'})"
        )
        self.db.add(trip)
        self.db.add(latest)
        await self._record_event(trip, user_id, "trip.undone", actor=ActorType.USER,
                                 payload={"restored_version": latest.version_number})
        await self.db.flush()
        return await self._reload(trip)

    # ── Budget ─────────────────────────────────────────────────────────────
    def budget(self, trip: Trip) -> TripBudget:
        result: BudgetResult = compute_budget(
            [i for d in trip.days for i in d.items],
            currency=trip.currency,
            budget_total=trip.budget_total,
        )
        return TripBudget(
            currency=result.currency,
            total_planned=result.total_planned,
            total_booked=result.total_booked,
            budget_total=result.budget_total,
            remaining=result.remaining,
            contingency=result.contingency,
            source=result.source,
            categories=[
                BudgetCategory(
                    category=c.category, label=c.label, planned=c.planned,
                    booked=c.booked, source=c.source, item_count=c.item_count,
                )
                for c in result.categories
            ],
        )

    # ── Serialization ──────────────────────────────────────────────────────
    def to_read(self, trip: Trip, include_budget: bool = True) -> TripRead:
        days = [
            TripDayRead(
                id=d.id, day_number=d.day_number, date=d.date, title=d.title,
                is_transit_day=d.is_transit_day, weather=d.weather,
                items=[TripItemRead.model_validate(i) for i in d.items],
            )
            for d in trip.days
        ]
        return TripRead(
            id=trip.id,
            title=trip.title,
            destination_name=trip.destination_name,
            destination_city=trip.destination_city,
            destination_country=trip.destination_country,
            origin_city=trip.origin_city,
            start_date=trip.start_date,
            end_date=trip.end_date,
            duration_days=trip.duration_days,
            group_type=trip.group_type,
            travel_purpose=trip.travel_purpose,
            budget_total=trip.budget_total,
            currency=trip.currency,
            status=trip.status,
            status_reason=trip.status_reason,
            source_type=trip.source_type,
            version=trip.version,
            data=trip.data,
            budget=self.budget(trip) if include_budget else None,
            days=days,
            preferences=(
                TripPreferenceRead.model_validate(trip.preferences)
                if trip.preferences else None
            ),
            created_at=trip.created_at,
            updated_at=trip.updated_at,
        )

    def to_summary(self, trip: Trip) -> TripSummary:
        return TripSummary(
            id=trip.id, title=trip.title, destination_name=trip.destination_name,
            destination_city=trip.destination_city, start_date=trip.start_date,
            end_date=trip.end_date, duration_days=trip.duration_days,
            status=trip.status, source_type=trip.source_type,
            version=trip.version, updated_at=trip.updated_at,
        )

    def to_version(self, version: TripVersion) -> TripVersionRead:
        return TripVersionRead(
            id=version.id, version_number=version.version_number,
            change_description=version.change_description,
            action_id=version.action_id,
            created_by=version.created_by.value,
            created_at=version.created_at,
        )

    # ── Internal helpers ───────────────────────────────────────────────────
    async def _reload(self, trip: Trip) -> Trip:
        """Re-fetch with relationships after flush.

        The session identity map would otherwise hand back the same object
        with its already-loaded (now stale) relationship collections, so we
        expire it first to force selectinload to re-populate days/items.
        """
        trip_id = trip.id
        self.db.expire(trip)
        return await self.db.scalar(
            select(Trip).options(*_load_options()).where(Trip.id == trip_id)
        )

    async def _get_item(self, trip: Trip, item_id: uuid.UUID) -> TripItem:
        for day in trip.days:
            for item in day.items:
                if item.id == item_id:
                    return item
        raise TripNotFoundError(f"Item {item_id} not found on this trip.")

    async def _snapshot(self, trip: Trip, description: str | None,
                        actor: ActorType) -> TripVersion:
        snapshot = self._serialize_for_snapshot(trip)
        version = TripVersion(
            trip_id=trip.id,
            version_number=trip.version,
            snapshot=snapshot,
            change_description=description,
            created_by=actor,
        )
        self.db.add(version)
        await self.db.flush()
        trip.version = trip.version + 1
        trip.current_version_id = version.id
        self.db.add(trip)
        return version

    def _serialize_for_snapshot(self, trip: Trip) -> dict:
        return {
            "title": trip.title,
            "destination_name": trip.destination_name,
            "destination_city": trip.destination_city,
            "destination_country": trip.destination_country,
            "origin_city": trip.origin_city,
            "start_date": trip.start_date.isoformat() if trip.start_date else None,
            "end_date": trip.end_date.isoformat() if trip.end_date else None,
            "duration_days": trip.duration_days,
            "group_type": trip.group_type,
            "travel_purpose": trip.travel_purpose,
            "budget_total": str(trip.budget_total) if trip.budget_total is not None else None,
            "currency": trip.currency,
            "status": trip.status.value,
            "status_reason": trip.status_reason,
            "source_type": trip.source_type.value,
            "data": trip.data,
            "preferences": (
                {
                    "interests": trip.preferences.interests,
                    "dietary_preferences": trip.preferences.dietary_preferences,
                    "accessibility_needs": trip.preferences.accessibility_needs,
                    "pace": trip.preferences.pace,
                    "hotel_area": trip.preferences.hotel_area,
                    "must_do": trip.preferences.must_do,
                    "browsing_signals": trip.preferences.browsing_signals,
                }
                if trip.preferences else None
            ),
            "days": [
                {
                    "day_number": d.day_number,
                    "date": d.date.isoformat() if d.date else None,
                    "title": d.title,
                    "is_transit_day": d.is_transit_day,
                    "weather": d.weather,
                    "items": [
                        {
                            "position": i.position,
                            "item_type": i.item_type,
                            "name": i.name,
                            "description": i.description,
                            "lat": i.lat,
                            "lng": i.lng,
                            "coords_source": i.coords_source.value,
                            "slot": i.slot,
                            "start_time": i.start_time.isoformat() if i.start_time else None,
                            "end_time": i.end_time.isoformat() if i.end_time else None,
                            "duration_minutes": i.duration_minutes,
                            "category": i.category,
                            "is_must_do": i.is_must_do,
                            "pricing": i.pricing,
                            "source_type": i.source_type.value,
                            "supplier_offer_id": (
                                str(i.supplier_offer_id) if i.supplier_offer_id else None
                            ),
                            "booking_id": str(i.booking_id) if i.booking_id else None,
                            "metadata": i.metadata_json,
                        }
                        for i in d.items
                    ],
                }
                for d in trip.days
            ],
        }

    async def _restore(self, trip: Trip, snapshot: dict) -> None:
        """Replace trip contents with a snapshot (used by undo)."""
        # Remove existing days through the collection (delete-orphan cascade
        # also removes items) and commit BEFORE re-inserting: the unit of work
        # would otherwise insert the new (trip_id, day_number) rows before the
        # old ones were deleted.
        trip.days.clear()
        await self.db.flush()

        def iso_or_none(key: str):
            value = snapshot.get(key)
            return datetime.fromisoformat(value) if value else None

        # Scalar fields
        for field in (
            "title", "destination_name", "destination_city", "destination_country",
            "origin_city", "duration_days", "group_type", "travel_purpose",
            "currency", "status_reason", "data",
        ):
            if field in snapshot:
                setattr(trip, field, snapshot[field])
        trip.start_date = iso_or_none("start_date")
        trip.end_date = iso_or_none("end_date")
        trip.budget_total = Decimal_safe(snapshot.get("budget_total"))
        if "status" in snapshot:
            trip.status = TripStatus(snapshot["status"])
        if "source_type" in snapshot:
            trip.source_type = _source_type(snapshot["source_type"])

        # Preferences
        pref = snapshot.get("preferences")
        if pref:
            if trip.preferences is None:
                trip.preferences = TripPreference(trip_id=trip.id, **pref)
            else:
                for key, value in pref.items():
                    setattr(trip.preferences, key, value)
                self.db.add(trip.preferences)

        # Days + items
        for day_data in snapshot.get("days", []):
            day = TripDay(
                trip_id=trip.id,
                day_number=day_data["day_number"],
                date=iso_or_none_from(day_data.get("date")),
                title=day_data.get("title"),
                is_transit_day=day_data.get("is_transit_day", False),
                weather=day_data.get("weather") or {},
            )
            self.db.add(day)
            await self.db.flush()
            for item_data in day_data.get("items", []):
                self.db.add(
                    TripItem(
                        trip_id=trip.id,
                        day_id=day.id,
                        position=item_data.get("position", 0),
                        item_type=item_data["item_type"],
                        name=item_data["name"],
                        description=item_data.get("description"),
                        lat=item_data.get("lat"),
                        lng=item_data.get("lng"),
                        coords_source=_source_type(item_data.get("coords_source")),
                        slot=item_data.get("slot"),
                        start_time=parse_time_from_iso(item_data.get("start_time")),
                        end_time=parse_time_from_iso(item_data.get("end_time")),
                        duration_minutes=item_data.get("duration_minutes"),
                        category=item_data.get("category"),
                        is_must_do=item_data.get("is_must_do", False),
                        pricing=item_data.get("pricing") or {},
                        source_type=_source_type(item_data.get("source_type")),
                        supplier_offer_id=_uuid_or_none(item_data.get("supplier_offer_id")),
                        booking_id=_uuid_or_none(item_data.get("booking_id")),
                        metadata_json=item_data.get("metadata") or {},
                    )
                )
        await self.db.flush()

    async def _record_event(self, trip: Trip, user_id: uuid.UUID | None,
                            event_type: str, *, actor: ActorType,
                            payload: dict | None = None) -> None:
        self.db.add(
            TripEvent(
                trip_id=trip.id,
                user_id=user_id,
                event_type=event_type,
                actor=actor,
                payload=payload or {},
            )
        )


# ── Module-level helpers ─────────────────────────────────────────────────────

def _pref_dict(pref: TripPreferenceIn | dict) -> dict:
    """Normalize a preference payload to the model's column dict.

    Accepts both the schema object and the plain dict that
    ``TripUpdate.model_dump(exclude_unset=True)`` produces for nested models.
    """
    if isinstance(pref, dict):
        get = pref.get
    else:
        get = lambda key: getattr(pref, key, None)  # noqa: E731
    return {
        "interests": get("interests") or [],
        "dietary_preferences": get("dietary_preferences") or [],
        "accessibility_needs": get("accessibility_needs") or [],
        "pace": get("pace"),
        "hotel_area": get("hotel_area"),
        "must_do": get("must_do") or [],
    }


def _parse_time(value: str | None) -> time | None:
    if not value:
        return None
    hour, minute = (int(part) for part in value.split(":"))
    return time(hour=hour, minute=minute)


def parse_time_from_iso(value: str | None) -> time | None:
    if not value:
        return None
    return datetime.fromisoformat(value).time()


def iso_or_none_from(value: str | None):
    return datetime.fromisoformat(value).date() if value else None


def _uuid_or_none(value: str | None) -> uuid.UUID | None:
    return uuid.UUID(value) if value else None


def _source_type(value) -> SourceType:
    """Coerce snapshot JSON (string or enum) back to the SourceType enum."""
    if value is None:
        return SourceType.UNAVAILABLE
    if isinstance(value, SourceType):
        return value
    try:
        return SourceType(value)
    except ValueError:
        return SourceType.UNAVAILABLE


def Decimal_safe(value: str | None):
    from decimal import Decimal

    if value is None:
        return None
    try:
        return Decimal(value)
    except Exception:  # noqa: BLE001
        return None
