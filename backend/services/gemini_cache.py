# ─── Universal Gemini Response Cache ────────────────────────────────────────────
# A generic caching layer that any engine can use to avoid redundant Gemini calls.
# Supports per-key TTL, in-memory LRU, and persistent file storage.
#
# Usage:
#   from services.gemini_cache import cached_gemini_call
#
#   result = await cached_gemini_call(
#       cache_namespace="deep_dive",
#       cache_key="jaipur_solo_cultural",
#       generator=lambda: _call_gemini(...),
#       ttl_hours=24,
#   )

import os
import json
import time
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any, Callable, Awaitable
from collections import OrderedDict

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_ROOT = BASE_DIR / "cache"
CACHE_ROOT.mkdir(parents=True, exist_ok=True)

# ── In-Memory LRU (shared across all namespaces) ────────────────────────────
MAX_MEMORY_ENTRIES = 500
_memory: OrderedDict[str, Dict[str, Any]] = OrderedDict()
# Each entry: {"data": ..., "ts": unix_timestamp, "ttl": seconds}

# ── Stats ────────────────────────────────────────────────────────────────────
_stats = {"hits_memory": 0, "hits_file": 0, "misses": 0, "errors": 0}


def _full_key(namespace: str, key: str) -> str:
    """Create a unique key combining namespace and key."""
    return f"{namespace}::{key}"


def _safe_filename(namespace: str, key: str) -> Path:
    """Create a filesystem-safe path for the cache entry."""
    ns_dir = CACHE_ROOT / namespace
    ns_dir.mkdir(parents=True, exist_ok=True)
    # Hash long keys to avoid filesystem issues
    if len(key) > 80:
        key = hashlib.md5(key.encode()).hexdigest()
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in key)
    return ns_dir / f"{safe}.json"


# ── Memory Layer ─────────────────────────────────────────────────────────────

def _mem_get(full_key: str) -> Optional[Any]:
    entry = _memory.get(full_key)
    if not entry:
        return None
    if time.time() - entry["ts"] > entry["ttl"]:
        _memory.pop(full_key, None)
        return None
    _memory.move_to_end(full_key)
    return entry["data"]


def _mem_set(full_key: str, data: Any, ttl_seconds: float):
    _memory[full_key] = {"data": data, "ts": time.time(), "ttl": ttl_seconds}
    _memory.move_to_end(full_key)
    while len(_memory) > MAX_MEMORY_ENTRIES:
        _memory.popitem(last=False)


# ── File Layer ───────────────────────────────────────────────────────────────

def _file_get(path: Path, ttl_seconds: float) -> Optional[Any]:
    if not path.exists():
        return None
    try:
        age = time.time() - path.stat().st_mtime
        if age > ttl_seconds:
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _file_set(path: Path, data: Any):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[GeminiCache] File write error: {e}")


# ── Public API ───────────────────────────────────────────────────────────────

async def cached_gemini_call(
    cache_namespace: str,
    cache_key: str,
    generator: Callable[[], Awaitable[Any]],
    ttl_hours: float = 24,
) -> Optional[Any]:
    """
    Execute a Gemini call with multi-layer caching.
    
    Args:
        cache_namespace: Category (e.g., "deep_dive", "recommendations", "events")
        cache_key: Unique key within the namespace (e.g., "jaipur_solo_cultural")
        generator: Async function that makes the actual Gemini API call
        ttl_hours: Cache TTL in hours (default 24h)
    
    Returns:
        The cached or freshly generated result, or None if generation fails.
    """
    fk = _full_key(cache_namespace, cache_key)
    ttl_s = ttl_hours * 3600

    # Layer 1: Memory
    data = _mem_get(fk)
    if data is not None:
        _stats["hits_memory"] += 1
        print(f"[GeminiCache] HIT memory — {cache_namespace}/{cache_key}")
        return data

    # Layer 2: File
    file_path = _safe_filename(cache_namespace, cache_key)
    data = _file_get(file_path, ttl_s)
    if data is not None:
        _stats["hits_file"] += 1
        _mem_set(fk, data, ttl_s)
        print(f"[GeminiCache] HIT file — {cache_namespace}/{cache_key}")
        return data

    # Layer 3: Generate (call Gemini)
    _stats["misses"] += 1
    print(f"[GeminiCache] MISS — generating {cache_namespace}/{cache_key}...")
    try:
        data = await generator()
        if data is not None:
            _mem_set(fk, data, ttl_s)
            _file_set(file_path, data)
            print(f"[GeminiCache] Stored {cache_namespace}/{cache_key}")
            return data
    except Exception as e:
        _stats["errors"] += 1
        print(f"[GeminiCache] Generator failed for {cache_namespace}/{cache_key}: {e}")

    return None


def get_cache_stats() -> dict:
    """Return global cache statistics."""
    total_files = sum(1 for _ in CACHE_ROOT.rglob("*.json"))
    namespaces = {}
    for ns_dir in CACHE_ROOT.iterdir():
        if ns_dir.is_dir():
            namespaces[ns_dir.name] = len(list(ns_dir.glob("*.json")))
    
    return {
        "memory_entries": len(_memory),
        "memory_max": MAX_MEMORY_ENTRIES,
        "file_entries": total_files,
        "namespaces": namespaces,
        **_stats,
        "hit_rate": (
            f"{(_stats['hits_memory'] + _stats['hits_file']) / max(1, sum(_stats.values())) * 100:.1f}%"
        ),
    }


def clear_namespace(namespace: str):
    """Clear all cache entries for a namespace."""
    # Memory
    keys_to_remove = [k for k in _memory if k.startswith(f"{namespace}::")]
    for k in keys_to_remove:
        _memory.pop(k, None)
    # Files
    ns_dir = CACHE_ROOT / namespace
    if ns_dir.exists():
        for f in ns_dir.glob("*.json"):
            f.unlink()
    return {"cleared": namespace, "entries_removed": len(keys_to_remove)}


def clear_all():
    """Clear the entire cache."""
    _memory.clear()
    for f in CACHE_ROOT.rglob("*.json"):
        f.unlink()
    return {"cleared": "all"}
