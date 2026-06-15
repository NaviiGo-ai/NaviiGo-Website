# ─── Transport Router ───────────────────────────────────────────────────────────
from typing import Optional
from fastapi import APIRouter, HTTPException
from services.transport_engine import get_transport

router = APIRouter()


@router.get("/")
async def transport(fromLat: Optional[float] = None, fromLng: Optional[float] = None, toLat: Optional[float] = None, toLng: Optional[float] = None):
    if fromLat is None or fromLng is None or toLat is None or toLng is None:
        raise HTTPException(status_code=400, detail="Missing coordinates")
    return await get_transport(fromLat, fromLng, toLat, toLng)
