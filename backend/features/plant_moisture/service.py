import json
import os
from datetime import datetime, timedelta

from backend.core.database import fetch_plant_observations
from backend.features.environment.service import read_cached_weather_snapshot

TIMELINE_CACHE_PATH = os.getenv(
    "PLANT_TIMELINE_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "timeline.json")
)
TIME_FORMAT = "%Y-%m-%d %H:%M"


def _now_string() -> str:
    return datetime.now().strftime(TIME_FORMAT)


def _parse_timestamp(value: str | None) -> datetime:
    if not value:
        return datetime.now()
    for fmt in ("%Y-%m-%d %H:%M:%S", TIME_FORMAT):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value.replace("Z", ""))
    except ValueError:
        return datetime.now()


def read_timeline_cache() -> list[dict] | None:
    try:
        if not os.path.exists(TIMELINE_CACHE_PATH):
            return None
        with open(TIMELINE_CACHE_PATH, "r", encoding="utf-8") as cache_file:
            payload = json.load(cache_file)
        items = payload.get("items")
        if isinstance(items, list):
            return items
    except Exception as e:
        print("Timeline cache read error:", e)
    return None


def write_timeline_cache(items: list[dict]) -> None:
    try:
        os.makedirs(os.path.dirname(TIMELINE_CACHE_PATH), exist_ok=True)
        payload = {
            "updated_at": _now_string(),
            "items": items
        }
        with open(TIMELINE_CACHE_PATH, "w", encoding="utf-8") as cache_file:
            json.dump(payload, cache_file)
    except Exception as e:
        print("Timeline cache write error:", e)


def _observation_to_item(observation: dict, state: str) -> dict:
    payload = observation.get("payload_json") or "{}"
    snapshot = None
    if observation.get("image_path"):
        snapshot = {
            "url": observation.get("image_path"),
            "capturedAt": observation.get("image_captured_at") or observation.get("observed_at"),
        }
    return {
        "label": "unknown",
        "capturedAt": observation.get("observed_at"),
        "value": observation.get("moisture_value"),
        "unit": observation.get("moisture_unit") or "%",
        "note": observation.get("note") or "",
        "state": state,
        "prediction": state == "prediction",
        "snapshot": snapshot,
        "source": observation.get("source") or "sensor",
        "payload": payload,
    }


def _apply_previous_labels(items: list[dict]) -> None:
    total = len(items)
    for index, item in enumerate(items):
        item["label"] = f"Trước đó {total - index}"


def _build_prediction_item(current_item: dict, weather_snapshot: dict | None) -> dict:
    current_value = current_item.get("value")
    try:
        predicted_value = max(0.0, float(current_value) - 3.0)
    except (TypeError, ValueError):
        predicted_value = current_value

    prediction_time = _parse_timestamp(current_item.get("capturedAt")) + timedelta(hours=1)
    payload = {
        "sample": True,
        "weather": weather_snapshot or {},
    }
    return {
        "label": "Dự đoán",
        "capturedAt": prediction_time.strftime(TIME_FORMAT),
        "value": predicted_value,
        "unit": current_item.get("unit") or "%",
        "note": "Dự đoán (mẫu) dựa trên dữ liệu hiện tại.",
        "state": "prediction",
        "prediction": True,
        "snapshot": current_item.get("snapshot"),
        "source": "prediction",
        "payload": json.dumps(payload),
    }


def _matches_observation(item: dict, observation: dict) -> bool:
    return (
        item.get("capturedAt") == observation.get("observed_at")
        and item.get("value") == observation.get("moisture_value")
        and item.get("source") == observation.get("source")
    )


def build_timeline_from_observations(observations: list[dict]) -> list[dict]:
    non_prediction = [item for item in observations if item.get("kind") != "prediction"]
    selected = non_prediction[-4:]
    items = [_observation_to_item(item, "previous") for item in selected]
    if not items:
        return []

    items[-1]["state"] = "current"
    items[-1]["label"] = "Hiện tại"
    items[-1]["prediction"] = False

    previous_items = items[:-1]
    _apply_previous_labels(previous_items)

    timeline_items = previous_items + [items[-1]]
    prediction_item = _build_prediction_item(items[-1], read_cached_weather_snapshot())
    timeline_items.append(prediction_item)
    return timeline_items


def get_moisture_timeline() -> list[dict]:
    cached = read_timeline_cache()
    if cached:
        return cached

    observations = fetch_plant_observations()
    items = build_timeline_from_observations(observations)
    if items:
        write_timeline_cache(items)
    return items


def update_timeline_cache_with_observation(observation: dict, weather_snapshot: dict | None) -> list[dict]:
    items = read_timeline_cache()
    if not items:
        observations = fetch_plant_observations()
        items = build_timeline_from_observations(observations)

    non_prediction = [item for item in items if not item.get("prediction")]
    for item in non_prediction:
        item["state"] = "previous"
        item["prediction"] = False

    current_item = _observation_to_item(observation, "current")
    current_item["label"] = "Hiện tại"
    if non_prediction and _matches_observation(non_prediction[-1], observation):
        non_prediction[-1] = current_item
    else:
        non_prediction.append(current_item)
    if len(non_prediction) > 4:
        non_prediction = non_prediction[-4:]

    previous_items = non_prediction[:-1]
    _apply_previous_labels(previous_items)

    timeline_items = previous_items + [current_item]
    prediction_item = _build_prediction_item(current_item, weather_snapshot or read_cached_weather_snapshot())
    timeline_items.append(prediction_item)
    write_timeline_cache(timeline_items)
    return timeline_items
