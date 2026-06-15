# ─── Explore Router (Deep Dive + Events) ────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.deep_dive_engine import get_deep_dive
from services.events_engine import get_live_events

router = APIRouter()


class DeepDiveRequest(BaseModel):
    destination: str
    companion: Optional[str] = "Solo"
    vibe: Optional[str] = "Explore everything"


class EventsRequest(BaseModel):
    destination: str


@router.post("/deep-dive")
async def deep_dive(request: DeepDiveRequest):
    try:
        data = await get_deep_dive(request.destination, request.companion or "Solo", request.vibe or "Explore everything")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events")
async def events(request: EventsRequest):
    try:
        if not request.destination:
            raise HTTPException(status_code=400, detail="Destination is required")
        event_list = await get_live_events(request.destination)
        return {"events": event_list}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
