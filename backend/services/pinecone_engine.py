# ─── Pinecone Vector Engine ─────────────────────────────────────────────────────
# Semantic similarity search for destination matching using Pinecone.

import os
import random
from typing import List, Dict, Any
from pinecone import Pinecone

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "naviigo-vectors")

_pc = None
_index = None


def _get_index():
    global _pc, _index
    api_key = os.getenv("PINECONE_API_KEY", "")
    if not api_key:
        return None
    if _pc is None:
        _pc = Pinecone(api_key=api_key)
        _index = _pc.Index(os.getenv("PINECONE_INDEX_NAME", "naviigo-vectors"))
    return _index


async def search_destinations_by_vibe(user_taste_vector: List[float], top_k: int = 10) -> List[Dict[str, Any]]:
    """Search Pinecone for destinations matching the user's taste vector."""
    index = _get_index()
    if index is None:
        print("[Pinecone] No PINECONE_API_KEY found. Returning mock matches.")
        return _mock_vector_search(top_k)

    try:
        result = index.query(
            vector=user_taste_vector,
            top_k=top_k,
            include_metadata=True,
        )
        return [
            {"id": m["id"], "score": m.get("score", 0), "metadata": m.get("metadata", {})}
            for m in result.get("matches", [])
        ]
    except Exception as e:
        print(f"[Pinecone] Vector search failed: {e}")
        return _mock_vector_search(top_k)


async def upsert_destination_vector(dest_id: str, vector: List[float], metadata: dict = None):
    """Upload a destination's embedding to Pinecone."""
    index = _get_index()
    if index is None:
        return
    try:
        index.upsert(vectors=[{"id": dest_id, "values": vector, "metadata": metadata or {}}])
        print(f"[Pinecone] Upserted vector for: {dest_id}")
    except Exception as e:
        print(f"[Pinecone] Failed to upsert {dest_id}: {e}")


def _mock_vector_search(top_k: int) -> List[Dict[str, Any]]:
    fallback_ids = ["goa", "manali", "varanasi", "udaipur", "munnar", "jaipur"]
    return [
        {"id": fid, "score": 0.8 + random.random() * 0.15, "metadata": {"source": "mock_fallback"}}
        for fid in fallback_ids[:top_k]
    ]
