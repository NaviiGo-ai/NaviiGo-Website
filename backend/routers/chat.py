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
        # Distinguish: Gemini NOT configured -> 503, transient upstream error -> 502
        if "GEMINI_API_KEY is not configured" in str(e) or "AI Chat is in demo mode" in str(e):
            raise HTTPException(status_code=503, detail="AI service not configured - please set GEMINI_API_KEY")
        else:
            raise HTTPException(status_code=502, detail=f"Upstream AI error: {str(e)}")
