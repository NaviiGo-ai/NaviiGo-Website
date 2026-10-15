# ─── Shared FastAPI dependencies ───────────────────────────────────────────────
from __future__ import annotations

import asyncio
import uuid
from typing import Annotated, Optional

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AuthRequiredError, ForbiddenError
from app.core.logging import get_logger
from app.db.session import get_async_session

logger = get_logger(__name__)


# ── Settings ─────────────────────────────────────────────────────────────────
SettingsDep = Annotated[Settings, Depends(get_settings)]


# ── Database session ─────────────────────────────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_async_session)]


# ── Request ID ───────────────────────────────────────────────────────────────
async def _get_or_create_request_id(request: Request) -> str:
    settings = get_settings()
    rid = request.headers.get(settings.REQUEST_ID_HEADER) or str(uuid.uuid4())
    request.state.request_id = rid
    return rid

RequestId = Annotated[str, Depends(_get_or_create_request_id)]


# ── Firebase Auth (derives UID from token; never trusts client-supplied UID) ─
async def _verified_claims(
    authorization: Annotated[Optional[str], Header(alias="Authorization")] = None,
) -> dict:
    """Extract the authenticated Firebase UID from the Authorization header.

    This dependency is the ONLY source of user identity in the API layer.
    Never trust userId fields in request bodies.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthRequiredError("Sign in is required.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AuthRequiredError("Sign in is required.")

    try:
        # Import here to avoid circular deps with firebase_client module
        from services.firebase_client import verify_firebase_id_token
        claims = await asyncio.to_thread(verify_firebase_id_token, token)
        uid = claims.get("uid")
        if not uid:
            raise AuthRequiredError("Invalid authentication token.")
        return claims
    except AuthRequiredError:
        raise
    except Exception as exc:
        logger.warning("Firebase token verification failed", extra={"code": "AUTH_TOKEN_INVALID"})
        raise AuthRequiredError("Your session has expired. Please sign in again.")

async def _current_user_uid(
    authorization: Annotated[Optional[str], Header(alias="Authorization")] = None,
) -> str:
    return (await _verified_claims(authorization))["uid"]


async def _current_admin_uid(
    authorization: Annotated[Optional[str], Header(alias="Authorization")] = None,
) -> str:
    claims = await _verified_claims(authorization)
    if claims.get("admin") is not True:
        raise ForbiddenError("Administrator access is required.")
    return claims["uid"]


CurrentUserId = Annotated[str, Depends(_current_user_uid)]
AdminUserId = Annotated[str, Depends(_current_admin_uid)]


# ── Optional Auth (for public endpoints where auth enriches the response) ────
async def _optional_user_uid(
    authorization: Annotated[Optional[str], Header(alias="Authorization")] = None,
) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await _current_user_uid(authorization)
    except AuthRequiredError:
        return None

OptionalUserId = Annotated[Optional[str], Depends(_optional_user_uid)]
