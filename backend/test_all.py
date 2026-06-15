"""
NaviiGo Python Backend — White Box Test Suite
Tests every endpoint for correct HTTP status and response structure.
"""
import requests
import json
import sys

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0

def test(name, method, path, expected_status=200, body=None, params=None, check_keys=None, timeout=None):
    global PASS, FAIL
    url = f"{BASE}{path}"
    t = timeout or (120 if method == "POST" else 30)
    try:
        if method == "GET":
            r = requests.get(url, params=params, timeout=t)
        else:
            r = requests.post(url, json=body, timeout=t)
        
        status_ok = r.status_code == expected_status
        data = r.json()
        
        keys_ok = True
        missing = []
        if check_keys and status_ok:
            for k in check_keys:
                if k not in data:
                    keys_ok = False
                    missing.append(k)
        
        if status_ok and keys_ok:
            PASS += 1
            print(f"  PASS: {name} -- HTTP {r.status_code}")
        else:
            FAIL += 1
            reason = f"HTTP {r.status_code} (expected {expected_status})"
            if missing:
                reason += f", missing keys: {missing}"
            print(f"  FAIL: {name} -- {reason}")
            print(f"     Response: {json.dumps(data)[:200]}")
    except Exception as e:
        FAIL += 1
        print(f"  FAIL: {name} -- Exception: {e}")


print("\n" + "="*60)
print("  NaviiGo Python Backend -- White Box Test Suite")
print("="*60)

# 1. Root Health Check
print("\n[Health Check]")
test("Root endpoint", "GET", "/", check_keys=["message", "status", "engines"])

# 2. Weather Engine (free, no key needed)
print("\n[Weather Engine]")
test("Weather -- default coords", "GET", "/api/weather/", check_keys=["current", "daily"])
test("Weather -- Jaipur coords", "GET", "/api/weather/", params={"lat": 26.91, "lng": 75.79}, check_keys=["current"])

# 3. Transport Engine (OSRM, free)
print("\n[Transport Engine]")
test("Transport -- Jaipur route", "GET", "/api/transport/", 
     params={"fromLat": 26.91, "fromLng": 75.79, "toLat": 26.92, "toLng": 75.80},
     check_keys=["distance", "options"])
test("Transport -- missing coords (expect 400)", "GET", "/api/transport/", expected_status=400)

# 4. Chat Engine
print("\n[Chat Engine]")
test("Chat -- basic message", "POST", "/api/chat/",
     body={"message": "Hello, what can you help me with?", "context": []},
     check_keys=["reply"])

# 5. Recommendations Engine
print("\n[Recommendations Engine]")
test("Recommendations -- basic", "POST", "/api/recommendations/",
     body={"budget": 15000, "month": 12, "group": "couple", "purpose": "honeymoon"},
     check_keys=["success", "recommendations"])

# 6. Explore Deep Dive
print("\n[Explore Engine]")
test("Deep Dive -- Jaipur", "POST", "/api/explore/deep-dive",
     body={"destination": "Jaipur", "companion": "Solo", "vibe": "Cultural exploration"},
     check_keys=["redditConsensus", "hiddenGems"])

# 7. Explore Events
test("Events -- Jaipur", "POST", "/api/explore/events",
     body={"destination": "Jaipur"},
     check_keys=["events"])

# 8. Taste Update
print("\n[Taste Engine]")
test("Taste Update -- new vector", "POST", "/api/taste/update",
     body={"selectedDestId": "goa", "selectedTags": ["Beaches", "Nightlife"], "purpose": "celebrate"},
     check_keys=["success", "newVector"])

# 9. Itinerary Generate (with deterministic engine)
print("\n[Itinerary Engine]")
test("Itinerary Generate", "POST", "/api/itinerary/generate",
     body={"destName": "Jaipur", "purpose": "cultural", "days": 3, "budget": 15000},
     check_keys=["success", "itinerary"])

# 10. Itinerary response structure validation
print("\n[Itinerary Structure]")
try:
    r = requests.post(f"{BASE}/api/itinerary/generate",
                       json={"destName": "Goa", "purpose": "leisure", "days": 2, "budget": 10000},
                       timeout=120)
    data = r.json()
    if data.get("success") and data.get("itinerary"):
        itin = data["itinerary"]
        required_keys = ["destName", "description", "dayPlans", "mapCenter", "highlights", "restaurants", "hotels"]
        missing = [k for k in required_keys if k not in itin]
        if not missing:
            PASS += 1
            print(f"  PASS: Itinerary has all required keys")
            
            # Verify dayPlans structure
            if itin.get("dayPlans") and len(itin["dayPlans"]) > 0:
                day1 = itin["dayPlans"][0]
                day_keys = ["day", "title", "weather", "activities"]
                day_missing = [k for k in day_keys if k not in day1]
                if not day_missing:
                    PASS += 1
                    print(f"  PASS: dayPlans[0] has correct structure ({len(day1['activities'])} activities)")
                else:
                    FAIL += 1
                    print(f"  FAIL: dayPlans[0] missing keys: {day_missing}")
            else:
                FAIL += 1
                print(f"  FAIL: dayPlans is empty or missing")
        else:
            FAIL += 1
            print(f"  FAIL: Itinerary missing keys: {missing}")
    else:
        FAIL += 1
        print(f"  FAIL: Itinerary generate returned unsuccessful response")
except Exception as e:
    FAIL += 2
    print(f"  FAIL: Itinerary structure test -- Exception: {e}")

# 11. Places Autocomplete
print("\n[Places Engine]")
test("Places Autocomplete -- Jaipur", "GET", "/api/places/autocomplete",
     params={"input": "Jaipur"},
     check_keys=["predictions"])

# Summary
print("\n" + "="*60)
total = PASS + FAIL
print(f"  Results: {PASS}/{total} passed, {FAIL} failed")
if FAIL == 0:
    print("  ALL TESTS PASSED!")
else:
    print("  Some tests failed -- review above")
print("="*60 + "\n")

sys.exit(1 if FAIL > 0 else 0)
