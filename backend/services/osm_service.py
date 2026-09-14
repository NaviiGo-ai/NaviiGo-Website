"""
OpenStreetMap (OSM) Service & OAuth 2.0 Integration for Python Backend.
"""
import os
import urllib.parse
from typing import Dict, Any, Optional
import httpx

OSM_CLIENT_ID = os.getenv("OSM_CLIENT_ID", "")
OSM_CLIENT_SECRET = os.getenv("OSM_CLIENT_SECRET", "")
OSM_AUTHORIZE_URL = "https://www.openstreetmap.org/oauth2/authorize"
OSM_TOKEN_URL = "https://www.openstreetmap.org/oauth2/token"
OSM_API_BASE = "https://api.openstreetmap.org/api/0.6"
OSM_NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
OSM_USER_AGENT = "NaviiGo/1.0 (travel-app; contact@naviigo.com)"


def get_osm_auth_url(
    redirect_uri: str,
    state: Optional[str] = None,
    scopes: Optional[list] = None,
) -> str:
    """Generate OpenStreetMap OAuth 2.0 authorization URL."""
    if not OSM_CLIENT_ID:
        raise ValueError("OSM_CLIENT_ID is not configured.")

    scope_str = " ".join(scopes or ["read_prefs"])
    params = {
        "response_type": "code",
        "client_id": OSM_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": scope_str,
    }
    if state:
        params["state"] = state

    return f"{OSM_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


async def verify_osm_credentials() -> Dict[str, Any]:
    """
    Verify OSM Client ID and Secret against OpenStreetMap's live OAuth 2.0 server.
    
    Returns a dict with verification status and details.
    """
    client_id = os.getenv("OSM_CLIENT_ID", "") or OSM_CLIENT_ID
    client_secret = os.getenv("OSM_CLIENT_SECRET", "") or OSM_CLIENT_SECRET

    if not client_id or not client_secret:
        return {
            "valid": False,
            "status_code": 0,
            "client_id_preview": "",
            "message": "OSM_CLIENT_ID or OSM_CLIENT_SECRET is missing from environment.",
            "error": "missing_credentials",
        }

    preview = f"{client_id[:8]}...{client_id[-4:]}" if len(client_id) > 12 else "***"

    try:
        data = {
            "grant_type": "authorization_code",
            "code": "__verification_probe__",
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": "http://localhost:8000/api/osm/callback",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                OSM_TOKEN_URL,
                data=data,
                headers={"User-Agent": OSM_USER_AGENT},
            )
            try:
                res_json = resp.json()
            except Exception:
                res_json = {}

        # 401 or invalid_client => Bad credentials
        if resp.status_code == 401 or res_json.get("error") == "invalid_client":
            return {
                "valid": False,
                "status_code": resp.status_code,
                "client_id_preview": preview,
                "message": "OpenStreetMap rejected client authentication: Invalid Client ID or Secret.",
                "error": res_json.get("error_description") or res_json.get("error"),
            }

        # 400 invalid_grant => Client authentication succeeded!
        if res_json.get("error") == "invalid_grant" or (resp.status_code == 400 and "error" in res_json):
            return {
                "valid": True,
                "status_code": 200,
                "client_id_preview": preview,
                "message": "OpenStreetMap OAuth 2.0 credentials verified successfully against openstreetmap.org servers.",
            }

        return {
            "valid": resp.status_code < 400,
            "status_code": resp.status_code,
            "client_id_preview": preview,
            "message": f"Response from OSM OAuth: {resp.status_code}",
        }
    except Exception as e:
        return {
            "valid": False,
            "status_code": 500,
            "client_id_preview": preview,
            "message": f"Failed to connect to OpenStreetMap servers: {str(e)}",
            "error": str(e),
        }
