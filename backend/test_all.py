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
    def test_taste_update_new_vector(self, client):
        r = client.post("/api/taste/update", json={
            "selectedDestId": "goa",
            "selectedTags": ["Beaches", "Nightlife"],
            "purpose": "celebrate",
        })
        assert r.status_code == 200
        data = r.json()
        assert "success" in data
        assert "newVector" in data


# ═══════════════════════════════════════════════════════════════════════════════
# 8. Itinerary Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestItineraryEngine:
    def test_itinerary_generate(self, client):
        r = client.post("/api/itinerary/generate", json={
            "destName": "Jaipur",
            "purpose": "cultural",
            "days": 3,
            "budget": 15000,
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert "itinerary" in data

    def test_itinerary_structure(self, client):
        """Validates the nested structure of a generated itinerary."""
        r = client.post("/api/itinerary/generate", json={
            "destName": "Goa",
            "purpose": "leisure",
            "days": 2,
            "budget": 10000,
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True

        itin = data["itinerary"]
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
