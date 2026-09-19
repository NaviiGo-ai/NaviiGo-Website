from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from services.firebase_client import verify_firebase_id_token
from services.analytics_engine import process_analytics_events, reset_user_personalization

router = APIRouter()

class AnalyticsContext(BaseModel):
    surface: Optional[str] = None
    tripState: Optional[str] = None
    tripVibe: Optional[str] = None

class AnalyticsMetadata(BaseModel):
    skipReason: Optional[str] = None
    rating: Optional[int] = None
    confirmationSource: Optional[str] = None

class AnalyticsEvent(BaseModel):
    eventId: str
    schemaVersion: str = "1.0"
    eventType: str
    occurredAt: str
    receivedAt: Optional[str] = None
    tripId: Optional[str] = None
    dayId: Optional[str] = None
    activityId: Optional[str] = None
    placeId: Optional[str] = None
    destinationId: Optional[str] = None
    sessionId: Optional[str] = None
    context: Optional[AnalyticsContext] = None
    metadata: Optional[AnalyticsMetadata] = None

class TrackEventsRequest(BaseModel):
    events: List[AnalyticsEvent]

@router.post("/track")
async def track_events(
    request: TrackEventsRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_firebase_id_token)
):
    uid = auth.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    events_list = []
    for e in request.events:
        e.receivedAt = datetime.utcnow().isoformat()
        events_list.append(e.dict())

    background_tasks.add_task(process_analytics_events, uid, events_list)
    return {"status": "accepted", "count": len(events_list)}

@router.post("/reset")
async def reset_personalization(
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_firebase_id_token)
):
    uid = auth.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    background_tasks.add_task(reset_user_personalization, uid)
    return {"status": "accepted"}
