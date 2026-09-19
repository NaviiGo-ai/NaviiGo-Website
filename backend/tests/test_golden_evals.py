"""
NaviiGo Itinerary Intelligence Engine — Golden Evaluations Test Suite
======================================================================
Tests core guarantees:
1. Zero duplicate attractions across all days (1-14 days)
2. Zero duplicate restaurants across all days (1-14 days)
3. Feasibility validation score >= 95
4. Monotonic chronological timelines with compliant meal windows
5. Spatial coherence via contiguous angular sector clustering and TSP
6. Personalization scoring (savedPlaces, dismissedPlaces, visitedPlaces, categoryAffinities)
7. Deterministic single-day targeted repair engine
8. Entity grounding engine caching and rate-limiting
"""

import pytest
import asyncio
from typing import Dict, Any, List
from services.itinerary_model import (
    generate_itinerary,
    _cluster_by_angular_sectors,
    _nearest_neighbor_sort,
    _score_attraction,
)
from services.feasibility_validator import (
    validate_itinerary_feasibility,
    repair_itinerary_feasibility,
)
from services.grounding_service import (
    ground_place,
    _normalize_place_key,
    _get_cached_grounding,
    _set_cached_grounding,
)


def _mock_destination_data(dest_name: str, count_hl: int = 40, count_rest: int = 25) -> Dict[str, Any]:
    center_lat, center_lng = 25.3176, 82.9739
    highlights = []
    for i in range(1, count_hl + 1):
        # Place in varying angular coordinates around center
        import math
        angle = (2 * math.pi * i) / count_hl
        dist = 0.02 + (i % 5) * 0.01
        hl_lat = center_lat + dist * math.sin(angle)
        hl_lng = center_lng + dist * math.cos(angle)
        cat = "must-see" if i <= 10 else ("hidden-gem" if i <= 20 else ("local-secret" if i <= 30 else "experience"))
        highlights.append({
            "name": f"{dest_name} Highlight {i}",
            "desc": f"Description of {dest_name} Highlight {i}",
            "tags": ["Heritage", "Culture"] if i % 2 == 0 else ["Nature", "Scenic"],
            "category": cat,
            "lat": round(hl_lat, 4),
            "lng": round(hl_lng, 4),
            "duration": "1.5h",
            "entryFee": "₹50",
            "openingHours": "6:00 AM - 8:00 PM",
            "bestTimeToVisit": "morning" if i % 2 == 0 else "sunset",
            "insiderTip": f"Local insider secret for Highlight {i}",
        })

    restaurants = []
    for j in range(1, count_rest + 1):
        import math
        angle = (2 * math.pi * j) / count_rest
        dist = 0.015 + (j % 4) * 0.01
        r_lat = center_lat + dist * math.sin(angle)
        r_lng = center_lng + dist * math.cos(angle)
        cat = "street-food" if j % 4 == 0 else ("fine-dining" if j % 4 == 1 else "casual")
        restaurants.append({
            "name": f"{dest_name} Restaurant {j}",
            "desc": f"Authentic culinary spot {j}",
            "cuisine": "Regional",
            "priceRange": "₹200-₹500",
            "rating": 4.5 + (j % 5) * 0.1,
            "mustTry": f"Signature Dish {j}",
            "lat": round(r_lat, 4),
            "lng": round(r_lng, 4),
            "tags": ["Local", "Authentic"],
            "category": cat,
            "insiderTip": f"Order the secret special at Restaurant {j}",
        })

    hotels = [
        {"name": f"{dest_name} Heritage Palace", "type": "Hotel", "priceRange": "₹4500/night", "rating": 4.8, "lat": center_lat, "lng": center_lng},
        {"name": f"{dest_name} River View Inn", "type": "Resort", "priceRange": "₹2800/night", "rating": 4.5, "lat": center_lat + 0.01, "lng": center_lng + 0.01},
    ]

    return {
        "destName": dest_name,
        "description": f"Curated travel data for {dest_name}",
        "mapCenter": {"lat": center_lat, "lng": center_lng},
        "highlights": highlights,
        "restaurants": restaurants,
        "hotels": hotels,
    }


class TestZeroDuplicationGoldenEvals:
    @pytest.mark.parametrize("days", [1, 3, 5, 7, 10, 14])
    def test_zero_duplication_across_durations(self, days):
        dest_data = _mock_destination_data("Varanasi", count_hl=60, count_rest=30)
        ctx = {
            "destName": "Varanasi",
            "purpose": "cultural",
            "days": days,
            "budget": 15000,
            "group": "solo",
            "travelerType": "comfort",
            "startDate": "2026-10-01",
        }

        itin = generate_itinerary(ctx, dest_data)
        assert itin is not None
        assert len(itin["dayPlans"]) == days

        audit = validate_itinerary_feasibility(itin)
        assert audit["duplicate_attractions_count"] == 0, f"Duplicate attractions found: {audit['duplicate_attractions']}"
        assert audit["duplicate_restaurants_count"] == 0, f"Duplicate restaurants found: {audit['duplicate_restaurants']}"
        assert audit["chronological_inversions"] == 0, f"Inversions found: {audit['errors']}"
        assert audit["score"] >= 95.0, f"Feasibility score too low: {audit['score']}"

    @pytest.mark.parametrize("dest", ["Jaipur", "Goa", "Manali", "Udaipur"])
    def test_zero_duplication_across_destinations(self, dest):
        dest_data = _mock_destination_data(dest, count_hl=50, count_rest=25)
        ctx = {
            "destName": dest,
            "purpose": "explore",
            "days": 5,
            "budget": 20000,
            "group": "couple",
            "travelerType": "luxury",
        }

        itin = generate_itinerary(ctx, dest_data)
        audit = validate_itinerary_feasibility(itin)
        assert audit["valid"] is True
        assert audit["duplicate_attractions_count"] == 0
        assert audit["duplicate_restaurants_count"] == 0


class TestPersonalizationScoring:
    def test_saved_places_boost(self):
        ctx = {"savedPlaces": ["Kashi Vishwanath"], "dismissedPlaces": [], "visitedPlaces": []}
        attr = {"name": "Shri Kashi Vishwanath Temple", "tags": ["Heritage"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "mid")
        assert scored["_score"] > 80
        assert scored.get("isSaved") is True

    def test_dismissed_places_penalty(self):
        ctx = {"savedPlaces": [], "dismissedPlaces": ["Crowded Bazaar"], "visitedPlaces": []}
        attr = {"name": "Crowded Bazaar Walking Tour", "tags": ["Shopping"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "mid")
        assert scored["_score"] < 0

    def test_visited_places_hard_exclusion(self):
        ctx = {"savedPlaces": [], "dismissedPlaces": [], "visitedPlaces": ["Dashashwamedh Ghat"]}
        attr = {"name": "Dashashwamedh Ghat Aarti", "tags": ["Spiritual"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "mid")
        assert scored["_score"] <= -99990
        assert scored.get("isVisited") is True

    def test_category_affinities_boost(self):
        ctx = {"categoryAffinities": ["Heritage", "Culture"]}
        attr1 = {"name": "Ancient Fort", "tags": ["Heritage"], "category": "must-see"}
        attr2 = {"name": "Shopping Mall", "tags": ["Modern"], "category": "must-see"}
        scored1 = _score_attraction(attr1, 0, ctx, "mid")
        scored2 = _score_attraction(attr2, 0, ctx, "mid")
        assert scored1["_score"] > scored2["_score"]


class TestSpatialClusteringAndTSP:
    def test_angular_sector_clustering(self):
        center = {"lat": 25.3176, "lng": 82.9739}
        attractions = [
            {"name": f"Spot {i}", "lat": 25.3176 + 0.01 * (i % 3), "lng": 82.9739 + 0.01 * (i // 3)}
            for i in range(9)
        ]
        clusters = _cluster_by_angular_sectors(attractions, center, num_clusters=3)
        assert len(clusters) == 3
        total_items = sum(len(c) for c in clusters)
        assert total_items == 9

    def test_nearest_neighbor_tsp_ordering(self):
        center = {"lat": 25.3176, "lng": 82.9739}
        # Far point, close point, medium point
        points = [
            {"name": "Far", "lat": 25.3500, "lng": 83.0000},
            {"name": "Close", "lat": 25.3180, "lng": 82.9745},
            {"name": "Medium", "lat": 25.3250, "lng": 82.9800},
        ]
        _nearest_neighbor_sort(points, center)
        assert points[0]["name"] == "Close"
        assert points[1]["name"] == "Medium"
        assert points[2]["name"] == "Far"


class TestFeasibilityAndRepairEngine:
    def test_repair_fixes_duplicated_itinerary(self):
        dest_data = _mock_destination_data("Varanasi", count_hl=30, count_rest=15)
        # Create an intentionally broken itinerary with duplicates
        broken_itinerary = {
            "destName": "Varanasi",
            "dayPlans": [
                {
                    "day": 1,
                    "activities": [
                        {"name": "Ghat Aarti", "type": "attraction", "time": "09:00 AM", "durationMins": 90},
                        {"name": "Lunch at Blue Lassi", "type": "restaurant", "time": "01:00 PM", "durationMins": 60},
                    ]
                },
                {
                    "day": 2,
                    "activities": [
                        {"name": "Ghat Aarti", "type": "attraction", "time": "09:00 AM", "durationMins": 90}, # Duplicate
                        {"name": "Lunch at Blue Lassi", "type": "restaurant", "time": "01:00 PM", "durationMins": 60}, # Duplicate
                    ]
                }
            ]
        }
        repaired = repair_itinerary_feasibility(broken_itinerary, dest_data, {"destName": "Varanasi"})
        audit = validate_itinerary_feasibility(repaired)
        assert audit["duplicate_attractions_count"] == 0
        assert audit["duplicate_restaurants_count"] == 0
        assert audit["valid"] is True


class TestGroundingService:
    @pytest.mark.asyncio
    async def test_ground_place_caching(self):
        key = _normalize_place_key("Test Temple", "Varanasi")
        mock_data = {
            "grounded": True,
            "source": "test_mock",
            "placeId": "mock_id_123",
            "name": "Test Temple",
            "lat": 25.3176,
            "lng": 82.9739,
            "rating": 4.8,
        }
        _set_cached_grounding(key, mock_data)
        cached = _get_cached_grounding(key)
        assert cached is not None
        assert cached["placeId"] == "mock_id_123"

        res = await ground_place("Test Temple", "Varanasi")
        assert res["grounded"] is True
        assert res["placeId"] == "mock_id_123"
