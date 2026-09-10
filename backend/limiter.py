from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import get_settings

def get_real_ip(request: Request) -> str:
    settings = get_settings()
    if settings.TRUST_PROXY:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the last value (the original client is the first in the list, but per audit instruction:
            # "Only honor X-Forwarded-For (taking the LAST value, since a trusted proxy appends)")
            parts = [part.strip() for part in forwarded.split(",")]
            return parts[-1] if parts else ""
    return get_remote_address(request)

limiter = Limiter(key_func=get_real_ip)

