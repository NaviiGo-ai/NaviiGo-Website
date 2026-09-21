# ─── Tests for Geoapify, Google Weather, & Data Provenance ──────────────────
import pytest
import pytest_asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from typing import Dict, Any

from services.geoapify_service import (
    is_geoapify_configured,
    geocode_destination,
    build_destination_candidate_pool,
    calculate_route,
    CATEGORY_MAPPINGS,
)
from services.weather_engine import get_weather, _WEATHER_CACHE
from services.transport_engine import get_transport
from services.destination_cache import get_destination_data
from services.feasibility_validator import validate_itinerary_feasibility, repair_itinerary_feasibility
from services.itinerary_engine import get_pool_requirements


@pytest.mark.asyncio
async def test_geoapify_config_check():
    """Verify is_geoapify_configured responds accurately to API key presence."""
    with patch.dict("os.environ", {"GEOAPIFY_API_KEY": "test_api_key_12345"}):
        from services import geoapify_service
        geoapify_service.GEOAPIFY_API_KEY = "test_api_key_12345"
        assert is_geoapify_configured() is True

    with patch.dict("os.environ", {"GEOAPIFY_API_KEY": ""}):
        from services import geoapify_service
        geoapify_service.GEOAPIFY_API_KEY = ""
        assert is_geoapify_configured() is False


@pytest.mark.asyncio
async def test_geocode_destination_with_geoapify():
    """Verify geocode_destination parses Geoapify v1 responses correctly."""
    mock_resp_data = {
        "features": [
            {
                "properties": {
                    "city": "Jaipur",
                    "lat": 26.9124,
                    "lon": 75.7873,
                    "bbox": [75.6, 26.8, 76.0, 27.0],
                    "country": "India",
                    "state": "Rajasthan",
                    "place_id": "geo_jaipur_123",
                    "formatted": "Jaipur, Rajasthan, India",
                },
                "geometry": {
                    "coordinates": [75.7873, 26.9124]
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_resp_data

    with patch.dict("os.environ", {"GEOAPIFY_API_KEY": "valid_key_123"}), \
         patch("services.geoapify_service.is_geoapify_configured", return_value=True), \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        res = await geocode_destination("Jaipur")
        assert res is not None
        assert res["name"] == "Jaipur"
        assert res["lat"] == 26.9124
        assert res["lng"] == 75.7873
        assert res["source"] == "geoapify_v1"


@pytest.mark.asyncio
async def test_geocode_destination_osm_fallback():
    """Verify geocode_destination falls back cleanly to OSM Nominatim when Geoapify is unconfigured."""
    mock_osm_data = [
        {
            "lat": "26.9124",
            "lon": "75.7873",
            "boundingbox": ["26.8", "27.0", "75.6", "76.0"],
            "display_name": "Jaipur, Rajasthan, India",
            "place_id": 98765,
        }
    ]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_osm_data

    with patch("services.geoapify_service.is_geoapify_configured", return_value=False), \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        res = await geocode_destination("Jaipur")
        assert res is not None
        assert res["name"] == "Jaipur"
        assert res["lat"] == 26.9124
        assert res["lng"] == 75.7873
        assert res["source"] == "osm_nominatim"


@pytest.mark.asyncio
async def test_geoapify_candidate_pool_builder():
    """Verify build_destination_candidate_pool constructs required candidates scaled by trip length."""
    mock_geo_res = {
        "name": "Jaipur",
        "lat": 26.9124,
        "lng": 75.7873,
        "bbox": [75.6, 26.8, 76.0, 27.0],
        "country": "India",
        "state": "Rajasthan",
        "source": "geoapify_v1",
    }

    # Generate mock places
    def mock_places_response(categories: str, limit: int):
        places = []
        is_rest = "catering" in categories
        is_hotel = "accommodation" in categories
        for i in range(limit):
            cat_name = "Hotel" if is_hotel else ("Restaurant" if is_rest else "Attraction")
            places.append({
                "properties": {
                    "name": f"Jaipur {cat_name} {i+1}",
                    "lat": 26.9124 + (i * 0.005),
                    "lon": 75.7873 + (i * 0.005),
                    "categories": [categories.split(",")[0]],
                    "place_id": f"pid_{i}",
                    "formatted": f"Address {i}, Jaipur",
                }
            })
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"features": places}
        return m

    async def mock_get(url, params=None, headers=None):
        cats = params.get("categories", "") if params else ""
        limit = int(params.get("limit", 20)) if params else 20
        return mock_places_response(cats, limit)

    with patch("services.geoapify_service.is_geoapify_configured", return_value=True), \
         patch("services.geoapify_service.geocode_destination", new_callable=AsyncMock, return_value=mock_geo_res), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        # Test 3-day pool scaling
        pool_3d = await build_destination_candidate_pool("Jaipur", days=3, purpose="cultural", budget="moderate")
        assert pool_3d is not None
        req_3d = get_pool_requirements(3)
        assert len(pool_3d["highlights"]) >= min(req_3d["highlights"], 15)
        assert len(pool_3d["restaurants"]) >= min(req_3d["restaurants"], 8)
        assert pool_3d["dataSources"]["source"] == "geoapify"
        assert pool_3d["dataSources"]["llmUsed"] is False
        assert pool_3d["mapCenter"]["lat"] == 26.9124
        assert pool_3d["mapCenter"]["lng"] == 75.7873
        
        # Verify zero-LLM path
        with patch("services.itinerary_engine.fetch_destination_data_with_gemini") as mock_gemini:
            from services.destination_cache import get_destination_data
            await get_destination_data("Jaipur", days=3)
            mock_gemini.assert_not_called()

@pytest.mark.asyncio
async def test_gemini_fallback_flag():
    """Verify Gemini fallback respects ENABLE_GEMINI_DESTINATION_FALLBACK."""
    from services.destination_cache import get_destination_data
    import services.destination_cache as dest_cache
    
    with patch("services.geoapify_service.is_geoapify_configured", return_value=False), \
         patch("services.destination_cache._mem_get", return_value=None), \
         patch("services.destination_cache._file_get", new_callable=AsyncMock, return_value=None), \
         patch("services.destination_cache._csv_get", new_callable=AsyncMock, return_value=None):
        
        # When disabled, Gemini should not be called
        dest_cache.ENABLE_GEMINI_DESTINATION_FALLBACK = False
        with patch("services.destination_cache.fetch_destination_data_with_gemini", new_callable=AsyncMock) as mock_gemini:
            res = await get_destination_data("Unknown Place", days=3)
            assert res is None
            mock_gemini.assert_not_called()
            
        # When enabled, Gemini should be called
        dest_cache.ENABLE_GEMINI_DESTINATION_FALLBACK = True
        with patch("services.destination_cache.fetch_destination_data_with_gemini", new_callable=AsyncMock, return_value={"highlights": []}) as mock_gemini:
            res = await get_destination_data("Unknown Place", days=3)
            assert res is not None
            mock_gemini.assert_called_once()



@pytest.mark.asyncio
async def test_weather_engine_nullable_coordinates():
    """Verify get_weather handles None coordinates truthfully without hallucinating fallback locations."""
    res = await get_weather(lat=None, lng=None)
    assert res["current"] is None
    assert res["daily"] == []
    assert res["source"] == "none"


@pytest.mark.asyncio
async def test_weather_engine_caching():
    """Verify get_weather caches results for Google Weather."""
    _WEATHER_CACHE.clear()

    mock_current = {
        "temperature": {"degrees": 28.5},
        "feelsLikeTemperature": {"degrees": 29.0},
        "relativeHumidity": 50,
        "precipitationProbability": 0,
        "weatherCondition": {"description": {"text": "Clear"}},
        "wind": {"speed": {"value": 12.0}}
    }
    
    mock_daily = {
        "days": [
            {
                "date": {"year": 2026, "month": 9, "day": 21},
                "temperatureMax": {"degrees": 32.0},
                "temperatureMin": {"degrees": 22.0},
                "dayTimeForecast": {
                    "precipitationProbability": 10,
                    "weatherCondition": {"description": {"text": "Clear"}}
                }
            }
        ]
    }

    async def mock_get(url, params=None, headers=None, **kwargs):
        m = MagicMock()
        m.status_code = 200
        if "currentConditions" in url:
            m.json.return_value = mock_current
        else:
            m.json.return_value = mock_daily
        return m

    with patch.dict("os.environ", {"GOOGLE_WEATHER_API_KEY": "valid_key_123"}), \
         patch("services.weather_engine.GOOGLE_WEATHER_API_KEY", "valid_key_123"), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        # First call fetches and caches
        w1 = await get_weather(26.9124, 75.7873)
        assert w1["source"] == "google_weather"
        assert w1["current"]["temp"] in (28, 29, 28.5)
        assert len(w1["daily"]) == 1

        # Second call returns from cache
        with patch("services.weather_engine._fetch_google_current", side_effect=Exception("Should not be called")):
            w2 = await get_weather(26.9124, 75.7873)
            assert w2 == w1


@pytest.mark.asyncio
async def test_transport_engine_multi_provider():
    """Verify transport engine queries Geoapify/OSRM with fallback to Haversine."""
    mock_route = {
        "distanceM": 4500,
        "durationS": 720,
        "source": "geoapify_v1",
    }

    with patch("services.transport_engine.is_geoapify_configured", return_value=True), \
         patch("services.transport_engine.calculate_route", new_callable=AsyncMock, return_value=mock_route):
        res = await get_transport(26.9124, 75.7873, 26.9500, 75.8200)
        assert res["source"] == "geoapify_routing"
        assert "4.5 km" in res["distance"]
        assert len(res["options"]) == 3
