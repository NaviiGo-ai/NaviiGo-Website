"""Actual provider normalization must remain usable by itinerary generation."""
import pytest

from services.geoapify_service import normalize_geoapify_place
from services.itinerary_model import _score_restaurant, generate_itinerary


@pytest.mark.parametrize("rating,expected", [(None, 0.0), (0, 0.0), (4.7, 47.0)])
def test_restaurant_rating_score_preserves_unknown_and_numeric_values(rating, expected):
    source = {"name": "Provider restaurant", "rating": rating, "category": "casual"}
    result = _score_restaurant(source, {}, "comfort")
    assert result["score"] == expected
    assert result["rating"] == rating
    assert source["rating"] == rating


def test_generation_accepts_normalized_restaurants_and_hotels_with_unknown_ratings():
    def places(place_type, category, count):
        return [normalize_geoapify_place({
            "properties": {
                "name": f"Provider {place_type} {index}",
                "lat": 26.9124 + index * 0.001,
                "lon": 75.7873 + index * 0.001,
                "categories": [category],
            },
        }, place_type, index) for index in range(count)]

    restaurants = places("restaurant", "catering.restaurant", 10)
    hotels = places("hotel", "accommodation.hotel", 2)
    assert all(place["rating"] is None for place in restaurants + hotels)
    data = {
        "mapCenter": {"lat": 26.9124, "lng": 75.7873},
        "highlights": places("highlight", "tourism.attraction", 20),
        "restaurants": restaurants,
        "hotels": hotels,
    }
    result = generate_itinerary({
        "destName": "Jaipur", "days": 1, "budget": 15000,
        "purpose": "cultural", "group": "solo", "arrivalTime": "morning",
        "startDate": "2026-10-20",
    }, data)
    assert result is not None
    assert result["dayPlans"]
    assert any(day["activities"] for day in result["dayPlans"])
    assert all(place["rating"] is None for place in restaurants + hotels)
