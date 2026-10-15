# ─── Chat Router ────────────────────────────────────────────────────────────────
import json
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from services.chat_engine import process_chat
from limiter import limiter

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: Optional[List[dict]] = Field(default=None, max_length=30)
    currentPlans: Optional[Dict[str, Any]] = None
    itineraryContext: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def bound_context(self):
        if len(json.dumps(self.model_dump(), ensure_ascii=False).encode("utf-8")) > 100_000:
            raise ValueError("Chat context is too large")
        return self


@router.post("/")
@limiter.limit("10/minute")
async def chat(request: Request, payload: ChatRequest):
    try:
        itinerary_data = payload.itineraryContext or payload.currentPlans
        result = await process_chat(payload.message, payload.context or [], itinerary_data)
        return result
    except Exception as e:
        # Distinguish: Gemini NOT configured -> 503, transient upstream error -> 502
        if "GEMINI_API_KEY is not configured" in str(e) or "AI Chat is in demo mode" in str(e):
            raise HTTPException(status_code=503, detail="AI chat is temporarily unavailable")
        else:
            raise HTTPException(status_code=502, detail="AI chat could not respond. Please try again.")
