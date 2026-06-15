# ─── Embeddings Engine ──────────────────────────────────────────────────────────
# Generates vector embeddings using Gemini's text-embedding-004 model.

import asyncio
import random
import math
from typing import Optional, List
from services.gemini_client import get_client, is_configured


async def generate_embedding(text: str) -> Optional[List[float]]:
    """Generate a 768-dimensional vector embedding for the given text."""
    if not is_configured():
        print("[Embeddings] No GEMINI_API_KEY found, returning mock vector")
        return [random.random() - 0.5 for _ in range(768)]

    try:
        client = get_client()
        result = await asyncio.to_thread(
            client.models.embed_content,
            model="models/text-embedding-004",
            contents=text,
        )
        # The response shape varies between SDK versions — try multiple paths
        if hasattr(result, 'embeddings') and result.embeddings:
            emb = result.embeddings[0]
            return emb.values if hasattr(emb, 'values') else list(emb)
        elif hasattr(result, 'embedding'):
            emb = result.embedding
            return emb.values if hasattr(emb, 'values') else list(emb)
        else:
            print(f"[Embeddings] Unexpected response shape: {type(result)}")
            # Fall back to mock so the app still works
            return [random.random() - 0.5 for _ in range(768)]
    except Exception as e:
        print(f"[Embeddings] Failed to generate embedding: {e}")
        # Return mock vector so downstream features still work
        return [random.random() - 0.5 for _ in range(768)]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two vectors. Returns -1 to 1."""
    if len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)
