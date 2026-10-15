# ─── Taste Router ───────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, FiniteFloat
from typing import Optional, List
from services.embeddings_engine import generate_embedding
from services.user_data import update_taste_vector, get_ai_profile
from app.core.dependencies import CurrentUserId
from app.core.errors import AppError, ForbiddenError, ValidationAppError

router = APIRouter()


class TasteUpdateRequest(BaseModel):
    userId: Optional[str] = None  # Optional compatibility field; must match the authenticated UID
    currentVector: Optional[List[FiniteFloat]] = Field(default=None, max_length=3072)
    selectedDestId: Optional[str] = None
    selectedTags: Optional[List[str]] = None
    purpose: Optional[str] = None


@router.post("/update")
async def update_taste(request: TasteUpdateRequest, uid: CurrentUserId):
    if request.userId is not None and request.userId != uid:
        raise ForbiddenError("Taste updates must belong to the signed-in account.")
    try:
        # Load only the authenticated account's stored taste when needed
        if not request.currentVector:
            ai_profile = await get_ai_profile(uid)
            if ai_profile and ai_profile.get("tasteVector"):
                request.currentVector = ai_profile["tasteVector"]

        text_to_embed = f"Destination: {request.selectedDestId}. Vibe: {request.purpose}. Features: {', '.join(request.selectedTags or [])}"
        selection_vector = await generate_embedding(text_to_embed)

        if not selection_vector:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")

        if not request.currentVector:
            new_vector = selection_vector
        else:
            if len(request.currentVector) != len(selection_vector):
                raise ValidationAppError("The taste profile dimensions changed. Please refresh your preferences.")
            # Exponential Moving Average: 80% old taste, 20% new taste
            alpha = 0.2
            new_vector = [
                (val * (1 - alpha)) + (selection_vector[i] * alpha)
                for i, val in enumerate(request.currentVector)
            ]

        # Persist only to the authenticated account
        await update_taste_vector(uid, new_vector)

        return {"success": True, "newVector": new_vector}
    except (HTTPException, AppError):
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Taste update is temporarily unavailable.")
