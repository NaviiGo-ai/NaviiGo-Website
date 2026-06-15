# ─── Weather Engine (Open-Meteo — 100% free) ───────────────────────────────────
import httpx
from typing import Dict, Any

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


async def get_weather(lat: float = 20.5937, lng: float = 78.9629) -> Dict[str, Any]:
    """Fetch 7-day weather forecast from Open-Meteo (free, no key)."""
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
            f"&timezone=Asia%2FKolkata&forecast_days=7"
        )

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise Exception("Open-Meteo unavailable")
            data = resp.json()

        curr = data["current"]
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
                "temp": round(curr["temperature_2m"]),
                "feelsLike": round(curr["apparent_temperature"]),
                "humidity": curr["relative_humidity_2m"],
                "rainChance": curr.get("precipitation_probability", 0),
                "windSpeed": round(curr["wind_speed_10m"]),
                "condition": weather["label"],
                "emoji": weather["emoji"],
            },
            "daily": daily_list,
        }
    except Exception:
        return {
            "current": {
                "temp": 28, "feelsLike": 31, "humidity": 72, "rainChance": 20,
                "windSpeed": 12, "condition": "Partly Cloudy", "emoji": "⛅",
            },
            "daily": [],
            "_mock": True,
        }
