# ─── Chat Router ────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.chat_engine import process_chat

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context: Optional[List[dict]] = None
    currentPlans: Optional[Dict[str, Any]] = None
    itineraryContext: Optional[Dict[str, Any]] = None


@router.post("/")
async def chat(request: ChatRequest):
    try:
        itinerary_data = request.itineraryContext or request.currentPlans
        result = await process_chat(request.message, request.context or [], itinerary_data)
        return result
    except Exception as e:
        return {"reply": "I'm having trouble right now. Please try again in a moment.", "action": None}
