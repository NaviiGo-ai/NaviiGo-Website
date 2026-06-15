# ─── Universal Gemini Response Cache (with Redis) ───────────────────────────────
# A multi-tier caching layer that any engine can use to avoid redundant Gemini calls.
#
# Cache Tiers:
#   1. In-memory LRU (fastest, per-process)
#   2. Redis (shared across processes/workers, survives restarts)
#   3. Filesystem (persistent fallback if Redis is unavailable)
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

# ── Redis Setup ──────────────────────────────────────────────────────────────
_redis_client = None
_redis_available = False

def _init_redis():
    """Try to connect to Redis. Gracefully degrade if unavailable."""
    global _redis_client, _redis_available
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        import redis
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=True,
        )
        _redis_client.ping()
        _redis_available = True
        print(f"[GeminiCache] ✅ Redis connected: {redis_url}")
    except Exception as e:
        _redis_available = False
        _redis_client = None
        print(f"[GeminiCache] ⚠ Redis unavailable ({e}), falling back to file cache")

# Initialize Redis on module load
_init_redis()

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_ROOT = BASE_DIR / "cache"
CACHE_ROOT.mkdir(parents=True, exist_ok=True)

# ── In-Memory LRU (shared across all namespaces) ────────────────────────────
MAX_MEMORY_ENTRIES = 500
_memory: OrderedDict[str, Dict[str, Any]] = OrderedDict()
# Each entry: {"data": ..., "ts": unix_timestamp, "ttl": seconds}

# ── Stats ────────────────────────────────────────────────────────────────────
_stats = {"hits_memory": 0, "hits_redis": 0, "hits_file": 0, "misses": 0, "errors": 0}

REDIS_KEY_PREFIX = "naviigo:cache:"


def _full_key(namespace: str, key: str) -> str:
    """Create a unique key combining namespace and key."""
    return f"{namespace}::{key}"


def _redis_key(namespace: str, key: str) -> str:
    """Create a Redis-specific key with prefix."""
    return f"{REDIS_KEY_PREFIX}{namespace}:{key}"


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


# ── Redis Layer ──────────────────────────────────────────────────────────────

def _redis_get(namespace: str, key: str) -> Optional[Any]:
    """Get a value from Redis. Returns None if Redis is unavailable or key doesn't exist."""
    if not _redis_available or not _redis_client:
        return None
    try:
        rkey = _redis_key(namespace, key)
        raw = _redis_client.get(rkey)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        print(f"[GeminiCache] Redis GET error: {e}")
        return None


def _redis_set(namespace: str, key: str, data: Any, ttl_seconds: float):
    """Store a value in Redis with TTL. Silently fails if Redis is unavailable."""
    if not _redis_available or not _redis_client:
        return
    try:
        rkey = _redis_key(namespace, key)
        raw = json.dumps(data, ensure_ascii=False)
        _redis_client.setex(rkey, int(ttl_seconds), raw)
    except Exception as e:
        print(f"[GeminiCache] Redis SET error: {e}")


def _redis_delete_pattern(pattern: str):
    """Delete all keys matching a pattern. Uses SCAN to avoid blocking."""
    if not _redis_available or not _redis_client:
        return 0
    try:
        count = 0
        cursor = 0
        while True:
            cursor, keys = _redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                _redis_client.delete(*keys)
                count += len(keys)
            if cursor == 0:
                break
        return count
    except Exception as e:
        print(f"[GeminiCache] Redis DELETE error: {e}")
        return 0


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
    Execute a Gemini call with multi-tier caching.
    
    Cache lookup order: Memory → Redis → File → Generate
    
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

    # Layer 1: Memory (fastest)
    data = _mem_get(fk)
    if data is not None:
        _stats["hits_memory"] += 1
        print(f"[GeminiCache] HIT memory — {cache_namespace}/{cache_key}")
        return data

    # Layer 2: Redis (shared, survives restarts)
    data = _redis_get(cache_namespace, cache_key)
    if data is not None:
        _stats["hits_redis"] += 1
        _mem_set(fk, data, ttl_s)  # Promote to memory
        print(f"[GeminiCache] HIT redis — {cache_namespace}/{cache_key}")
        return data

    # Layer 3: File (persistent fallback)
    file_path = _safe_filename(cache_namespace, cache_key)
    data = _file_get(file_path, ttl_s)
    if data is not None:
        _stats["hits_file"] += 1
        _mem_set(fk, data, ttl_s)  # Promote to memory
        _redis_set(cache_namespace, cache_key, data, ttl_s)  # Promote to Redis
        print(f"[GeminiCache] HIT file — {cache_namespace}/{cache_key}")
        return data

    # Layer 4: Generate (call Gemini)
    _stats["misses"] += 1
    print(f"[GeminiCache] MISS — generating {cache_namespace}/{cache_key}...")
    try:
        data = await generator()
        if data is not None:
            _mem_set(fk, data, ttl_s)
            _redis_set(cache_namespace, cache_key, data, ttl_s)
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
    
    redis_info = {}
    if _redis_available and _redis_client:
        try:
            redis_keys = 0
            cursor = 0
            while True:
                cursor, keys = _redis_client.scan(cursor, match=f"{REDIS_KEY_PREFIX}*", count=100)
                redis_keys += len(keys)
                if cursor == 0:
                    break
            info = _redis_client.info("memory")
            redis_info = {
                "connected": True,
                "keys": redis_keys,
                "used_memory_human": info.get("used_memory_human", "unknown"),
            }
        except Exception:
            redis_info = {"connected": False, "error": "Failed to get Redis info"}
    else:
        redis_info = {"connected": False, "reason": "Redis not configured or unavailable"}

    return {
        "memory_entries": len(_memory),
        "memory_max": MAX_MEMORY_ENTRIES,
        "redis": redis_info,
        "file_entries": total_files,
        "namespaces": namespaces,
        **_stats,
        "hit_rate": (
            f"{(_stats['hits_memory'] + _stats['hits_redis'] + _stats['hits_file']) / max(1, sum(_stats.values())) * 100:.1f}%"
        ),
    }


def clear_namespace(namespace: str):
    """Clear all cache entries for a namespace."""
    # Memory
    keys_to_remove = [k for k in _memory if k.startswith(f"{namespace}::")]
    for k in keys_to_remove:
        _memory.pop(k, None)
    # Redis
    redis_cleared = _redis_delete_pattern(f"{REDIS_KEY_PREFIX}{namespace}:*")
    # Files
    ns_dir = CACHE_ROOT / namespace
    file_cleared = 0
    if ns_dir.exists():
        for f in ns_dir.glob("*.json"):
            f.unlink()
            file_cleared += 1
    return {
        "cleared": namespace,
        "memory_removed": len(keys_to_remove),
        "redis_removed": redis_cleared,
        "files_removed": file_cleared,
    }


def clear_all():
    """Clear the entire cache."""
    _memory.clear()
    redis_cleared = _redis_delete_pattern(f"{REDIS_KEY_PREFIX}*")
    file_cleared = 0
    for f in CACHE_ROOT.rglob("*.json"):
        f.unlink()
        file_cleared += 1
    return {
        "cleared": "all",
        "redis_removed": redis_cleared,
        "files_removed": file_cleared,
    }


def is_redis_connected() -> bool:
    """Check if Redis is currently connected."""
    return _redis_available
