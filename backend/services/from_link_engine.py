# ─── From-Link Engine (Social Media → Itinerary) ───────────────────────────────
import json
import re
import asyncio
import hashlib
import httpx
from typing import Optional, Dict, Any
from services.gemini_client import get_client, GEMINI_MODEL, is_configured
from services.gemini_cache import cached_gemini_call


async def fetch_url_metadata(url: str) -> Optional[Dict[str, str]]:
    """Fetch Open Graph metadata from a public URL."""
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; NaviiGoBot/1.0; +https://naviigo.app)",
                "Accept": "text/html,application/xhtml+xml",
            })
            if resp.status_code != 200:
                return None
            html = resp.text

            og_title = re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]+)"', html)
            og_desc = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]+)"', html)
            og_image = re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"', html)
            title_tag = re.search(r'<title>([^<]+)</title>', html)

            title = (og_title.group(1) if og_title else "") or (title_tag.group(1) if title_tag else "")
            return {
                "title": title,
                "description": og_desc.group(1) if og_desc else "",
                "image": og_image.group(1) if og_image else "",
            }
    except Exception:
        return None


async def _analyze_with_gemini(analysis_text: str) -> Dict[str, Any]:
    """Raw Gemini call — only on cache miss."""
    client = get_client()
    prompt = f"""You are a travel content parser. Extract travel information from this social media content.

Content to analyze:
\"\"\"
{analysis_text[:2000]}
\"\"\"

Return ONLY valid JSON (no markdown, no explanation):
{{
  "destName": "Primary destination name (Indian city/region, or null if not found)",
  "places": ["List of specific places/attractions mentioned"],
  "vibe": "One of: adventure, spiritual, leisure, cultural, honeymoon, celebrate",
  "days": number or null if not mentioned,
  "purpose": "One of: adventure, spiritual, leisure, cultural, honeymoon, celebrate",
  "tags": ["2-4 descriptive tags like Beaches, Mountains, Food, etc."],
  "summary": "1 sentence describing what this trip is about",
  "confidence": "high/medium/low based on how much travel info was found"
}}

If this doesn't seem travel-related, return {{ "destName": null, "confidence": "low" }}"""

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=GEMINI_MODEL,
        contents=prompt,
    )
    text = response.text
    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        raise ValueError("Could not parse travel info from this content.")
    return json.loads(json_match.group(0))


async def extract_from_link(url: Optional[str] = None, caption_text: Optional[str] = None) -> Dict[str, Any]:
    """Extract travel info from a URL or caption text — cached by content hash."""
    if not url and not caption_text:
        raise ValueError("Provide url or captionText")

    # Build analysis text
    analysis_text = caption_text or ""
    if url:
        meta = await fetch_url_metadata(url)
        if meta:
            analysis_text = "\n".join(filter(None, [meta["title"], meta["description"], caption_text]))
        else:
            analysis_text = f"URL: {url}\n{caption_text or ''}"

    if not analysis_text.strip():
        raise ValueError("Could not extract any text from the link.")

    if not is_configured():
        return {
            "destName": "Ladakh",
            "places": ["Pangong Tso", "Nubra Valley", "Leh Palace"],
            "vibe": "adventure",
            "days": 5,
            "purpose": "adventure",
            "tags": ["Mountains", "Lakes", "Road Trip"],
            "confidence": "demo",
        }

    # Cache by content hash (same URL/caption = same result)
    content_hash = hashlib.md5(analysis_text.encode()).hexdigest()[:16]
    cache_key = f"{content_hash}"

    result = await cached_gemini_call(
        cache_namespace="from_link",
        cache_key=cache_key,
        generator=lambda: _analyze_with_gemini(analysis_text),
        ttl_hours=72,  # Link content doesn't change often
    )

    if not result:
        raise ValueError("Could not parse travel info from this content.")

    if not result.get("destName"):
        raise ValueError("Couldn't find a travel destination in this content.")

    return result
