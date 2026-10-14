"""Resolve freely licensed article images with their credit and source.

No caller-controlled upstream URLs, credentials or invented city photographs.
"""
import asyncio
import html
import re
import time
from urllib.parse import urlparse
import httpx

_cache = {}
_concurrency = asyncio.Semaphore(4)
_inflight = {}
_headers = {"User-Agent": "NaviiGo/1.0 (https://naviigo.in; destination images)"}


def _plain(value):
    return html.unescape(re.sub(r"<[^>]*>", "", str(value or "")))[:300]


async def destination_image(query: str):
    title = query.strip()[:100]
    key = title.casefold()
    cached = _cache.get(key)
    if cached and cached[0] > time.monotonic():
        return cached[1]
    task = _inflight.get(key)
    if task is None:
        task = asyncio.create_task(_fetch_destination_image(title))
        _inflight[key] = task
        task.add_done_callback(lambda completed: _inflight.pop(key, None))
    return await asyncio.shield(task)


async def _fetch_destination_image(query: str):
    title = query.strip()[:100]
    if len(title) < 2:
        return {"image": None}
    async with _concurrency:
        cached = _cache.get(title.casefold())
        if cached and cached[0] > time.monotonic():
            return cached[1]
        result = {"image": None}
        try:
            async with httpx.AsyncClient(timeout=8, headers=_headers) as client:
                resp = await client.get("https://en.wikipedia.org/w/api.php", params={
                    "action": "query", "format": "json", "prop": "pageimages",
                    "piprop": "name", "titles": title, "redirects": 1,
                })
                resp.raise_for_status()
                pages = resp.json().get("query", {}).get("pages", {})
                page = next(iter(pages.values()), {})
                filename = page.get("pageimage")
                if filename:
                    info = await client.get("https://commons.wikimedia.org/w/api.php", params={
                        "action": "query", "format": "json", "prop": "imageinfo",
                        "titles": f"File:{filename}", "iiprop": "url|extmetadata",
                        "iiurlwidth": 800,
                        "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|UsageTerms",
                    })
                    info.raise_for_status()
                    file_page = next(iter(info.json().get("query", {}).get("pages", {}).values()), {})
                    imageinfo = (file_page.get("imageinfo") or [{}])[0]
                    url = imageinfo.get("thumburl") or imageinfo.get("url") or ""
                    metadata = imageinfo.get("extmetadata") or {}
                    license_name = _plain(metadata.get("LicenseShortName", {}).get("value"))
                    artist = _plain(metadata.get("Artist", {}).get("value"))
                    source = imageinfo.get("descriptionurl") or ""
                    parsed = urlparse(url)
                    # Exclude fair-use images and files without reusable metadata.
                    if (parsed.scheme == "https" and parsed.hostname in {"upload.wikimedia.org", "thumb.wikimedia.org"}
                            and urlparse(source).hostname == "commons.wikimedia.org"
                            and artist and (license_name.startswith("CC") or license_name == "Public domain")):
                        result = {"image": url, "credit": artist, "license": license_name,
                                  "sourceUrl": source, "source": "Wikimedia Commons",
                                  "licenseUrl": metadata.get("LicenseUrl", {}).get("value")}
        except (httpx.HTTPError, ValueError, TypeError, AttributeError):
            pass
        if len(_cache) >= 256:
            _cache.pop(next(iter(_cache)))
        _cache[title.casefold()] = (time.monotonic() + (86400 if result.get("image") else 120), result)
        return result
