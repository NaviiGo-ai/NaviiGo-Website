# ─── Transport Router ───────────────────────────────────────────────────────────
from typing import Optional
from datetime import date as Date, timedelta
from fastapi import APIRouter, HTTPException, Query, Request
from limiter import limiter
from services.transport_engine import get_transport

router = APIRouter()


@router.get("/flights")
@limiter.limit("12/minute")
async def flights(request: Request, origin: str = Query(..., pattern=r"^[A-Z]{3}$"),
                  destination: str = Query(..., pattern=r"^[A-Z]{3}$"), date: Date = Query(...)):
    if origin == destination or date < Date.today() or date > Date.today() + timedelta(days=365):
        raise HTTPException(422, "Choose different airports and a date within the next year")
    from services.flight_search import search_flights
    return await search_flights(origin, destination, date.isoformat())


@router.get("/")
async def transport(fromLat: Optional[float] = None, fromLng: Optional[float] = None, toLat: Optional[float] = None, toLng: Optional[float] = None):
    if fromLat is None or fromLng is None or toLat is None or toLng is None:
        raise HTTPException(status_code=400, detail="Missing coordinates")
    return await get_transport(fromLat, fromLng, toLat, toLng)
