import json
import os
import time
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5")
CACHE_TTL_SECONDS = int(os.getenv("OPENWEATHER_CACHE_TTL_SECONDS", "900"))
CACHE_PATH = os.getenv(
    "OPENWEATHER_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "../cache/weather_cache.json")
)


def _read_cache(ignore_ttl: bool = False) -> dict | None:
    try:
        if not os.path.exists(CACHE_PATH):
            return None
        with open(CACHE_PATH, "r", encoding="utf-8") as cache_file:
            payload = json.load(cache_file)
        fetched_at = payload.get("fetched_at")
        data = payload.get("data")
        if not fetched_at or not isinstance(data, dict):
            return None
        if ignore_ttl or (time.time() - float(fetched_at)) <= CACHE_TTL_SECONDS:
            return data
    except Exception as exc:
        print("Weather cache read error:", exc)
    return None


def _write_cache(data: dict) -> None:
    try:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        payload = {
            "fetched_at": time.time(),
            "data": data,
        }
        with open(CACHE_PATH, "w", encoding="utf-8") as cache_file:
            json.dump(payload, cache_file)
    except Exception as exc:
        print("Weather cache write error:", exc)


def get_current_weather(lat: float, lon: float) -> tuple[dict | None, str | None]:
    cached = _read_cache()
    if cached:
        return cached, "cache"

    url = f"{BASE_URL}/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
    }

    try:
        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        data: dict[str, Any] = res.json()

        weather = {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "weather": data["weather"][0]["description"],
            "clouds": data["clouds"]["all"],
            "wind_speed": data["wind"]["speed"],
            "rain": data.get("rain", {}).get("1h", 0),
            "timestamp": data.get("dt"),
        }

        _write_cache(weather)
        return weather, "openweather"

    except Exception as exc:
        print("Weather error:", exc)
        return None, None
