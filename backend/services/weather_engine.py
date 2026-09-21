# ─── Weather Engine (Google Weather API) ──────────────────────────────────────
# Volatility-aware weather provider with 30-minute decoupled caching.

import os
import time
from typing import Dict, Any, Optional
import httpx
import asyncio

GOOGLE_WEATHER_API_KEY = os.getenv("GOOGLE_WEATHER_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

# Weather in-memory cache: (lat_round, lng_round) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_WEATHER_CACHE_TTL_SEC = 1800  # 30 minutes


def _get_cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, 2)}_{round(lng, 2)}"


def _map_condition_emoji(desc: str) -> str:
    """Map Google Weather condition description to emoji."""
    desc_lower = (desc or "").lower()
    if not desc_lower:
        return "☀️"
    if "rain" in desc_lower or "drizzle" in desc_lower:
        return "🌧️"
    elif "cloud" in desc_lower or "overcast" in desc_lower:
        return "⛅"
    elif "thunder" in desc_lower or "storm" in desc_lower:
        return "⛈️"
    elif "snow" in desc_lower:
        return "❄️"
    elif "fog" in desc_lower or "mist" in desc_lower:
        return "🌫️"
    return "☀️"


async def _fetch_google_current(client: httpx.AsyncClient, lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """Query Google Weather API for current conditions."""
    try:
        url = "https://weather.googleapis.com/v1/currentConditions:lookup"
        params = {
            "location.latitude": lat,
            "location.longitude": lng,
            "unitsSystem": "METRIC",
            "languageCode": "en",
            "key": GOOGLE_WEATHER_API_KEY,
        }
        resp = await client.get(url, params=params)
        if resp.status_code == 200:
            data = resp.json()
            temp = data.get("temperature", {}).get("degrees")
            feels_like = data.get("feelsLikeTemperature", {}).get("degrees")
            humidity = data.get("relativeHumidity")
            condition_desc = data.get("weatherCondition", {}).get("description", {}).get("text")
            
            # Use None if fields are absent
            temp = round(temp) if temp is not None else None
            feels_like = round(feels_like) if feels_like is not None else None
            wind_speed = data.get("wind", {}).get("speed", {}).get("value")
            wind_speed = round(wind_speed) if wind_speed is not None else None
            rain_chance = data.get("precipitation", {}).get("probability", {}).get("percent")

            return {
                "temp": temp,
                "feelsLike": feels_like,
                "humidity": humidity,
                "rainChance": rain_chance,
                "windSpeed": wind_speed,
                "condition": condition_desc,
                "emoji": _map_condition_emoji(condition_desc),
            }
    except Exception as e:
        print(f"[Weather Engine] Google Weather API current conditions error: {e}")
    return None


async def _fetch_google_daily(client: httpx.AsyncClient, lat: float, lng: float) -> list:
    """Query Google Weather API for 7-day forecast."""
    try:
        url = "https://weather.googleapis.com/v1/forecast/days:lookup"
        params = {
            "location.latitude": lat,
            "location.longitude": lng,
            "days": 7,
            "pageSize": 7,
            "unitsSystem": "METRIC",
            "languageCode": "en",
            "key": GOOGLE_WEATHER_API_KEY,
        }
        resp = await client.get(url, params=params)
        if resp.status_code == 200:
            data = resp.json()
            days = data.get("forecastDays", [])
            daily_list = []
            for day in days:
                date_str = day.get("displayDate", "")
                if not date_str:
                    # the date is a dict like {'year': 2026, 'month': 9, 'day': 21} (if displayDate not present)
                    date_dict = day.get("date", {})
                    if isinstance(date_dict, dict) and date_dict:
                        y = date_dict.get("year", 2000)
                        m = date_dict.get("month", 1)
                        d = date_dict.get("day", 1)
                        date_str = f"{y}-{m:02d}-{d:02d}"
                    else:
                        continue
                
                day_cond = day.get("daytimeForecast", {})
                temp_max = day.get("maxTemperature", {}).get("degrees")
                temp_min = day.get("minTemperature", {}).get("degrees")
                cond_text = day_cond.get("weatherCondition", {}).get("description", {}).get("text")
                rain_chance = day_cond.get("precipitation", {}).get("probability", {}).get("percent")
                
                daily_list.append({
                    "date": date_str,
                    "maxTemp": round(temp_max) if temp_max is not None else None,
                    "minTemp": round(temp_min) if temp_min is not None else None,
                    "rainChance": rain_chance,
                    "condition": cond_text,
                    "emoji": _map_condition_emoji(cond_text),
                })
            return daily_list
    except Exception as e:
        print(f"[Weather Engine] Google Weather API daily forecast error: {e}")
    return []


async def get_weather(lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
    """
    Fetch weather forecast using decoupled 30-min cache.
    Uses Google Weather API exclusively. No fallback to Open-Meteo.
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

    if not GOOGLE_WEATHER_API_KEY or len(GOOGLE_WEATHER_API_KEY) < 5:
        return {
            "current": None,
            "daily": [],
            "source": "none",
        }

    async with httpx.AsyncClient(timeout=6.0) as client:
        current_task = _fetch_google_current(client, lat, lng)
        daily_task = _fetch_google_daily(client, lat, lng)
        
        current_res, daily_res = await asyncio.gather(current_task, daily_task, return_exceptions=True)

    if isinstance(current_res, Exception):
        current_res = None
    if isinstance(daily_res, Exception):
        daily_res = []
        
    if current_res is None and not daily_res:
        res = {
            "current": None,
            "daily": [],
            "source": "none",
        }
    else:
        res = {
            "current": current_res,
            "daily": daily_res,
            "source": "google_weather",
        }
        _WEATHER_CACHE[cache_key] = (now, res)

    return res
