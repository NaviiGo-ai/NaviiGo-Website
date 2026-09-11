# ─── Gemini Client Wrapper ──────────────────────────────────────────────────────
# Provides a shared Gemini client using the new google-genai SDK.

import os
from google import genai

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

_client = None
_client_key = None

def is_configured() -> bool:
    key = os.getenv("GEMINI_API_KEY", "")
    return bool(key) and key != "your_gemini_api_key_here"

def get_client() -> genai.Client:
    if not is_configured():
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Set the environment variable."
        )
    global _client, _client_key
    current_key = os.getenv("GEMINI_API_KEY", "")
    if _client is None or _client_key != current_key:
        _client = genai.Client(api_key=current_key)
        _client_key = current_key
    return _client
