# ─── Recommendations Router ─────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.recommendations_engine import get_recommendations
from services.user_data import get_full_user_context, update_browsing_signals

router = APIRouter()


class RecommendationsRequest(BaseModel):
    userId: Optional[str] = None  # Firebase UID — enriches with stored user data
    budget: Optional[int] = 15000
    month: Optional[int] = None
    group: Optional[str] = None
    purpose: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    pastDestinations: Optional[List[str]] = None
    tasteVector: Optional[List[float]] = None
    browsingSignals: Optional[Dict[str, Any]] = None


@router.post("/")
async def recommendations(request: RecommendationsRequest):
    try:
        # If userId provided, enrich request with stored user data
        taste_vector = request.tasteVector
        browsing_signals = request.browsingSignals
        past_destinations = request.pastDestinations
        preferences = request.preferences
        group = request.group
        purpose = request.purpose

        if request.userId:
            user_ctx = await get_full_user_context(request.userId)
            # Use stored data as fallback (request data takes priority)
            if not taste_vector and user_ctx.get("tasteVector"):
                taste_vector = user_ctx["tasteVector"]
            if not browsing_signals and user_ctx.get("browsingSignals"):
                browsing_signals = user_ctx["browsingSignals"]
            if not past_destinations and user_ctx.get("pastDestinations"):
                past_destinations = user_ctx["pastDestinations"]
            if not preferences and user_ctx.get("interests"):
                preferences = {"interests": user_ctx["interests"]}
            if not group and user_ctx.get("preferredGroup"):
                group = user_ctx["preferredGroup"]

            # Persist incoming browsing signals to Firebase
            if request.browsingSignals:
                await update_browsing_signals(request.userId, request.browsingSignals)

        results = await get_recommendations(
            budget=request.budget or 15000,
            month=request.month,
            group=group,
            purpose=purpose,
            preferences=preferences,
            past_destinations=past_destinations,
            taste_vector=taste_vector,
            browsing_signals=browsing_signals,
        )
        return {"success": True, "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
