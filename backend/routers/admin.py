# ─── Admin Router (Cache Management, CSV Import, User Data) ─────────────────────
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from services.gemini_cache import get_cache_stats as get_gemini_stats, clear_namespace, clear_all
from services.destination_cache import get_cache_stats as get_dest_stats, load_csv_destinations, clear_cache as clear_dest_cache
from services.user_data import get_full_user_context, get_ai_profile, get_user_itineraries
from services.firebase_client import is_firebase_configured

router = APIRouter()


@router.get("/cache/stats")
async def cache_stats():
    """Get cache statistics for monitoring."""
    return {
        "gemini_cache": get_gemini_stats(),
        "destination_cache": get_dest_stats(),
        "firebase_connected": is_firebase_configured(),
    }


@router.post("/cache/clear")
async def clear_cache(namespace: Optional[str] = None):
    """Clear cache — all or by namespace."""
    if namespace:
        return clear_namespace(namespace)
    clear_all()
    clear_dest_cache()
    return {"cleared": "all caches"}


@router.post("/cache/reload-csv")
async def reload_csv():
    """Reload destination data from CSV files in backend/data/."""
    count = load_csv_destinations()
    return {"success": True, "destinations_loaded": count}


@router.get("/user/{uid}/context")
async def user_context(uid: str):
    """Get the full AI context for a user (for debugging)."""
    if not is_firebase_configured():
        return {"error": "Firebase not configured", "tip": "Place firebase-service-account.json in backend/"}
    ctx = await get_full_user_context(uid)
    # Don't return the full 768-dim vector — just its length
    if ctx.get("tasteVector"):
        ctx["tasteVectorDim"] = len(ctx["tasteVector"])
        ctx["tasteVector"] = f"[{len(ctx['tasteVector'])}-dim vector]"
    return ctx


@router.get("/user/{uid}/itineraries")
async def user_itineraries(uid: str):
    """Get a user's saved itineraries."""
    if not is_firebase_configured():
        return {"error": "Firebase not configured"}
    itineraries = await get_user_itineraries(uid)
    # Summarize — don't return full generated data
    return {
        "count": len(itineraries),
        "itineraries": [
            {
                "id": i.get("id"),
                "destName": i.get("destName"),
                "createdAt": str(i.get("createdAt", "")),
                "isActive": i.get("isActive", False),
            }
            for i in itineraries
        ],
    }
