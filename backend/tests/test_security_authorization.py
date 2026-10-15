from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI

from app.core.errors import register_app_error_handler
from routers import admin, recommendations, taste
from services import firebase_client


@pytest.fixture
def security_app(monkeypatch):
    app = FastAPI()
    register_app_error_handler(app)
    app.include_router(admin.router, prefix="/admin")
    app.include_router(taste.router, prefix="/taste")
    app.include_router(recommendations.router, prefix="/recommendations")
    def verify(token):
        if token == "revoked":
            raise ValueError("revoked")
        return {"uid": "owner-a", "admin": token == "admin"}
    monkeypatch.setattr(firebase_client, "verify_firebase_id_token", verify)
    return app


@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", [
    ("GET", "/admin/cache/stats"), ("POST", "/admin/cache/clear"),
    ("POST", "/admin/cache/reload-csv"), ("GET", "/admin/user/owner-b/context"),
    ("GET", "/admin/user/owner-b/itineraries"),
])
async def test_normal_accounts_cannot_use_admin_routes(security_app, method, path):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=security_app), base_url="https://test") as client:
        assert (await client.request(method, path)).status_code == 401
        assert (await client.request(method, path, headers={"Authorization": "Bearer user"})).status_code == 403


@pytest.mark.asyncio
async def test_real_admin_claim_can_read_stats_but_revoked_token_cannot(security_app, monkeypatch):
    monkeypatch.setattr(admin, "get_gemini_stats", lambda: {})
    monkeypatch.setattr(admin, "get_dest_stats", lambda: {})
    monkeypatch.setattr(admin, "is_redis_connected", lambda: False)
    monkeypatch.setattr(admin, "is_firebase_configured", lambda: False)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=security_app), base_url="https://test") as client:
        assert (await client.get("/admin/cache/stats", headers={"Authorization": "Bearer admin"})).status_code == 200
        assert (await client.get("/admin/cache/stats", headers={"Authorization": "Bearer revoked"})).status_code == 401


@pytest.mark.asyncio
async def test_taste_cannot_read_or_write_another_users_profile(security_app, monkeypatch):
    read, write = AsyncMock(), AsyncMock()
    monkeypatch.setattr(taste, "get_ai_profile", read)
    monkeypatch.setattr(taste, "update_taste_vector", write)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=security_app), base_url="https://test") as client:
        assert (await client.post("/taste/update", json={"userId": "owner-b"})).status_code == 401
        assert (await client.post("/taste/update", json={"userId": "owner-b"}, headers={"Authorization": "Bearer user"})).status_code == 403
    read.assert_not_called()
    write.assert_not_called()


@pytest.mark.asyncio
async def test_taste_identity_comes_from_token_when_body_omits_it(security_app, monkeypatch):
    monkeypatch.setattr(taste, "get_ai_profile", AsyncMock(return_value={}))
    monkeypatch.setattr(taste, "generate_embedding", AsyncMock(return_value=[0.2, 0.4]))
    write = AsyncMock()
    monkeypatch.setattr(taste, "update_taste_vector", write)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=security_app), base_url="https://test") as client:
        response = await client.post("/taste/update", json={}, headers={"Authorization": "Bearer user"})
    assert response.status_code == 200
    write.assert_awaited_once_with("owner-a", [0.2, 0.4])


@pytest.mark.asyncio
async def test_public_recommendations_cannot_borrow_user_identity(security_app, monkeypatch):
    read = AsyncMock(return_value={})
    write = AsyncMock()
    monkeypatch.setattr(recommendations, "get_full_user_context", read)
    monkeypatch.setattr(recommendations, "update_browsing_signals", write)
    monkeypatch.setattr(recommendations, "get_recommendations", AsyncMock(return_value=[]))
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=security_app), base_url="https://test") as client:
        assert (await client.post("/recommendations/", json={"userId": "owner-b"})).status_code == 401
        assert (await client.post("/recommendations/", json={"userId": "owner-b"}, headers={"Authorization": "Bearer user"})).status_code == 403
        assert (await client.post("/recommendations/", json={})).status_code == 200
    read.assert_not_called()
    write.assert_not_called()


def test_firebase_checks_revocation(monkeypatch):
    from unittest.mock import MagicMock
    monkeypatch.setattr(firebase_client, "_init", lambda: None)
    monkeypatch.setattr(firebase_client, "_app", object())
    verify = MagicMock(return_value={"uid": "owner-a"})
    monkeypatch.setattr(firebase_client.firebase_auth, "verify_id_token", verify)
    firebase_client.verify_firebase_id_token("test-token")
    assert verify.call_args.kwargs["check_revoked"] is True
