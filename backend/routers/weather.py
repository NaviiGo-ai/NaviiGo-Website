# ─── Weather Router ─────────────────────────────────────────────────────────────
from fastapi import APIRouter
from services.weather_engine import get_weather

router = APIRouter()


@router.get("/")
async def weather(lat: float = 20.5937, lng: float = 78.9629):
    return await get_weather(lat, lng)
