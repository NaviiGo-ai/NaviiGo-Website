# ─── Weather Engine (Google Weather API + Open-Meteo Fallback) ─────────────────
# Volatility-aware weather provider with 30-minute decoupled caching.

import os
import time
from typing import Dict, Any, Optional
import httpx

GOOGLE_WEATHER_API_KEY = os.getenv("GOOGLE_WEATHER_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

WMO_CODES = {
    0: {"label": "Clear Sky", "emoji": "☀️"},
    1: {"label": "Mainly Clear", "emoji": "🌤️"},
    2: {"label": "Partly Cloudy", "emoji": "⛅"},
    3: {"label": "Overcast", "emoji": "☁️"},
    45: {"label": "Foggy", "emoji": "🌫️"},
    48: {"label": "Icy Fog", "emoji": "🌫️"},
    51: {"label": "Light Drizzle", "emoji": "🌦️"},
    61: {"label": "Light Rain", "emoji": "🌧️"},
    63: {"label": "Moderate Rain", "emoji": "🌧️"},
    65: {"label": "Heavy Rain", "emoji": "⛈️"},
    71: {"label": "Light Snow", "emoji": "🌨️"},
    73: {"label": "Moderate Snow", "emoji": "❄️"},
    80: {"label": "Rain Showers", "emoji": "🌦️"},
    95: {"label": "Thunderstorm", "emoji": "⛈️"},
}

# Weather in-memory cache: (lat_round, lng_round) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_WEATHER_CACHE_TTL_SEC = 1800  # 30 minutes


def _get_cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, 2)}_{round(lng, 2)}"


async def _fetch_google_weather(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """Query Google Weather API if API key is configured."""
    if not GOOGLE_WEATHER_API_KEY or len(GOOGLE_WEATHER_API_KEY) < 5:
        return None

    try:
        url = "https://weather.googleapis.com/v1/currentConditions:lookup"
        params = {
            "location.latitude": lat,
            "location.longitude": lng,
            "key": GOOGLE_WEATHER_API_KEY,
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                temp = data.get("temperature", {}).get("degrees", 25)
                feels_like = data.get("feelsLikeTemperature", {}).get("degrees", temp)
                humidity = data.get("relativeHumidity", 50)
                condition_desc = data.get("weatherCondition", {}).get("description", {}).get("text", "Fair")

                # Condition emoji mapping
                desc_lower = condition_desc.lower()
                emoji = "☀️"
                if "rain" in desc_lower or "drizzle" in desc_lower:
                    emoji = "🌧️"
                elif "cloud" in desc_lower or "overcast" in desc_lower:
                    emoji = "⛅"
                elif "thunder" in desc_lower or "storm" in desc_lower:
                    emoji = "⛈️"
                elif "snow" in desc_lower:
                    emoji = "❄️"
                elif "fog" in desc_lower or "mist" in desc_lower:
                    emoji = "🌫️"

                return {
                    "current": {
                        "temp": round(temp),
                        "feelsLike": round(feels_like),
                        "humidity": humidity,
                        "rainChance": data.get("precipitationProbability", 0),
                        "windSpeed": round(data.get("wind", {}).get("speed", {}).get("value", 10)),
                        "condition": condition_desc,
                        "emoji": emoji,
                    },
                    "daily": [],
                    "source": "google_weather",
                }
    except Exception as e:
        print(f"[Weather Engine] Google Weather API error: {e}")
    return None


async def _fetch_open_meteo(lat: float, lng: float) -> Dict[str, Any]:
    """Fetch 7-day weather forecast from Open-Meteo."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
        f"&timezone=Asia%2FKolkata&forecast_days=7"
    )

    async with httpx.AsyncClient(timeout=7.0) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise Exception(f"Open-Meteo HTTP {resp.status_code}")
        data = resp.json()

    curr = data.get("current", {})
    code = curr.get("weather_code", 0)
    weather = WMO_CODES.get(code, {"label": "Fair", "emoji": "🌤️"})

    daily = data.get("daily", {})
    daily_list = []
    if daily.get("time"):
        for i, date_str in enumerate(daily["time"]):
            d_code = daily["weather_code"][i] if i < len(daily.get("weather_code", [])) else 0
            d_weather = WMO_CODES.get(d_code, {"label": "Fair", "emoji": "🌤️"})
            daily_list.append({
                "date": date_str,
                "maxTemp": round(daily["temperature_2m_max"][i]),
                "minTemp": round(daily["temperature_2m_min"][i]),
                "rainChance": daily["precipitation_probability_max"][i] if i < len(daily.get("precipitation_probability_max", [])) else 0,
                "condition": d_weather["label"],
                "emoji": d_weather["emoji"],
            })

    return {
        "current": {
            "temp": round(curr.get("temperature_2m", 25)),
            "feelsLike": round(curr.get("apparent_temperature", 25)),
            "humidity": curr.get("relative_humidity_2m", 50),
            "rainChance": curr.get("precipitation_probability", 0),
            "windSpeed": round(curr.get("wind_speed_10m", 10)),
            "condition": weather["label"],
            "emoji": weather["emoji"],
        },
        "daily": daily_list,
        "source": "open_meteo",
    }


async def get_weather(lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
    """
    Fetch weather forecast using decoupled 30-min cache.
    Tries Google Weather API -> Open-Meteo -> graceful empty fallback.
    """
    if lat is None or lng is None:
        return {
            "current": None,
            "daily": [],
            "source": "none",
        }

    cache_key = _get_cache_key(lat, lng)
    now = time.time()
    if cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < _WEATHER_CACHE_TTL_SEC:
            return cached_data

    # 1. Try Google Weather API
    g_res = await _fetch_google_weather(lat, lng)
    if g_res and g_res.get("current"):
        # Enrich daily forecast with Open-Meteo if Google only returned current conditions
        if not g_res.get("daily"):
            try:
                om_res = await _fetch_open_meteo(lat, lng)
                g_res["daily"] = om_res.get("daily", [])
            except Exception:
                pass
        _WEATHER_CACHE[cache_key] = (now, g_res)
        return g_res

    # 2. Fallback to Open-Meteo
    try:
        res = await _fetch_open_meteo(lat, lng)
        _WEATHER_CACHE[cache_key] = (now, res)
        return res
    except Exception as e:
        print(f"[Weather Engine] All providers failed for ({lat}, {lng}): {e}")
        return {
            "current": None,
            "daily": [],
            "source": "none",
        }
