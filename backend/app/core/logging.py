# ─── Structured JSON logging ───────────────────────────────────────────────────
# Every log line is one JSON object so production pipelines can parse it.
# Sensitive values (tokens, secrets) must never be passed to log fields.
from __future__ import annotations

import json
import logging
import sys
import traceback
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings

_CONFIGURED = False


def _json_formatter(record: logging.LogRecord) -> str:
    payload: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": record.levelname,
        "logger": record.name,
        "message": record.getMessage(),
    }
    # Contextual fields attached via logger.info("msg", extra={...})
    for key in ("request_id", "user_id", "trip_id", "booking_id", "payment_id",
                "supplier", "supplier_request_id", "event", "code"):
        value = getattr(record, key, None)
        if value is not None:
            payload[key] = value
    if record.exc_info and record.exc_info[0] is not None:
        payload["exception"] = "".join(traceback.format_exception(*record.exc_info))
    return json.dumps(payload, default=str, ensure_ascii=False)


class _JsonFormatter(logging.Formatter):
    """Formatter that renders each record as one JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        return _json_formatter(record)


def configure_logging() -> None:
    """Configure root logging with the JSON formatter. Idempotent."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    settings = get_settings()
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]

    # Quiet noisy third-party loggers a notch.
    for noisy in ("httpx", "httpcore", "urllib3", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
