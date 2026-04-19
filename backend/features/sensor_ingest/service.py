import base64
import json
import os
from datetime import datetime
from pathlib import Path

from werkzeug.utils import secure_filename

from backend.core.database import PLANT_IMAGE_DIR, ensure_media_dirs, insert_plant_observation
from backend.features.environment.service import get_current_weather, read_cached_weather_snapshot
from backend.features.plant_moisture.service import update_timeline_cache_with_observation

TIME_FORMAT = "%Y-%m-%d %H:%M"
DEFAULT_LAT = float(os.getenv("OPENWEATHER_LAT", "21.0285"))
DEFAULT_LON = float(os.getenv("OPENWEATHER_LON", "105.8542"))


def _normalize_timestamp(value: str | None) -> str:
    if not value:
        return datetime.now().strftime(TIME_FORMAT)
    for fmt in ("%Y-%m-%d %H:%M:%S", TIME_FORMAT):
        try:
            return datetime.strptime(value, fmt).strftime(TIME_FORMAT)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value.replace("Z", "")).strftime(TIME_FORMAT)
    except ValueError:
        return datetime.now().strftime(TIME_FORMAT)


def _file_timestamp(value: str | None) -> str:
    try:
        return datetime.strptime(value, TIME_FORMAT).strftime("%Y%m%d_%H%M%S")
    except ValueError:
        return datetime.now().strftime("%Y%m%d_%H%M%S")


def _parse_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _save_upload_file(file_storage, observed_at: str) -> str:
    ensure_media_dirs()
    filename = secure_filename(file_storage.filename or "")
    if not filename:
        filename = f"sensor_{_file_timestamp(observed_at)}.jpg"
    destination = PLANT_IMAGE_DIR / filename
    file_storage.save(destination)
    return str(destination)


def _save_base64_image(image_base64: str, observed_at: str, filename: str | None) -> str:
    ensure_media_dirs()
    base64_value = image_base64.strip()
    extension = "jpg"
    if base64_value.startswith("data:") and "," in base64_value:
        header, base64_value = base64_value.split(",", 1)
        if "/" in header:
            extension = header.split("/")[-1].split(";")[0] or extension
    image_bytes = base64.b64decode(base64_value)
    safe_name = secure_filename(filename or "")
    if not safe_name:
        safe_name = f"sensor_{_file_timestamp(observed_at)}.{extension}"
    destination = PLANT_IMAGE_DIR / safe_name
    Path(destination).write_bytes(image_bytes)
    return str(destination)


def ingest_sensor_payload(payload: dict, files: dict) -> dict:
    moisture_value = _parse_float(
        payload.get("soil_moisture")
        or payload.get("moisture_value")
        or payload.get("moisture")
    )
    if moisture_value is None:
        return {"ok": False, "error": "Missing soil moisture value."}

    moisture_unit = payload.get("moisture_unit") or payload.get("unit") or "%"
    source = payload.get("source") or "sensor"
    note = payload.get("note") or "Dữ liệu cảm biến gửi lên."

    observed_at = _normalize_timestamp(payload.get("observed_at") or payload.get("captured_at"))

    image_path = None
    image_captured_at = observed_at
    image_file = files.get("image") if files else None
    if image_file:
        image_path = _save_upload_file(image_file, observed_at)
    elif payload.get("image_base64"):
        try:
            image_path = _save_base64_image(
                payload.get("image_base64"),
                observed_at,
                payload.get("image_filename"),
            )
        except (ValueError, base64.binascii.Error):
            return {"ok": False, "error": "Invalid image_base64 payload."}

    weather, weather_source = get_current_weather(DEFAULT_LAT, DEFAULT_LON)
    weather_snapshot = {
        "data": weather,
        "source": weather_source,
        "fetched_at": datetime.now().timestamp(),
    } if weather else (read_cached_weather_snapshot() or {})

    sensor_payload = {
        "soil_moisture": moisture_value,
        "moisture_unit": moisture_unit,
        "observed_at": observed_at,
        "note": note,
        "source": source,
        "image_filename": payload.get("image_filename"),
        "received_at": datetime.now().isoformat(timespec="seconds"),
    }

    payload_json = json.dumps({
        "sensor": sensor_payload,
        "weather": weather_snapshot,
    })

    observation = insert_plant_observation(
        source=source,
        observed_at=observed_at,
        moisture_value=moisture_value,
        moisture_unit=moisture_unit,
        image_path=image_path,
        image_captured_at=image_captured_at,
        note=note,
        kind="current",
        payload_json=payload_json,
    )

    if not observation:
        return {"ok": False, "error": "Failed to save observation."}

    timeline_items = update_timeline_cache_with_observation(observation, weather_snapshot)

    return {
        "ok": True,
        "observationId": observation.get("id"),
        "timelineUpdated": True,
        "timelineSize": len(timeline_items),
    }
