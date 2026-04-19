import os
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5")
CACHE_TTL_SECONDS = int(os.getenv("OPENWEATHER_CACHE_TTL_SECONDS", "900"))
CACHE_PATH = os.getenv(
    "OPENWEATHER_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "weather_cache.json")
)


def _read_cache(ignore_ttl=False, include_meta=False):
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
            if include_meta:
                return {
                    "fetched_at": fetched_at,
                    "data": data
                }
            return data
    except Exception as e:
        print("Weather cache read error:", e)
    return None


def _write_cache(data):
    try:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        payload = {
            "fetched_at": time.time(),
            "data": data
        }
        with open(CACHE_PATH, "w", encoding="utf-8") as cache_file:
            json.dump(payload, cache_file)
    except Exception as e:
        print("Weather cache write error:", e)


def read_cached_weather_snapshot():
    return _read_cache(ignore_ttl=True, include_meta=True)


def get_current_weather(lat, lon):
    cached = _read_cache()
    if cached:
        return cached, "cache"

    url = f"{BASE_URL}/weather"

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric"
    }

    try:
        res = requests.get(url, params=params)
        res.raise_for_status()
        data = res.json()

        weather = {
            "temperature": data["main"]["temp"],          # (1)
            "humidity": data["main"]["humidity"],         # (3)
            "weather": data["weather"][0]["description"],
            "clouds": data["clouds"]["all"],              # (6)
            "wind_speed": data["wind"]["speed"],          # (4)
            "rain": data.get("rain", {}).get("1h", 0),    # (5)
            "timestamp": data["dt"]
        }

        _write_cache(weather)
        return weather, "openweather"

    except Exception as e:
        print("Weather error:", e)
        return None, None
