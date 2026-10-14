"""Resolve freely licensed article images with their credit and source.

No caller-controlled upstream URLs, credentials or invented city photographs.
"""
import asyncio
import os
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


async def destination_image(query: str, reusable: bool = False):
    title = query.strip()[:100]
    key = (title.casefold(), reusable)
    cached = _cache.get(key)
    if cached and cached[0] > time.monotonic():
        return cached[1]
    task = _inflight.get(key)
    if task is None:
        task = asyncio.create_task(_fetch_destination_image(title, reusable))
        _inflight[key] = task
        task.add_done_callback(lambda completed: _inflight.pop(key, None))
    return await asyncio.shield(task)


async def _fetch_destination_image(query: str, reusable: bool = False):
    title = query.strip()[:100]
    if len(title) < 2:
        return {"image": None}
    async with _concurrency:
        if not reusable:
            google = await _google_photo(title)
            if google:
                return google
        cached = _cache.get((title.casefold(), reusable))
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
        _cache[(title.casefold(), reusable)] = (time.monotonic() + (86400 if result.get("image") else 120), result)
        return result


async def _google_photo(title: str):
    key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post("https://places.googleapis.com/v1/places:searchText",
                headers={"X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": "places.id,places.photos,places.googleMapsUri",
                    "Referer": "https://naviigo.in/"},
                json={"textQuery": f"{title} India", "pageSize": 1})
            response.raise_for_status()
            places = response.json().get("places") or []
            if not places or not places[0].get("photos"):
                return None
            photo = places[0]["photos"][0]
            name = photo.get("name", "")
            if not re.fullmatch(r"places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+", name):
                return None
            authors = photo.get("authorAttributions") or []
            return {"image": f"/api/places/photo?name={name}&maxwidth=800",
                "credit": ", ".join(a.get("displayName", "") for a in authors) or "Google Maps",
                "source": "Google Maps", "license": "Photo supplied through Google Places",
                "sourceUrl": photo.get("googleMapsUri") or places[0].get("googleMapsUri") or "https://maps.google.com",
                "attributions": authors}
    except (httpx.HTTPError, ValueError, TypeError, KeyError, AttributeError):
        return None
