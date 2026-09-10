# ─── NaviiGo AI Engines — Python FastAPI Backend ────────────────────────────────
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables relative to this file — never CWD-dependent.
# Priority: repo-level .env.local (frontend-shared secrets), then backend/.env,
# then repo-level .env.
_backend_dir = Path(__file__).parent
_base_dir = _backend_dir.parent
load_dotenv(dotenv_path=_base_dir / ".env.local")
load_dotenv(dotenv_path=_backend_dir / ".env")
load_dotenv(dotenv_path=_base_dir / ".env")

from routers import itinerary, chat, recommendations, explore, weather, transport, taste, places, admin
from app.api import bookings, payments
from app.core.errors import register_app_error_handler


# ── Startup logic using modern lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.destination_cache import load_csv_destinations
    from services.firebase_client import is_firebase_configured
    from services.gemini_cache import is_redis_connected
    count = await load_csv_destinations()
    fb_status = "connected" if is_firebase_configured() else "not configured (place firebase-service-account.json in backend/)"
    redis_status = "[OK] connected" if is_redis_connected() else "[WARN] unavailable (using file cache fallback)"
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
    allow_origins=list(set(["http://localhost:3000", "https://naviigo.in", "https://www.naviigo.in"] + [origin.strip() for origin in _cors_origins if origin.strip()])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# App errors (auth, forbidden, not-found, ...) -> stable JSON bodies, not bare 500s
register_app_error_handler(app)

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
app.include_router(bookings.router,        prefix="/api/bookings",        tags=["Bookings"])
app.include_router(payments.router,        prefix="/api/payments",        tags=["Payments"])


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

