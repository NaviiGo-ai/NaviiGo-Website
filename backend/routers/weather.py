# ─── Weather Router ─────────────────────────────────────────────────────────────
from fastapi import APIRouter
from typing import Optional
from services.weather_engine import get_weather

router = APIRouter()


@router.get("/")
async def weather(lat: Optional[float] = None, lng: Optional[float] = None):
    return await get_weather(lat, lng)
