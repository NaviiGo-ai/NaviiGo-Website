"""
NaviiGo Itinerary Intelligence Engine — Comprehensive Test Suite & Golden Evals
================================================================================
Validates:
1. Dynamic Candidate Pool formula across 1-14 days.
2. Contiguous Angular Sector Clustering (atan2) & Nearest-Neighbor TSP optimization.
3. Personalization Engine (savedPlaces +50, dismissedPlaces -100, visitedPlaces -99999, categoryAffinities, pace, dietary).
4. Strict Zero-Duplication Guarantee (0 duplicate attractions, 0 duplicate restaurants across 1-14 days).
5. Monotonic Chronological Timelines & Meal Window Compliance (Lunch 11:30-16:00, Dinner 18:30-23:30).
6. Feasibility Validator & Targeted Repair Engine (Feasibility score >= 95/100).
7. Entity Grounding Service (Google Places v1 + OSM Nominatim fallback and 7-day caching).
"""

import pytest
import math
import asyncio
from typing import Dict, Any, List

from services.itinerary_engine import get_pool_requirements, DEST_DATA_VERSION
from services.feasibility_validator import validate_itinerary_feasibility, repair_itinerary_feasibility
from services.grounding_service import ground_place, ground_entities_batch, _normalize_place_key
from services.itinerary_model import (
    generate_itinerary,
    _cluster_by_angular_sectors,
    _nearest_neighbor_sort,
    _score_attraction,
    _filter_restaurants_by_diet,
    _haversine_km,
)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Dynamic Candidate Pool Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestCandidatePoolScaling:
    @pytest.mark.parametrize("days,min_hl,min_rest", [
        (1, 20, 8),
        (3, 20, 10),
        (5, 28, 14),
        (7, 36, 18),
        (10, 48, 24),
        (14, 64, 30),
    ])
    def test_pool_requirements_scaling(self, days, min_hl, min_rest):
        reqs = get_pool_requirements(days)
        assert reqs["highlights"] >= min_hl
        assert reqs["restaurants"] >= min_rest
        assert reqs["must_see"] + reqs["hidden_gem"] + reqs["local_secret"] + reqs["experience"] == reqs["highlights"]
        assert reqs["street_food"] + reqs["casual"] + reqs["fine_dining"] + reqs["cafe"] == reqs["restaurants"]


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Spatial Clustering & TSP Route Optimization Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestSpatialOptimization:
    def test_angular_sector_clustering_partitions_cleanly(self):
        center = {"lat": 26.9124, "lng": 75.7873}  # Jaipur Center
        # Create 12 points distributed in polar coordinates around center
        attractions = []
        for i in range(12):
            angle = (i / 12.0) * 2 * math.pi
            r = 0.05
            attractions.append({
                "name": f"Spot_{i}",
                "lat": center["lat"] + r * math.sin(angle),
                "lng": center["lng"] + r * math.cos(angle),
            })

        clusters = _cluster_by_angular_sectors(attractions, center, num_clusters=3)
        assert len(clusters) == 3
        assert sum(len(c) for c in clusters) == 12
        for c in clusters:
            assert len(c) == 4

    def test_nearest_neighbor_tsp_minimizes_backtracking(self):
        center = {"lat": 0.0, "lng": 0.0}
        # Inverted line of points: 0, 10, 1, 9, 2, 8
        items = [
            {"name": "P10", "lat": 1.0, "lng": 1.0},
            {"name": "P1", "lat": 0.1, "lng": 0.1},
            {"name": "P5", "lat": 0.5, "lng": 0.5},
            {"name": "P2", "lat": 0.2, "lng": 0.2},
        ]
        _nearest_neighbor_sort(items, center)
        # Should be ordered by proximity starting from center (0,0) -> P1, P2, P5, P10
        names = [item["name"] for item in items]
        assert names == ["P1", "P2", "P5", "P10"]


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Personalization Engine Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestPersonalizationScoring:
    def test_saved_places_boost(self):
        ctx = {"savedPlaces": ["Amber Fort"]}
        attr = {"name": "Amber Fort", "tags": ["Heritage"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "comfort")
        assert scored["score"] >= 100
        assert scored.get("isSaved") is True

    def test_dismissed_places_penalty(self):
        ctx = {"dismissedPlaces": ["City Palace"]}
        attr = {"name": "City Palace", "tags": ["Heritage"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "comfort")
        assert scored["score"] < 0

    def test_visited_places_hard_exclusion(self):
        ctx = {"visitedPlaces": ["Hawa Mahal"]}
        attr = {"name": "Hawa Mahal", "tags": ["Heritage"], "category": "must-see"}
        scored = _score_attraction(attr, 0, ctx, "comfort")
        assert scored["score"] == -99999
        assert scored.get("isVisited") is True

    def test_category_affinities_boost(self):
        ctx = {"categoryAffinities": ["Spiritual", "Culinary"]}
        attr1 = {"name": "Kashi Vishwanath", "tags": ["Spiritual"], "category": "must-see"}
        attr2 = {"name": "Modern Art Gallery", "tags": ["Art"], "category": "must-see"}
        s1 = _score_attraction(attr1, 0, ctx, "comfort")
        s2 = _score_attraction(attr2, 0, ctx, "comfort")
        assert s1["score"] > s2["score"]

    def test_dietary_filtering(self):
        restaurants = [
            {"name": "Pure Veg Thali", "tags": ["Pure Veg", "Rajasthani"], "desc": "Vegetarian only"},
            {"name": "Mughlai Meat Corner", "tags": ["Non-Veg", "Mughlai"], "desc": "Chicken and mutton"},
        ]
        veg_filtered = _filter_restaurants_by_diet(restaurants, "pure_veg")
        assert len(veg_filtered) == 1
        assert veg_filtered[0]["name"] == "Pure Veg Thali"


# ═══════════════════════════════════════════════════════════════════════════════
# 4. End-to-End Itinerary Generation & Feasibility Golden Evals
# ═══════════════════════════════════════════════════════════════════════════════

def _mock_destination_data(dest_name: str, count_hl: int = 30, count_rest: int = 15) -> Dict[str, Any]:
    center_lat, center_lng = 25.3176, 82.9739  # Varanasi
    highlights = []
    for i in range(count_hl):
        angle = (i / count_hl) * 2 * math.pi
        r = 0.02 + 0.01 * (i % 3)
        cat = "must-see" if i < 6 else ("hidden-gem" if i < 15 else ("local-secret" if i < 22 else "experience"))
        highlights.append({
            "name": f"{dest_name} Highlight {i+1}",
            "desc": f"Description for highlight {i+1} in {dest_name}.",
            "category": cat,
            "tags": ["Culture", "Heritage"],
            "lat": center_lat + r * math.sin(angle),
            "lng": center_lng + r * math.cos(angle),
            "duration": "1.5h",
            "openingHours": "6:00 AM - 8:00 PM",
            "openDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        })

    restaurants = []
    for i in range(count_rest):
        angle = (i / count_rest) * 2 * math.pi
        r = 0.015 + 0.005 * (i % 2)
        cat = "street-food" if i < 4 else ("casual" if i < 10 else "fine-dining")
        restaurants.append({
            "name": f"{dest_name} Diner {i+1}",
            "desc": f"Delicious local food at spot {i+1}.",
            "category": cat,
            "tags": ["Local", "Vegetarian"],
            "lat": center_lat + r * math.sin(angle),
            "lng": center_lng + r * math.cos(angle),
            "mustTry": "Special Thali",
            "priceRange": "₹200-400",
        })

    hotels = [
        {"name": f"{dest_name} Heritage Palace", "lat": center_lat, "lng": center_lng, "type": "Heritage"}
    ]

    return {
        "destName": dest_name,
        "description": f"Curated travel guide for {dest_name}.",
        "mapCenter": {"lat": center_lat, "lng": center_lng},
        "highlights": highlights,
        "restaurants": restaurants,
        "hotels": hotels,
    }


class TestGoldenEvaluations:
    @pytest.mark.parametrize("dest,days", [
        ("Varanasi", 1),
        ("Jaipur", 3),
        ("Goa", 5),
        ("Manali", 7),
        ("Kerala", 10),
        ("Udaipur", 14),
    ])
    def test_zero_duplication_and_feasibility_across_durations(self, dest, days):
        reqs = get_pool_requirements(days)
        dest_data = _mock_destination_data(dest, count_hl=reqs["highlights"], count_rest=reqs["restaurants"])

        ctx = {
            "destName": dest,
            "purpose": "explore",
            "days": days,
            "budget": 20000,
            "group": "couple",
            "travelerType": "balanced",
            "startDate": "2026-10-15",
        }

        itinerary = generate_itinerary(ctx, dest_data)
        assert itinerary is not None
        assert "dayPlans" in itinerary
        assert len(itinerary["dayPlans"]) == days

        # Feasibility audit
        audit = validate_itinerary_feasibility(itinerary)

        assert audit["valid"] is True, f"Feasibility validation failed for {dest} ({days} days): {audit['errors']}"
        assert audit["duplicate_attractions_count"] == 0, f"Found duplicate attractions: {audit['duplicate_attractions']}"
        assert audit["duplicate_restaurants_count"] == 0, f"Found duplicate restaurants: {audit['duplicate_restaurants']}"
        assert audit["chronological_inversions"] == 0, f"Found chronological inversions: {audit['errors']}"
        assert audit["score"] >= 95.0, f"Feasibility score {audit['score']} is below target threshold 95.0"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Targeted Repair Engine Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestTargetedRepairEngine:
    def test_repair_fixes_duplicate_and_inversions(self):
        dest_data = _mock_destination_data("Varanasi", count_hl=10, count_rest=6)
        ctx = {"destName": "Varanasi"}

        # Intentionally construct broken itinerary
        broken_itinerary = {
            "destName": "Varanasi",
            "dayPlans": [
                {
                    "day": 1,
                    "activities": [
                        {"name": "Duplicate Ghat", "type": "attraction", "time": "10:00 AM", "durationMins": 90},
                        {"name": "Lunch at Same Cafe", "type": "restaurant", "time": "09:00 AM", "durationMins": 60},  # Inversion + wrong meal window
                    ]
                },
                {
                    "day": 2,
                    "activities": [
                        {"name": "Duplicate Ghat", "type": "attraction", "time": "02:00 PM", "durationMins": 60},  # Duplicate attraction
                        {"name": "Lunch at Same Cafe", "type": "restaurant", "time": "01:00 PM", "durationMins": 60},  # Duplicate restaurant
                    ]
                }
            ]
        }

        repaired = repair_itinerary_feasibility(broken_itinerary, dest_data, ctx)
        audit = validate_itinerary_feasibility(repaired)

        assert audit["valid"] is True
        assert audit["duplicate_attractions_count"] == 0
        assert audit["duplicate_restaurants_count"] == 0
        assert audit["chronological_inversions"] == 0


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Entity Grounding Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestEntityGrounding:
    def test_normalize_place_key(self):
        key = _normalize_place_key("Dashashwamedh Ghat", "Varanasi")
        assert key == "varanasi_dashashwamedh_ghat"

    @pytest.mark.asyncio
    async def test_ground_place_fallback_graceful(self):
        res = await ground_place("Unknown Remote Mountain 98765", "Nowhere", lat=20.0, lng=78.0)
        assert "lat" in res
        assert "lng" in res
        assert res["lat"] == 20.0

    @pytest.mark.asyncio
    async def test_ground_entities_batch(self):
        entities = [
            {"name": "Ghat A", "lat": 25.31, "lng": 82.97},
            {"name": "Temple B", "lat": 25.32, "lng": 82.98},
        ]
        grounded = await ground_entities_batch(entities, dest_name="Varanasi", max_concurrency=2)
        assert len(grounded) == 2
        assert grounded[0]["name"] == "Ghat A"
