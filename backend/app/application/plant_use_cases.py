import base64
import json
import os
from datetime import datetime, timedelta
from typing import Any

from backend.app.infrastructure.image_storage import save_base64_image, save_upload_file

TIME_FORMAT = "%Y-%m-%d %H:%M"
TIMELINE_CACHE_PATH = os.getenv(
    "PLANT_TIMELINE_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "../cache/timeline_cache.json"),
)


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


def _read_timeline_cache() -> list[dict] | None:
    try:
        if not os.path.exists(TIMELINE_CACHE_PATH):
            return None
        with open(TIMELINE_CACHE_PATH, "r", encoding="utf-8") as cache_file:
            payload = json.load(cache_file)
        items = payload.get("items")
        if isinstance(items, list):
            return items
    except Exception as exc:
        print("Timeline cache read error:", exc)
    return None


def _write_timeline_cache(items: list[dict]) -> None:
    try:
        os.makedirs(os.path.dirname(TIMELINE_CACHE_PATH), exist_ok=True)
        payload = {
            "updated_at": _now_string(),
            "items": items,
        }
        with open(TIMELINE_CACHE_PATH, "w", encoding="utf-8") as cache_file:
            json.dump(payload, cache_file)
    except Exception as exc:
        print("Timeline cache write error:", exc)


def _observation_to_item(observation: dict, state: str) -> dict:
    snapshot = None
    if observation.get("image_url"):
        snapshot = {
            "url": observation.get("image_url"),
            "capturedAt": observation.get("received_at"),
        }
    return {
        "label": "unknown",
        "capturedAt": observation.get("received_at"),
        "value": observation.get("moisture"),
        "unit": "%",
        "temperature": observation.get("temperature"),
        "humidity": observation.get("humidity"),
        "weather": observation.get("weather"),
        "clouds": observation.get("clouds"),
        "wind_speed": observation.get("wind_speed"),
        "rain": observation.get("rain"),
        "note": observation.get("note") or "",
        "state": state,
        "prediction": state == "prediction",
        "snapshot": snapshot,
        "source": observation.get("source") or "system",
    }


def _apply_previous_labels(items: list[dict]) -> None:
    total = len(items)
    for index, item in enumerate(items):
        item["label"] = f"Trước đó {total - index}"


def _build_prediction_item(current_item: dict) -> dict:
    current_value = current_item.get("value")
    try:
        predicted_value = max(0.0, float(current_value) - 3.0)
    except (TypeError, ValueError):
        predicted_value = current_value

    prediction_time = _parse_timestamp(current_item.get("capturedAt")) + timedelta(hours=1)
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
    }


def _matches_observation(item: dict, observation: dict) -> bool:
    return (
        item.get("capturedAt") == observation.get("received_at")
        and item.get("value") == observation.get("moisture")
        and item.get("source") == observation.get("source")
    )


def get_current_status(repo) -> dict | None:
    return repo.get_latest_observation()


def list_history(repo) -> list[dict]:
    return repo.list_observations()


def build_timeline(observations: list[dict]) -> list[dict]:
    selected = observations[-4:]
    items = [_observation_to_item(item, "previous") for item in selected]
    if not items:
        return []

    items[-1]["state"] = "current"
    items[-1]["label"] = "Hiện tại"
    items[-1]["prediction"] = False

    previous_items = items[:-1]
    _apply_previous_labels(previous_items)

    timeline_items = previous_items + [items[-1]]
    prediction_item = _build_prediction_item(items[-1])
    timeline_items.append(prediction_item)
    return timeline_items


def get_timeline(repo) -> list[dict]:
    cached = _read_timeline_cache()
    if cached:
        return cached

    observations = repo.list_observations()
    items = build_timeline(observations)
    if items:
        _write_timeline_cache(items)
    return items


def update_timeline_cache(observation: dict, repo) -> list[dict]:
    items = _read_timeline_cache()
    if not items:
        items = build_timeline(repo.list_observations())

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
    prediction_item = _build_prediction_item(current_item)
    timeline_items.append(prediction_item)
    _write_timeline_cache(timeline_items)
    return timeline_items


def ingest_observation(payload: dict, files: dict, repo, weather_provider, image_dir) -> dict:
    moisture_value = payload.get("moisture") or payload.get("soil_moisture") or payload.get("moisture_value")
    try:
        moisture_value = float(moisture_value)
    except (TypeError, ValueError):
        return {"ok": False, "error": "Missing soil moisture value."}

    source = payload.get("source") or "system"
    note = payload.get("note") or "Dữ liệu cảm biến gửi lên."
    received_at = datetime.now().strftime(TIME_FORMAT)

    image_url = payload.get("image_url")
    image_file = files.get("image") if files else None
    if image_file:
        image_url = save_upload_file(image_file, received_at, image_dir)
    elif payload.get("image_base64"):
        try:
            image_url = save_base64_image(
                payload.get("image_base64"),
                received_at,
                payload.get("image_filename"),
                image_dir,
            )
        except (ValueError, base64.binascii.Error):
            return {"ok": False, "error": "Invalid image_base64 payload."}

    weather, _source = weather_provider()

    observation = repo.save_observation({
        "received_at": received_at,
        "temperature": (weather or {}).get("temperature"),
        "humidity": (weather or {}).get("humidity"),
        "weather": (weather or {}).get("weather"),
        "clouds": (weather or {}).get("clouds"),
        "wind_speed": (weather or {}).get("wind_speed"),
        "rain": (weather or {}).get("rain"),
        "moisture": moisture_value,
        "image_url": image_url,
        "source": source,
        "note": note,
    })

    if not observation:
        return {"ok": False, "error": "Failed to save observation."}

    update_timeline_cache(observation, repo)
    return {
        "ok": True,
        "observation": observation,
    }
