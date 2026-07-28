# ─── Itinerary Router ───────────────────────────────────────────────────────────
# Production-ready flow:
#   1. Check multi-layer cache for destination data (memory → file → CSV → Gemini)
#   2. Run deterministic personalization engine (itinerary_model)
#   3. Optionally save to Firebase if userId is provided
#   4. Return the fully processed itinerary with dayPlans

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.destination_cache import get_destination_data
from services.itinerary_model import generate_itinerary
from services.from_link_engine import extract_from_link
from services.user_data import save_itinerary, get_full_user_context, add_past_destination
from services.gemini_cache import cached_gemini_call
from limiter import limiter

router = APIRouter()


class ItineraryRequest(BaseModel):
    userId: Optional[str] = None  # Firebase UID — saves itinerary & enriches with user data
    destination: Optional[str] = None
    destName: str
    purpose: str = "cultural"
    group: Optional[str] = "solo"
    days: int = Field(default=3, ge=1, le=14)
    budget: int = Field(default=15000, ge=0)
    startDate: Optional[str] = None
    travelerType: Optional[str] = "comfort"
    preferences: Optional[Dict[str, Any]] = None
    browsingSignals: Optional[Dict[str, Any]] = None


class FromLinkRequest(BaseModel):
    url: Optional[str] = None
    captionText: Optional[str] = None


@router.post("/generate")
@limiter.limit("5/minute")
async def generate(payload: ItineraryRequest, request: Request):
    try:
        if not payload.destName or not payload.purpose or not payload.days:
            raise HTTPException(status_code=400, detail="Missing required fields: destName, purpose, days")

        resolved_dest = payload.destination or payload.destName.lower().replace(" ", "")
        dest_name = payload.destName

        # Enrich with Firebase user data if userId provided
        preferences = payload.preferences
        browsing_signals = payload.browsingSignals
        traveler_type = payload.travelerType or "comfort"
        group = payload.group or "solo"

        if payload.userId:
            user_ctx = await get_full_user_context(payload.userId)
            if not preferences and user_ctx.get("interests"):
                preferences = {"interests": user_ctx["interests"]}
            if not browsing_signals and user_ctx.get("browsingSignals"):
                browsing_signals = user_ctx["browsingSignals"]
            if user_ctx.get("travelStyle"):
                traveler_type = user_ctx["travelStyle"]
            if user_ctx.get("preferredGroup"):
                group = user_ctx["preferredGroup"]

        # Build user context (used by the deterministic engine)
        user_context = {
            "destination": resolved_dest,
            "destName": dest_name,
            "purpose": payload.purpose,
            "group": group,
            "days": payload.days or 3,
            "budget": payload.budget or 15000,
            "startDate": payload.startDate or datetime.now().strftime("%Y-%m-%d"),
            "travelerType": traveler_type,
            "preferences": preferences,
            "pastTrips": [],
            "browsingSignals": browsing_signals,
        }

        # ── Step 1: Get destination data from cache (memory → file → CSV → Gemini) ──
        print(f"[Itinerary] Fetching data for \"{dest_name}\" (cache-first)...")
        gemini_data = await get_destination_data(
            dest_name=dest_name,
            purpose=payload.purpose,
            budget=payload.budget or 15000,
            days=payload.days or 3,
        )

        if gemini_data:
            # ── Step 2: Run deterministic personalization engine ──
            print(f"[Itinerary] Got destination data, running personalization...")
            result = generate_itinerary(user_context, gemini_data)
            if result:
                # ── Step 3: Save to Firebase if userId provided ──
                if payload.userId:
                    await save_itinerary(payload.userId, {
                        "destination": resolved_dest,
                        "destName": dest_name,
                        "form": {
                            "purpose": payload.purpose,
                            "group": group,
                            "days": payload.days,
                            "budget": payload.budget,
                            "startDate": payload.startDate,
                            "travelerType": traveler_type,
                        },
                        "generatedData": result,
                    })

                return {
                    "success": True,
                    "itinerary": result,
                    "source": "ai-personalized",
                }

        # ── Fallback: minimal data + deterministic engine ──
        print(f"[Itinerary] Data fetch failed for \"{dest_name}\", using minimal fallback")
        try:
            fallback_data = _build_minimal_dest_info(dest_name)
            fallback_result = generate_itinerary(user_context, fallback_data)
            if fallback_result:
                # Still save to Firebase
                if payload.userId:
                    await save_itinerary(payload.userId, {
                        "destination": resolved_dest,
                        "destName": dest_name,
                        "form": {"purpose": payload.purpose, "group": group, "days": payload.days},
                        "generatedData": fallback_result,
                    })
                return {
                    "success": True,
                    "itinerary": fallback_result,
                    "source": "fallback-personalized",
                }
        except Exception as fallback_err:
            print(f"[Itinerary] Fallback engine also failed: {fallback_err}")

        # Last resort
        return {
            "success": True,
            "itinerary": {
                "destName": dest_name,
                "description": f"{dest_name} is a wonderful destination. Plan your trip with NaviiGo!",
                "avgCost": "₹2,000 – ₹8,000",
                "crowdLevel": "Medium",
                "crowdNote": "Check seasonal crowd levels",
                "logistics": {"flights": "Check airline websites", "trains": "Check IRCTC"},
                "mapCenter": {"lat": 20.5937, "lng": 78.9629},
                "highlights": [],
                "restaurants": [],
                "hotels": [],
                "dayPlans": [],
            },
            "source": "empty-fallback",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Itinerary] Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/from-link")
@limiter.limit("10/minute")
async def from_link(payload: FromLinkRequest, request: Request):
    try:
        extracted = await extract_from_link(url=payload.url, caption_text=payload.captionText)
        return {"success": True, "extracted": extracted}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_minimal_dest_info(dest_name: str) -> dict:
    """Build minimal destination data when all sources are unavailable."""
    return {
        "description": f"{dest_name} is a vibrant destination in India with rich culture, stunning landscapes, and unforgettable experiences.",
        "avgCost": "₹2,000 – ₹8,000 per day",
        "crowdLevel": "Medium",
        "crowdNote": "Varies by season — check local advisories",
        "logistics": {"flights": "Check airline websites for latest fares", "trains": "Check IRCTC for trains"},
        "weather": {},
        "mapCenter": {"lat": 20.5937, "lng": 78.9629},
        "highlights": [
            {"name": f"{dest_name} Heritage Walk", "desc": "Explore the historic old quarter and local markets.", "tags": ["Heritage", "Culture"], "lat": 20.60, "lng": 78.97, "duration": "2-3 hrs", "img": "", "bestMonths": "Oct-Mar"},
            {"name": "Local Morning Market", "desc": "Wake up early and visit where locals shop.", "tags": ["Market", "Food"], "lat": 20.59, "lng": 78.96, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "Sunset Viewpoint", "desc": "The best sunset spot in the city.", "tags": ["Nature", "Sunset"], "lat": 20.58, "lng": 78.95, "duration": "1 hr", "img": "", "bestMonths": "Oct-Mar"},
            {"name": f"{dest_name} Temple", "desc": "The most iconic spiritual site.", "tags": ["Temple", "Spiritual"], "lat": 20.61, "lng": 78.98, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "Museum & Art Gallery", "desc": "A curated collection of local art and history.", "tags": ["Museum", "Culture"], "lat": 20.595, "lng": 78.965, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "City Park & Gardens", "desc": "A peaceful green escape.", "tags": ["Nature", "Relaxation"], "lat": 20.585, "lng": 78.955, "duration": "1 hr", "img": "", "bestMonths": "Oct-Mar"},
        ],
        "restaurants": [
            {"name": "Local Thali House", "desc": "Authentic regional thali.", "cuisine": "Regional", "priceRange": "₹200-400", "rating": 4.5, "mustTry": "Traditional thali", "lat": 20.595, "lng": 78.965, "tags": ["Local"], "id": "r1", "img": ""},
            {"name": "Street Food Corner", "desc": "Popular chaat and snacks.", "cuisine": "Street Food", "priceRange": "₹50-150", "rating": 4.3, "mustTry": "Local chaat", "lat": 20.59, "lng": 78.96, "tags": ["Street Food"], "id": "r2", "img": ""},
            {"name": "Rooftop Café", "desc": "Great views with coffee.", "cuisine": "Café", "priceRange": "₹300-600", "rating": 4.4, "mustTry": "Filter coffee", "lat": 20.60, "lng": 78.97, "tags": ["Café"], "id": "r3", "img": ""},
            {"name": "Heritage Restaurant", "desc": "Fine dining in a heritage building.", "cuisine": "Indian", "priceRange": "₹500-1200", "rating": 4.6, "mustTry": "Biryani", "lat": 20.605, "lng": 78.975, "tags": ["Fine Dining"], "id": "r4", "img": ""},
        ],
        "hotels": [
            {"name": "Budget Hostel", "desc": "Clean and wallet-friendly.", "type": "Hostel", "priceRange": "₹500-800/night", "rating": 4.2, "amenities": ["WiFi", "AC"], "lat": 20.59, "lng": 78.96, "id": "h1", "img": ""},
            {"name": "Comfort Inn", "desc": "Reliable mid-range option.", "type": "Hotel", "priceRange": "₹1500-3000/night", "rating": 4.4, "amenities": ["WiFi", "AC", "Restaurant"], "lat": 20.595, "lng": 78.965, "id": "h2", "img": ""},
            {"name": "Heritage Resort", "desc": "Premium heritage property.", "type": "Resort", "priceRange": "₹5000-12000/night", "rating": 4.7, "amenities": ["WiFi", "AC", "Pool", "Spa"], "lat": 20.60, "lng": 78.97, "id": "h3", "img": ""},
        ],
    }
