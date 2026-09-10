# ─── Analytics Service ────────────────────────────────────────────────────────
# Service for recording durable user events. Writes to the `user_events` table
# and mirrors to PostHog if configured. Never blocks the critical path.
from __future__ import annotations

import uuid
from typing import Any
import asyncio

import posthog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import UserEvent
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

        # Disable PostHog entirely if no key
        if self.settings.POSTHOG_API_KEY:
            posthog.project_api_key = self.settings.POSTHOG_API_KEY
            posthog.host = self.settings.POSTHOG_HOST
            posthog.disabled = False
        else:
            posthog.disabled = True

    async def track(
        self,
        event_name: str,
        user_id: uuid.UUID | None = None,
        properties: dict[str, Any] | None = None,
        source: str = "api",
    ) -> None:
        """
        Record a product event.
        - Writes persistently to postgres (`user_events`).
        - Submits to PostHog asynchronously (if configured).
        """
        props = properties or {}

        # 1. Write to local database
        event = UserEvent(
            user_id=user_id,
            event_name=event_name,
            properties=props,
            source=source,
        )
        self.db.add(event)
        # We don't flush immediately here; the caller is typically within a unit of work (router endpoint),
        # so this will be flushed to the DB when the caller commits the transaction.

        # 2. Mirror to PostHog (non-blocking)
        if not posthog.disabled:
            # We use an actor id; if user is None, use "anonymous".
            distinct_id = str(user_id) if user_id else "anonymous"
            try:
                # posthog.capture is synchronous but queues internally (or relies on async requests in newer PostHog versions).
                # We offload the Python call to thread space to prevent any small blocking behavior from tracking.
                await asyncio.to_thread(
                    posthog.capture,
                    distinct_id,
                    event_name,
                    props,
                )
            except Exception as e:
                # Swallow error: analytics should never break user flows.
                logger.error(f"PostHog capture failed for {event_name}: {e}")
