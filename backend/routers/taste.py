# ─── Taste Router ───────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.embeddings_engine import generate_embedding
from services.user_data import update_taste_vector, get_ai_profile

router = APIRouter()


class TasteUpdateRequest(BaseModel):
    userId: Optional[str] = None  # Firebase UID — if provided, persist to Firestore
    currentVector: Optional[List[float]] = None
    selectedDestId: Optional[str] = None
    selectedTags: Optional[List[str]] = None
    purpose: Optional[str] = None


@router.post("/update")
async def update_taste(request: TasteUpdateRequest):
    try:
        # If userId provided but no currentVector, try to load from Firebase
        if request.userId and not request.currentVector:
            ai_profile = await get_ai_profile(request.userId)
            if ai_profile and ai_profile.get("tasteVector"):
                request.currentVector = ai_profile["tasteVector"]

        text_to_embed = f"Destination: {request.selectedDestId}. Vibe: {request.purpose}. Features: {', '.join(request.selectedTags or [])}"
        selection_vector = await generate_embedding(text_to_embed)

        if not selection_vector:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")

        if not request.currentVector:
            new_vector = selection_vector
        else:
            # Exponential Moving Average: 80% old taste, 20% new taste
            alpha = 0.2
            new_vector = [
                (val * (1 - alpha)) + (selection_vector[i] * alpha)
                for i, val in enumerate(request.currentVector)
            ]

        # Persist to Firebase if userId is provided
        if request.userId:
            await update_taste_vector(request.userId, new_vector)

        return {"success": True, "newVector": new_vector}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
