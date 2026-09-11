# ─── Trips API ───────────────────────────────────────────────────────────────
# All routes require a verified Firebase token (CurrentUserId). Ownership is
# enforced server-side: a trip can only be read/mutated by its owner.
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import CurrentUserId, DBSession
from app.core.errors import ForbiddenError
from app.trips.schemas import (
    TripCreate,
    TripDayIn,
    TripItemIn,
    TripItemUpdate,
    TripRead,
    TripSummary,
    TripStatusUpdate,
    TripUpdate,
    TripVersionRead,
)
from app.trips.service import TripService
from app.users.service import get_or_create_user
from app.ai.engine import AIEngine
from pydantic import BaseModel

router = APIRouter(prefix="/trips", tags=["trips"])

class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    reply: str
    trip: TripRead


def _service(db) -> TripService:
    return TripService(db)


async def _owned_trip(service: TripService, trip_id: uuid.UUID,
                      user_id: uuid.UUID):
    trip = await service.get(trip_id)
    if trip.user_id != user_id:
        raise ForbiddenError("You do not own this trip.")
    return trip


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, db: DBSession,
                      firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    trip = await TripService(db).create(user, payload)
    await db.commit()
    return TripService(db).to_read(trip)


@router.get("", response_model=list[TripSummary])
async def list_trips(db: DBSession, firebase_uid: CurrentUserId) -> list[TripSummary]:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    return [service.to_summary(t) for t in await service.list_for_user(user.id)]


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(trip_id: uuid.UUID, db: DBSession,
                   firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    return service.to_read(trip)


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(trip_id: uuid.UUID, payload: TripUpdate,
                      db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.update(trip, user.id, payload)
    await db.commit()
    return service.to_read(trip)


@router.post("/{trip_id}/status", response_model=TripRead)
async def change_status(trip_id: uuid.UUID, payload: TripStatusUpdate,
                        db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.transition(trip, user.id, payload)
    await db.commit()
    return service.to_read(trip)


@router.post("/{trip_id}/days", response_model=TripRead)
async def add_day(trip_id: uuid.UUID, payload: TripDayIn,
                  db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.add_day(trip, user.id, payload)
    await db.commit()
    return service.to_read(trip)


@router.post("/{trip_id}/days/{day_id}/items", response_model=TripRead)
async def add_item(trip_id: uuid.UUID, day_id: uuid.UUID, payload: TripItemIn,
                   db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.add_item(trip, user.id, day_id, payload)
    await db.commit()
    return service.to_read(trip)


@router.patch("/{trip_id}/items/{item_id}", response_model=TripRead)
async def update_item(trip_id: uuid.UUID, item_id: uuid.UUID, payload: TripItemUpdate,
                      db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.update_item(trip, user.id, item_id, payload)
    await db.commit()
    return service.to_read(trip)


@router.delete("/{trip_id}/items/{item_id}", response_model=TripRead)
async def remove_item(trip_id: uuid.UUID, item_id: uuid.UUID,
                      db: DBSession, firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.remove_item(trip, user.id, item_id)
    await db.commit()
    return service.to_read(trip)


@router.post("/{trip_id}/undo", response_model=TripRead)
async def undo(trip_id: uuid.UUID, db: DBSession,
               firebase_uid: CurrentUserId) -> TripRead:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    trip = await service.undo(trip, user.id)
    await db.commit()
    return service.to_read(trip)


@router.get("/{trip_id}/versions", response_model=list[TripVersionRead])
async def list_versions(trip_id: uuid.UUID,
                        db: DBSession,
                        firebase_uid: CurrentUserId,
                        limit: int = Query(default=50, ge=1, le=200)) -> list[TripVersionRead]:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)
    return [service.to_version(v) for v in (await service.versions(trip))[:limit]]


@router.post("/{trip_id}/chat", response_model=AIChatResponse)
async def chat_with_ai(trip_id: uuid.UUID, payload: AIChatRequest,
                       db: DBSession, firebase_uid: CurrentUserId) -> AIChatResponse:
    user = await get_or_create_user(db, firebase_uid)
    service = TripService(db)
    trip = await _owned_trip(service, trip_id, user.id)

    ai_engine = AIEngine(db)
    ai_resp, updated_trip_dict = await ai_engine.converse(
        trip_id=trip_id,
        user_id=user.id,
        user_message=payload.message,
    )

    # Commit changes made by AI mutations
    await db.commit()

    return AIChatResponse(
        reply=ai_resp.reply,
        trip=TripRead.model_validate(updated_trip_dict),
    )
