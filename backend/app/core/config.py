# ─── NaviiGo application configuration ────────────────────────────────────────
# Single source of truth for backend settings. Every value is read from the
# environment; nothing sensitive is ever hardcoded.
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, read from environment variables (and .env files)."""

    model_config = SettingsConfigDict(
        env_file=("../.env.local", "../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Environment ──────────────────────────────────────────────────────────
    APP_ENV: str = "development"  # development | test | production
    APP_NAME: str = "NaviiGo AI Engines"
    DEBUG: bool = False
    REQUEST_ID_HEADER: str = "X-Request-ID"

    # ── Database (canonical transactional store) ─────────────────────────────
    # Postgres in production; SQLite in-memory fallback keeps tests hermetic.
    DATABASE_URL: str = "sqlite:///./naviigo.db"

    # ── Firebase Auth (identity provider) ────────────────────────────────────
    FIREBASE_PROJECT_ID: str = "naviigo-firebase"

    # ── Redis (cache / rate limiting / locks) ────────────────────────────────
    REDIS_URL: str = ""

    # ── Gemini (AI layer) ────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # ── Razorpay (Indian payments) ───────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # ── PostHog (product analytics) ──────────────────────────────────────────
    POSTHOG_API_KEY: str = ""
    POSTHOG_HOST: str = "https://us.i.posthog.com"

    # ── Suppliers ────────────────────────────────────────────────────────────
    # NaviiGo completes bookings by redirecting to operators/OTAs (India-first:
    # IRCTC, Booking.com, MMT, Ola/Uber, TravelPayouts affiliate widget). No
    # GDS/airline-API creds are used — Amadeus was removed (poor domestic-India
    # coverage and unusable without a sales-agent setup).
    TRAVELPAYOUTS_TOKEN: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,https://naviigo.in,https://www.naviigo.in"

    # ── SSRF guard for user-supplied URL fetching ────────────────────────────
    URL_FETCH_MAX_BYTES: int = 512 * 1024        # 512 KB cap on fetched pages
    URL_FETCH_TIMEOUT_SECONDS: float = 6.0
    URL_FETCH_MAX_REDIRECTS: int = 3

    # ── Misc product knobs ───────────────────────────────────────────────────
    DEFAULT_CURRENCY: str = "INR"
    OFFER_TTL_SECONDS: int = 15 * 60              # supplier offers expire after 15 min
    TRIP_MAX_DAYS: int = 14
    TRUST_PROXY: bool = False                     # Set to True when behind trusted proxy (e.g., AWS ALB, Nginx)

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def database_engine_url(self) -> str:
        """SQLite URLs need special connect args; callers pass engine URL separately."""
        return self.DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()
