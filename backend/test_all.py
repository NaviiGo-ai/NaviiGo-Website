"""
NaviiGo Python Backend — Pytest Test Suite
===========================================
Uses FastAPI TestClient — no running server needed.
Run: `cd backend && python -m pytest test_all.py -v`
"""
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    """Create a TestClient instance for the entire test module."""
    with TestClient(app) as c:
        yield c


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Health Check
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthCheck:
    def test_root_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data
        assert "status" in data
        assert "engines" in data
        assert data["status"] == "online"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Weather Engine (free, no key needed)
# ═══════════════════════════════════════════════════════════════════════════════

class TestWeatherEngine:
    def test_weather_default_coords(self, client):
        r = client.get("/api/weather/")
        assert r.status_code == 200
        data = r.json()
        assert "current" in data
        assert "daily" in data

    def test_weather_jaipur_coords(self, client):
        r = client.get("/api/weather/", params={"lat": 26.91, "lng": 75.79})
        assert r.status_code == 200
        data = r.json()
        assert "current" in data


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Transport Engine (OSRM, free)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTransportEngine:
    def test_transport_jaipur_route(self, client):
        r = client.get("/api/transport/", params={
            "fromLat": 26.91, "fromLng": 75.79,
            "toLat": 26.92, "toLng": 75.80,
        })
        assert r.status_code == 200
        data = r.json()
        assert "distance" in data
        assert "options" in data

    def test_transport_missing_coords_returns_400(self, client):
        r = client.get("/api/transport/")
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Chat Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestChatEngine:
    def test_chat_basic_message(self, client):
        r = client.post("/api/chat/", json={
            "message": "Hello, what can you help me with?",
            "context": [],
        })
        assert r.status_code == 200
        data = r.json()
        assert "reply" in data


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Recommendations Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestRecommendationsEngine:
    def test_recommendations_basic(self, client):
        r = client.post("/api/recommendations/", json={
            "budget": 15000,
            "month": 12,
            "group": "couple",
            "purpose": "honeymoon",
        })
        assert r.status_code == 200
        data = r.json()
        assert "success" in data
        assert "recommendations" in data


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Explore Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestExploreEngine:
    def test_deep_dive_jaipur(self, client):
        r = client.post("/api/explore/deep-dive", json={
            "destination": "Jaipur",
            "companion": "Solo",
            "vibe": "Cultural exploration",
        })
        assert r.status_code == 200
        data = r.json()
        assert "redditConsensus" in data
        assert "hiddenGems" in data

    def test_events_jaipur(self, client):
        r = client.post("/api/explore/events", json={
            "destination": "Jaipur",
        })
        assert r.status_code == 200
        data = r.json()
        assert "events" in data


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Taste Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestTasteEngine:
    def test_taste_update_new_vector(self, client, monkeypatch):
        # No GEMINI_API_KEY in CI/dev → stub the embedding so the EMA logic
        # (80% old / 20% new) is exercised without a network call.
        async def fake_embedding(text: str):
            return [0.1, 0.2, 0.3, 0.4, 0.5]

        monkeypatch.setattr("routers.taste.generate_embedding", fake_embedding)
        r = client.post("/api/taste/update", json={
            "selectedDestId": "goa",
            "selectedTags": ["Beaches", "Nightlife"],
            "purpose": "celebrate",
        })
        assert r.status_code == 200
        data = r.json()
        assert "success" in data
        assert "newVector" in data
        assert data["newVector"] == [0.1, 0.2, 0.3, 0.4, 0.5]


# ═══════════════════════════════════════════════════════════════════════════════
# 8. Itinerary Engine
# ═══════════════════════════════════════════════════════════════════════════════

def _build_result(dest_name: str, purpose: str, days: int, budget: int):
    """Drive the deterministic personalization engine directly.

    The HTTP endpoint (`/api/itinerary/generate`) requires a verified Firebase
    bearer token, which a no-credential test suite cannot mint. The engine
    itself needs no keys — it falls back to curated destination data — so we
    test the output shape at engine level instead.
    """
    from services.itinerary_model import generate_itinerary

    ctx = {
        "destName": dest_name,
        "purpose": purpose,
        "days": days,
        "budget": budget,
        "group": "solo",
        "travelerType": "comfort",
        "startDate": "2026-10-01",
    }
    dest_data = {
        "destName": dest_name,
        "description": f"A curated {days}-day {purpose} itinerary for {dest_name}.",
        "mapCenter": {"lat": 26.9124, "lng": 75.7873},
        "highlights": [
            {"name": "Hawa Mahal", "desc": "Iconic honeycomb palace", "duration": "1h", "tags": ["Heritage"], "lat": 26.9239, "lng": 75.8267, "time": "Morning", "crowd": "High", "crowdTip": "Go early"},
            {"name": "Amber Fort", "desc": "Hilltop fort", "duration": "2h", "tags": ["Heritage"], "lat": 26.9855, "lng": 75.8513, "time": "Morning", "crowd": "Medium", "crowdTip": "Elephant ride"},
            {"name": "City Palace", "desc": "Royal residence", "duration": "1.5h", "tags": ["History"], "lat": 26.9258, "lng": 75.8237, "time": "Afternoon", "crowd": "Medium", "crowdTip": "Museum inside"},
        ],
        "restaurants": [
            {"name": "Laxmi Misthan Bhandar", "desc": "Famous sweets", "tags": ["Rajasthani"], "lat": 26.9213, "lng": 75.8259, "price": "$$", "time": "Lunch", "crowd": "High", "crowdTip": "Try pyaaz kachori"},
        ],
        "hotels": [
            {"name": "Umaid Bhawan", "desc": "Heritage hotel", "tags": ["Heritage"], "lat": 26.9080, "lng": 75.8135, "price": "$$$"},
        ],
    }
    return generate_itinerary(ctx, dest_data)


class TestItineraryEngine:
    def test_itinerary_generate(self):
        itin = _build_result("Jaipur", "cultural", 3, 15000)
        assert itin is not None
        assert "dayPlans" in itin
        assert len(itin["dayPlans"]) > 0

    def test_itinerary_structure(self):
        """Validates the nested structure of a generated itinerary."""
        itin = _build_result("Goa", "leisure", 2, 10000)
        assert itin is not None

        required_keys = ["destName", "description", "dayPlans", "mapCenter", "highlights", "restaurants", "hotels"]
        for key in required_keys:
            assert key in itin, f"Itinerary missing key: {key}"

        # Verify dayPlans structure
        assert len(itin["dayPlans"]) > 0, "dayPlans is empty"
        day1 = itin["dayPlans"][0]
        for key in ["day", "title", "weather", "activities"]:
            assert key in day1, f"dayPlans[0] missing key: {key}"
        assert len(day1["activities"]) > 0, "dayPlans[0] has no activities"


# ═══════════════════════════════════════════════════════════════════════════════
# 9. Places Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlacesEngine:
    def test_places_autocomplete(self, client):
        r = client.get("/api/places/autocomplete", params={"input": "Jaipur"})
        assert r.status_code == 200
        data = r.json()
        assert "predictions" in data
