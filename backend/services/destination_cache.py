# ─── Multi-Layer Destination Data Cache ─────────────────────────────────────────
# Layer 1: In-memory LRU (instant, ~0ms)
# Layer 2: File cache — backend/cache/destinations/<key>.json (~5ms)
# Layer 3: CSV/bulk-loaded data — backend/data/destinations/ (~10ms)
# Layer 4: Gemini API (last resort, 5-15s, rate-limited)
#
# Write-through: Gemini results are stored in ALL layers so subsequent
# requests for the same destination never touch the API again.

import os
import re
import csv
import json
import time
import asyncio
import threading
from pathlib import Path
from typing import Optional, Dict, Any
from collections import OrderedDict
from services.itinerary_engine import fetch_destination_data_with_gemini

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BASE_DIR / "cache" / "destinations"
DATA_DIR = BASE_DIR / "data"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── In-Memory LRU Cache (Layer 1) ───────────────────────────────────────────
MAX_MEMORY_ENTRIES = 200
CACHE_TTL_SECONDS = 24 * 60 * 60  # 24 hours

_memory_cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
# Each entry: {"data": {...}, "ts": unix_timestamp}

# ── CSV-loaded data store (Layer 3) ──────────────────────────────────────────
_csv_data: Dict[str, Dict[str, Any]] = {}
_csv_loaded = False

_cache_lock = threading.Lock()
_file_lock = threading.Lock()


def _normalize_key(dest_name: str) -> str:
    """Normalize destination name to a filesystem-safe cache key."""
    return re.sub(r'[^a-z0-9]+', '_', dest_name.strip().lower()).strip('_')


# ────────────────────────────────────────────────────────────────────────────
# Layer 1: In-Memory LRU
# ────────────────────────────────────────────────────────────────────────────

def _mem_get(key: str) -> Optional[Dict[str, Any]]:
    with _cache_lock:
        entry = _memory_cache.get(key)
        if not entry:
            return None
        # Check TTL
        if time.monotonic() - entry["ts"] > CACHE_TTL_SECONDS:
            _memory_cache.pop(key, None)
            return None
        # Move to end (most recently used)
        _memory_cache.move_to_end(key)
        return entry["data"]


def _mem_set(key: str, data: Dict[str, Any]):
    with _cache_lock:
        _memory_cache[key] = {"data": data, "ts": time.monotonic()}
        _memory_cache.move_to_end(key)
        # Evict oldest if over limit
        while len(_memory_cache) > MAX_MEMORY_ENTRIES:
            _memory_cache.popitem(last=False)


# ────────────────────────────────────────────────────────────────────────────
# Layer 2: File Cache
# ────────────────────────────────────────────────────────────────────────────

def _file_get_sync(key: str) -> Optional[Dict[str, Any]]:
    path = CACHE_DIR / f"{key}.json"
    if not path.exists():
        return None
    try:
        with _file_lock:
            stat = path.stat()
            age = time.time() - stat.st_mtime
            if age > CACHE_TTL_SECONDS:
                return None  # Expired
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[Cache] File read error for {key}: {e}")
        return None

async def _file_get(key: str) -> Optional[Dict[str, Any]]:
    return await asyncio.to_thread(_file_get_sync, key)

def _file_set_sync(key: str, data: Dict[str, Any]):
    path = CACHE_DIR / f"{key}.json"
    try:
        with _file_lock:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Cache] File write error for {key}: {e}")

async def _file_set(key: str, data: Dict[str, Any]):
    await asyncio.to_thread(_file_set_sync, key, data)


# ────────────────────────────────────────────────────────────────────────────
# Layer 3: CSV / Bulk Data
# ────────────────────────────────────────────────────────────────────────────

def _load_csv_sync():
    """
    Load destination data from CSV and/or JSON files in backend/data/.
    
    Supported formats:
    1. destinations.csv — columns: name, description, lat, lng, avg_cost, crowd_level, ...
    2. Individual JSON files: data/<dest_name>.json — full destination data
    3. Any .csv file in data/ with a 'name' column
    """
    global _csv_data, _csv_loaded
    loaded_count = 0

    # ── Load individual JSON files ──
    for json_file in DATA_DIR.glob("*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("highlights"):
                key = _normalize_key(json_file.stem)
                _csv_data[key] = data
                loaded_count += 1
        except Exception as e:
            print(f"[Cache] Failed to load {json_file.name}: {e}")

    # ── Load CSV files ──
    for csv_file in DATA_DIR.glob("*.csv"):
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get("name") or row.get("destination") or row.get("dest_name") or ""
                    if not name:
                        continue
                    key = _normalize_key(name)
                    
                    # Build destination data from CSV columns
                    dest_data = _csv_row_to_dest_data(row, name)
                    _csv_data[key] = dest_data
                    loaded_count += 1
        except Exception as e:
            print(f"[Cache] Failed to load CSV {csv_file.name}: {e}")

    with _cache_lock:
        _csv_loaded = True
    if loaded_count > 0:
        print(f"[Cache] Loaded {loaded_count} destinations from data/ directory")
    return loaded_count

async def load_csv_destinations():
    return await asyncio.to_thread(_load_csv_sync)


def _csv_row_to_dest_data(row: dict, name: str) -> dict:
    """Convert a CSV row to the destination data format expected by the engine."""
    lat = float(row.get("lat") or row.get("latitude") or 20.5937)
    lng = float(row.get("lng") or row.get("longitude") or row.get("lon") or 78.9629)

    # Build highlights from CSV columns if available
    highlights = []
    # Check for highlights_json column (full JSON array)
    if row.get("highlights_json"):
        try:
            highlights = json.loads(row["highlights_json"])
        except Exception:
            pass
    
    # Check for numbered highlight columns: highlight_1, highlight_2, ...
    if not highlights:
        for i in range(1, 20):
            h_name = row.get(f"highlight_{i}") or row.get(f"highlight_{i}_name")
            if not h_name:
                break
            highlights.append({
                "name": h_name,
                "desc": row.get(f"highlight_{i}_desc", f"A must-visit attraction in {name}."),
                "tags": (row.get(f"highlight_{i}_tags") or "Heritage,Culture").split(","),
                "lat": float(row.get(f"highlight_{i}_lat") or lat + (i * 0.005)),
                "lng": float(row.get(f"highlight_{i}_lng") or lng + (i * 0.003)),
                "duration": row.get(f"highlight_{i}_duration", "1-2 hrs"),
                "img": row.get(f"highlight_{i}_img", ""),
                "bestMonths": row.get(f"highlight_{i}_best_months", "Oct-Mar"),
            })

    # Similarly for restaurants
    restaurants = []
    if row.get("restaurants_json"):
        try:
            restaurants = json.loads(row["restaurants_json"])
        except Exception:
            pass

    if not restaurants:
        for i in range(1, 10):
            r_name = row.get(f"restaurant_{i}") or row.get(f"restaurant_{i}_name")
            if not r_name:
                break
            restaurants.append({
                "name": r_name,
                "desc": row.get(f"restaurant_{i}_desc", f"Popular restaurant in {name}."),
                "cuisine": row.get(f"restaurant_{i}_cuisine", "Indian"),
                "priceRange": row.get(f"restaurant_{i}_price", "₹300-600"),
                "rating": float(row.get(f"restaurant_{i}_rating") or 4.3),
                "mustTry": row.get(f"restaurant_{i}_must_try", "Local special"),
                "lat": float(row.get(f"restaurant_{i}_lat") or lat + 0.002),
                "lng": float(row.get(f"restaurant_{i}_lng") or lng + 0.002),
                "tags": (row.get(f"restaurant_{i}_tags") or "Local").split(","),
                "id": f"r{i}",
                "img": "",
            })

    # Hotels
    hotels = []
    if row.get("hotels_json"):
        try:
            hotels = json.loads(row["hotels_json"])
        except Exception:
            pass

    if not hotels:
        for i in range(1, 8):
            h_name = row.get(f"hotel_{i}") or row.get(f"hotel_{i}_name")
            if not h_name:
                break
            hotels.append({
                "name": h_name,
                "desc": row.get(f"hotel_{i}_desc", f"Comfortable stay in {name}."),
                "type": row.get(f"hotel_{i}_type", "Hotel"),
                "priceRange": row.get(f"hotel_{i}_price", "₹1500-3000/night"),
                "rating": float(row.get(f"hotel_{i}_rating") or 4.3),
                "amenities": (row.get(f"hotel_{i}_amenities") or "WiFi,AC").split(","),
                "lat": float(row.get(f"hotel_{i}_lat") or lat + 0.003),
                "lng": float(row.get(f"hotel_{i}_lng") or lng + 0.003),
                "id": f"h{i}",
                "img": "",
            })

    return {
        "description": row.get("description", f"{name} is a vibrant destination in India."),
        "avgCost": row.get("avg_cost") or row.get("avgCost") or "₹2,000 – ₹8,000 per day",
        "crowdLevel": row.get("crowd_level") or row.get("crowdLevel") or "Medium",
        "crowdNote": row.get("crowd_note") or row.get("crowdNote") or "Check local advisories",
        "logistics": {
            "flights": row.get("flights") or row.get("airport") or "Check airline websites",
            "trains": row.get("trains") or row.get("station") or "Check IRCTC",
        },
        "weather": {},
        "mapCenter": {"lat": lat, "lng": lng},
        "highlights": highlights,
        "restaurants": restaurants,
        "hotels": hotels,
    }


async def _csv_get(key: str) -> Optional[Dict[str, Any]]:
    with _cache_lock:
        loaded = _csv_loaded
    if not loaded:
        await load_csv_destinations()
    with _cache_lock:
        return _csv_data.get(key)


# ────────────────────────────────────────────────────────────────────────────
# Public API
# ────────────────────────────────────────────────────────────────────────────

async def get_destination_data(
    dest_name: str,
    purpose: str = "cultural",
    budget: int = 15000,
    days: int = 3,
) -> Optional[Dict[str, Any]]:
    """
    Get destination data from the fastest available source.
    Layer 1 (memory) → Layer 2 (file) → Layer 3 (CSV) → Layer 4 (Gemini API).
    Results are written through to all layers for future requests.
    """
    key = _normalize_key(dest_name)

    # Layer 1: In-memory
    data = _mem_get(key)
    if data:
        print(f"[Cache] HIT memory — {dest_name}")
        return data

    # Layer 2: File cache
    data = await _file_get(key)
    if data:
        print(f"[Cache] HIT file — {dest_name}")
        _mem_set(key, data)
        return data

    # Layer 3: CSV / bulk data
    data = await _csv_get(key)
    if data:
        print(f"[Cache] HIT csv/bulk — {dest_name}")
        _mem_set(key, data)
        await _file_set(key, data)  # Promote to file cache for faster access
        return data

    # Layer 4: Gemini API (last resort)
    print(f"[Cache] MISS — fetching {dest_name} from Gemini API...")
    data = await fetch_destination_data_with_gemini(dest_name, purpose, budget, days)
    if data:
        # Write-through to all layers
        _mem_set(key, data)
        await _file_set(key, data)
        print(f"[Cache] Stored {dest_name} in all cache layers")
        return data

    print(f"[Cache] Gemini also failed for {dest_name}, no data available")
    return None


def get_cache_stats() -> dict:
    """Return cache statistics for monitoring."""
    file_count = len(list(CACHE_DIR.glob("*.json")))
    return {
        "memory_entries": len(_memory_cache),
        "memory_max": MAX_MEMORY_ENTRIES,
        "file_cache_entries": file_count,
        "csv_loaded_entries": len(_csv_data),
        "csv_loaded": _csv_loaded,
        "ttl_hours": CACHE_TTL_SECONDS / 3600,
        "cache_dir": str(CACHE_DIR),
        "data_dir": str(DATA_DIR),
    }


def clear_cache(dest_name: Optional[str] = None):
    """Clear cache for a specific destination or all destinations."""
    if dest_name:
        key = _normalize_key(dest_name)
        with _cache_lock:
            _memory_cache.pop(key, None)
        path = CACHE_DIR / f"{key}.json"
        if path.exists():
            path.unlink()
        return {"cleared": key}
    else:
        with _cache_lock:
            _memory_cache.clear()
        for f in CACHE_DIR.glob("*.json"):
            try:
                f.unlink()
            except Exception:
                pass
        return {"cleared": "all"}


def import_json_file_sync(dest_name: str, data: Dict[str, Any]) -> bool:
    """Import a single destination's data directly (for admin/bulk endpoints)."""
    key = _normalize_key(dest_name)
    _mem_set(key, data)
    _file_set_sync(key, data)
    return True

async def import_json_file(dest_name: str, data: Dict[str, Any]) -> bool:
    return await asyncio.to_thread(import_json_file_sync, dest_name, data)
