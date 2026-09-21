# ─── Multi-Layer Destination Data Cache ─────────────────────────────────────────
# Layer 1: In-memory LRU (instant, ~0ms)
# Layer 2: File cache — backend/cache/destinations/<key>.json (~5ms)
# Layer 3: CSV/bulk-loaded data — backend/data/destinations/ (~10ms)
# Layer 4: Geoapify Candidate Builder (real-world POIs, 0 LLM cost)
# Layer 5: Gemini API (dormant fallback only if Geoapify fails or is unconfigured)
#
# Write-through: Candidate data is stored in ALL layers so subsequent
# requests for the same destination never touch external APIs again.

import os
import re
import csv
import json
import time
import asyncio
import threading
from pathlib import Path
from typing import Optional, Dict, Any, List
from collections import OrderedDict
from services.itinerary_engine import fetch_destination_data_with_gemini, DEST_DATA_VERSION, get_pool_requirements
from services.geoapify_service import build_destination_candidate_pool, is_geoapify_configured

ENABLE_GEMINI_DESTINATION_FALLBACK = (
    os.getenv("ENABLE_GEMINI_DESTINATION_FALLBACK", "false").lower() == "true"
)

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BASE_DIR / "cache" / "destinations"
DATA_DIR = BASE_DIR / "data"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── In-Memory LRU Cache (Layer 1) ───────────────────────────────────────────
MAX_MEMORY_ENTRIES = 200
CACHE_TTL_SECONDS = 60 * 24 * 60 * 60  # 60 days decoupled POI cache (weather is cached separately)

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
    raw_lat = row.get("lat") or row.get("latitude")
    raw_lng = row.get("lng") or row.get("longitude") or row.get("lon")
    lat = float(raw_lat) if raw_lat is not None else None
    lng = float(raw_lng) if raw_lng is not None else None

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
            h_lat_val = row.get(f"highlight_{i}_lat")
            h_lng_val = row.get(f"highlight_{i}_lng")
            h_lat = float(h_lat_val) if h_lat_val else None
            h_lng = float(h_lng_val) if h_lng_val else None
            tags_val = row.get(f"highlight_{i}_tags")
            tags = tags_val.split(",") if tags_val else []
            highlights.append({
                "name": h_name,
                "desc": row.get(f"highlight_{i}_desc") or None,
                "tags": tags,
                "lat": h_lat,
                "lng": h_lng,
                "duration": row.get(f"highlight_{i}_duration") or None,
                "img": row.get(f"highlight_{i}_img", ""),
                "bestMonths": row.get(f"highlight_{i}_best_months") or None,
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
            r_lat_val = row.get(f"restaurant_{i}_lat")
            r_lng_val = row.get(f"restaurant_{i}_lng")
            r_lat = float(r_lat_val) if r_lat_val else None
            r_lng = float(r_lng_val) if r_lng_val else None
            tags_val = row.get(f"restaurant_{i}_tags")
            tags = tags_val.split(",") if tags_val else []
            restaurants.append({
                "name": r_name,
                "desc": row.get(f"restaurant_{i}_desc") or None,
                "cuisine": row.get(f"restaurant_{i}_cuisine") or None,
                "priceRange": row.get(f"restaurant_{i}_price") or None,
                "rating": float(row.get(f"restaurant_{i}_rating")) if row.get(f"restaurant_{i}_rating") else None,
                "mustTry": row.get(f"restaurant_{i}_must_try") or None,
                "lat": r_lat,
                "lng": r_lng,
                "tags": tags,
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
            h_lat_val = row.get(f"hotel_{i}_lat")
            h_lng_val = row.get(f"hotel_{i}_lng")
            h_lat = float(h_lat_val) if h_lat_val else None
            h_lng = float(h_lng_val) if h_lng_val else None
            amenities_val = row.get(f"hotel_{i}_amenities")
            amenities = amenities_val.split(",") if amenities_val else []
            hotels.append({
                "name": h_name,
                "desc": row.get(f"hotel_{i}_desc") or None,
                "type": row.get(f"hotel_{i}_type") or None,
                "priceRange": row.get(f"hotel_{i}_price") or None,
                "rating": float(row.get(f"hotel_{i}_rating")) if row.get(f"hotel_{i}_rating") else None,
                "amenities": amenities,
                "lat": h_lat,
                "lng": h_lng,
                "id": f"h{i}",
                "img": "",
            })

    return {
        "description": row.get("description") or None,
        "avgCost": row.get("avg_cost") or row.get("avgCost") or None,
        "crowdLevel": row.get("crowd_level") or row.get("crowdLevel") or None,
        "crowdNote": row.get("crowd_note") or row.get("crowdNote") or None,
        "logistics": {
            "flights": row.get("flights") or row.get("airport") or None,
            "trains": row.get("trains") or row.get("station") or None,
        },
        "weather": {},
        "mapCenter": {"lat": lat, "lng": lng} if (lat is not None and lng is not None) else None,
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

def _merge_destination_data(existing: Optional[Dict[str, Any]], fresh: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge fresh destination data into existing data to expand candidate pools without duplicates."""
    if not existing:
        return fresh or {}
    if not fresh:
        return existing

    merged = dict(existing)
    # Overwrite top-level metadata with fresh
    for k in ["description", "avgCost", "crowdLevel", "crowdNote", "logistics", "weather", "mapCenter", "_v"]:
        if k in fresh and fresh[k]:
            merged[k] = fresh[k]

    # Merge highlights deduplicating by normalized name
    hl_map = {re.sub(r'[^a-z0-9]+', '', h.get('name', '').lower()): h for h in existing.get("highlights", []) if isinstance(h, dict) and h.get("name")}
    for h in fresh.get("highlights", []):
        if isinstance(h, dict) and h.get("name"):
            norm_name = re.sub(r'[^a-z0-9]+', '', h["name"].lower())
            if norm_name not in hl_map:
                hl_map[norm_name] = h
            else:
                # Enrich existing highlight if fresh has more detailed fields
                hl_map[norm_name].update({k: v for k, v in h.items() if v is not None and (k not in hl_map[norm_name] or not hl_map[norm_name][k])})
    merged["highlights"] = list(hl_map.values())

    # Merge restaurants deduplicating by normalized name
    rest_map = {re.sub(r'[^a-z0-9]+', '', r.get('name', '').lower()): r for r in existing.get("restaurants", []) if isinstance(r, dict) and r.get("name")}
    for r in fresh.get("restaurants", []):
        if isinstance(r, dict) and r.get("name"):
            norm_name = re.sub(r'[^a-z0-9]+', '', r["name"].lower())
            if norm_name not in rest_map:
                rest_map[norm_name] = r
            else:
                rest_map[norm_name].update({k: v for k, v in r.items() if v is not None and (k not in rest_map[norm_name] or not rest_map[norm_name][k])})
    merged["restaurants"] = list(rest_map.values())

    # Merge hotels deduplicating by normalized name
    hotel_map = {re.sub(r'[^a-z0-9]+', '', h.get('name', '').lower()): h for h in existing.get("hotels", []) if isinstance(h, dict) and h.get("name")}
    for h in fresh.get("hotels", []):
        if isinstance(h, dict) and h.get("name"):
            norm_name = re.sub(r'[^a-z0-9]+', '', h["name"].lower())
            if norm_name not in hotel_map:
                hotel_map[norm_name] = h
            else:
                hotel_map[norm_name].update({k: v for k, v in h.items() if v is not None and (k not in hotel_map[norm_name] or not hotel_map[norm_name][k])})
    merged["hotels"] = list(hotel_map.values())

    merged["_v"] = max(existing.get("_v", 0), fresh.get("_v", DEST_DATA_VERSION))
    return merged


def _is_stale_or_undersized(data: Optional[Dict[str, Any]], days: int = 3) -> bool:
    """Check if cached data is from an older schema version or has insufficient items for trip duration."""
    if not data or not isinstance(data, dict):
        return True
    if data.get("_v", 0) < DEST_DATA_VERSION:
        return True
    reqs = get_pool_requirements(days)
    curr_hl = len(data.get("highlights", []))
    curr_rest = len(data.get("restaurants", []))
    return curr_hl < reqs["highlights"] or curr_rest < reqs["restaurants"]


async def _background_refetch(key: str, dest_name: str, purpose: str, budget: int, days: int, existing_data: Optional[Dict[str, Any]] = None):
    """Re-fetch destination data in background (Geoapify -> Gemini fallback), merge with existing, and update all cache layers."""
    try:
        print(f"[Cache] Background pool enrichment for {dest_name} (days={days})...")
        fresh_data = None
        if is_geoapify_configured():
            try:
                fresh_data = await build_destination_candidate_pool(dest_name, days, purpose, budget)
            except Exception as ge:
                print(f"[Cache] Background Geoapify enrichment failed for {dest_name}: {ge}")

        if not fresh_data and ENABLE_GEMINI_DESTINATION_FALLBACK:
            fresh_data = await fetch_destination_data_with_gemini(dest_name, purpose, budget, days)

        if fresh_data:
            merged = _merge_destination_data(existing_data, fresh_data)
            _mem_set(key, merged)
            await _file_set(key, merged)
            print(f"[Cache] Background enrichment complete for {dest_name} — highlights: {len(merged.get('highlights', []))}, restaurants: {len(merged.get('restaurants', []))}")
    except Exception as e:
        print(f"[Cache] Background re-fetch failed for {dest_name}: {str(e)[:120]}")


async def get_destination_data(
    dest_name: str,
    purpose: str = "cultural",
    budget: int = 15000,
    days: int = 3,
) -> Optional[Dict[str, Any]]:
    """
    Get destination data from the fastest available source.
    Layer 1 (memory) → Layer 2 (file) → Layer 3 (CSV) → Layer 4 (Geoapify) → Layer 5 (Gemini API fallback).
    Results are written through to all layers for future requests.

    Version- & Pool-aware: if cached data is stale or undersized for the requested trip
    duration, it is enriched so multi-day itineraries never suffer from starvation.
    """
    key = _normalize_key(dest_name)
    reqs = get_pool_requirements(days)
    crit_hl = max(10, days * 3)
    crit_rest = max(4, days * 2)

    # Layer 1: In-memory
    data = _mem_get(key)
    if data:
        hl_count = len(data.get("highlights", []))
        rest_count = len(data.get("restaurants", []))
        if hl_count >= crit_hl and rest_count >= crit_rest:
            print(f"[Cache] HIT memory — {dest_name} ({hl_count} hl, {rest_count} rest)")
            if _is_stale_or_undersized(data, days):
                asyncio.create_task(_background_refetch(key, dest_name, purpose, budget, days, data))
            return data
        else:
            print(f"[Cache] Memory hit for {dest_name} is critically undersized ({hl_count}/{crit_hl} hl) for {days} days — triggering sync fetch")

    # Layer 2: File cache
    if not data or len(data.get("highlights", [])) < crit_hl:
        file_data = await _file_get(key)
        if file_data:
            data = _merge_destination_data(data, file_data)
            _mem_set(key, data)
            hl_count = len(data.get("highlights", []))
            rest_count = len(data.get("restaurants", []))
            if hl_count >= crit_hl and rest_count >= crit_rest:
                print(f"[Cache] HIT file — {dest_name} ({hl_count} hl, {rest_count} rest)")
                if _is_stale_or_undersized(data, days):
                    asyncio.create_task(_background_refetch(key, dest_name, purpose, budget, days, data))
                return data
            else:
                print(f"[Cache] File hit for {dest_name} is critically undersized ({hl_count}/{crit_hl} hl) for {days} days")

    # Layer 3: CSV / bulk data
    if not data or len(data.get("highlights", [])) < crit_hl:
        csv_data = await _csv_get(key)
        if csv_data:
            data = _merge_destination_data(data, csv_data)
            _mem_set(key, data)
            await _file_set(key, data)
            hl_count = len(data.get("highlights", []))
            rest_count = len(data.get("restaurants", []))
            if hl_count >= crit_hl and rest_count >= crit_rest:
                print(f"[Cache] HIT csv/bulk — {dest_name} ({hl_count} hl, {rest_count} rest)")
                if _is_stale_or_undersized(data, days):
                    asyncio.create_task(_background_refetch(key, dest_name, purpose, budget, days, data))
                return data

    # Layer 4: Geoapify Candidate Pool Builder (0 LLM cost)
    if is_geoapify_configured():
        print(f"[Cache] Fetching {dest_name} (days={days}) from Geoapify candidate builder...")
        try:
            geo_data = await build_destination_candidate_pool(dest_name, days, purpose, budget)
            if geo_data:
                merged = _merge_destination_data(data, geo_data)
                _mem_set(key, merged)
                await _file_set(key, merged)
                print(f"[Cache] Stored {dest_name} from Geoapify in all cache layers (v{DEST_DATA_VERSION}, {len(merged.get('highlights', []))} hl, {len(merged.get('restaurants', []))} rest)")
                return merged
        except Exception as ge:
            print(f"[Cache] Geoapify candidate builder error for {dest_name}: {ge}")

    # Layer 5: Gemini API (dormant fallback)
    if ENABLE_GEMINI_DESTINATION_FALLBACK:
        print(f"[Cache] Fetching {dest_name} (days={days}) from Gemini API fallback...")
        fresh_data = await fetch_destination_data_with_gemini(dest_name, purpose, budget, days)
        if fresh_data:
            if "dataSources" not in fresh_data:
                fresh_data["dataSources"] = {}
            fresh_data["dataSources"]["source"] = "gemini"
            fresh_data["dataSources"]["llmUsed"] = True
            
            merged = _merge_destination_data(data, fresh_data)
            _mem_set(key, merged)
            await _file_set(key, merged)
            print(f"[Cache] Stored {dest_name} from Gemini fallback in all cache layers (v{DEST_DATA_VERSION}, {len(merged.get('highlights', []))} hl, {len(merged.get('restaurants', []))} rest)")
            return merged

    if data:
        print(f"[Cache] Fresh fetch failed, returning available {len(data.get('highlights', []))} highlights for {dest_name}")
        return data

    print(f"[Cache] All candidate data sources failed for {dest_name} and no cached data available")
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
