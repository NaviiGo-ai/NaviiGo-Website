# ─── NaviiGo AI Engines — Python FastAPI Backend ────────────────────────────────
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from parent .env.local
load_dotenv(dotenv_path="../.env.local")

from routers import itinerary, chat, recommendations, explore, weather, transport, taste, places, admin


# ── Startup logic using modern lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.destination_cache import load_csv_destinations
    from services.firebase_client import is_firebase_configured
    from services.gemini_cache import is_redis_connected
    count = load_csv_destinations()
    fb_status = "connected" if is_firebase_configured() else "not configured (place firebase-service-account.json in backend/)"
    redis_status = "✅ connected" if is_redis_connected() else "⚠ unavailable (using file cache fallback)"
    print(f"[Startup] CSV destinations preloaded: {count}")
    print(f"[Startup] Firebase: {fb_status}")
    print(f"[Startup] Redis: {redis_status}")
    yield


app = FastAPI(
    title="NaviiGo AI Engines",
    description="Python backend for NaviiGo — powering itinerary generation, chat, recommendations, explore deep-dives, weather, transport, and taste profiling.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend (read from env, no wildcard in production)
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──
app.include_router(itinerary.router,       prefix="/api/itinerary",       tags=["Itinerary"])
app.include_router(chat.router,            prefix="/api/chat",            tags=["Chat"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(explore.router,         prefix="/api/explore",         tags=["Explore"])
app.include_router(weather.router,         prefix="/api/weather",         tags=["Weather"])
app.include_router(transport.router,       prefix="/api/transport",       tags=["Transport"])
app.include_router(taste.router,           prefix="/api/taste",           tags=["Taste"])
app.include_router(places.router,          prefix="/api/places",          tags=["Places"])
app.include_router(admin.router,           prefix="/api/admin",           tags=["Admin"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to NaviiGo AI Engines API",
        "status": "online",
        "engines": [
            "itinerary/generate",
            "itinerary/from-link",
            "chat",
            "recommendations",
            "explore/deep-dive",
            "explore/events",
            "weather",
            "transport",
            "taste/update",
            "places/autocomplete",
            "places/details",
            "admin/cache/stats",
        ],
    }

