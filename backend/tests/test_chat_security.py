from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from limiter import limiter
from routers import chat


@pytest.fixture
def chat_app(monkeypatch):
    limiter.reset()
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(chat.router, prefix="/chat")
    engine = AsyncMock(return_value={"reply": "Hello"})
    monkeypatch.setattr(chat, "process_chat", engine)
    yield app, engine
    limiter.reset()


@pytest.mark.asyncio
async def test_chat_rate_limit_blocks_costly_engine_calls(chat_app):
    app, engine = chat_app
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        for _ in range(10):
            assert (await client.post("/chat/", json={"message": "Hi"})).status_code == 200
        assert (await client.post("/chat/", json={"message": "Hi"})).status_code == 429
    assert engine.await_count == 10


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [
    {"message": "x" * 4001},
    {"message": "Hi", "context": [{}] * 31},
    {"message": "Hi", "itineraryContext": {"text": "x" * 100_001}},
])
async def test_oversized_chat_input_never_reaches_engine(chat_app, payload):
    app, engine = chat_app
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.post("/chat/", json=payload)).status_code == 422
    engine.assert_not_called()


@pytest.mark.asyncio
async def test_upstream_error_does_not_expose_credentials_or_internal_details(chat_app):
    app, engine = chat_app
    engine.side_effect = RuntimeError("internal secret credential should never reach clients")
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/chat/", json={"message": "Hi"})
    assert response.status_code == 502
    assert "secret credential" not in response.text
