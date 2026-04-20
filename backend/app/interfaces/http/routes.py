import os
from flask import Blueprint, jsonify, request

from backend.app.application.plant_use_cases import (
    get_current_status,
    get_timeline,
    ingest_observation,
    list_history,
)
from backend.app.infrastructure.camera_client import capture_snapshot
from backend.app.interfaces.http.schemas import ENVIRONMENT_SCHEMA, OBSERVATION_SCHEMA


API_CURRENT_STATUS = os.getenv("API_CURRENT_STATUS", "/api/current_status")
API_PLANT_HISTORY = os.getenv("API_PLANT_HISTORY", "/api/plant_history")
API_PLANT_TIMELINE_CURRENT = os.getenv("API_PLANT_TIMELINE_CURRENT", "/api/plant_timeline/current")
API_SENSOR_INGEST = os.getenv("API_SENSOR_INGEST", "/api/sensor/ingest")
API_CAMERA_SNAPSHOT_CAPTURE = os.getenv("API_CAMERA_SNAPSHOT_CAPTURE", "/api/camera_snapshot/capture")
API_ENVIRONMENT_CURRENT = os.getenv("API_ENVIRONMENT_CURRENT", "/api/environment/current")


def build_blueprints(deps: dict) -> list[Blueprint]:
    repo = deps["repo"]
    weather_provider = deps["weather_provider"]
    image_dir = deps["image_dir"]

    current_status_bp = Blueprint("current_status", __name__)
    plant_history_bp = Blueprint("plant_history", __name__)
    plant_timeline_bp = Blueprint("plant_timeline", __name__)
    sensor_ingest_bp = Blueprint("sensor_ingest", __name__)
    camera_snapshot_bp = Blueprint("camera_snapshot", __name__)
    environment_bp = Blueprint("environment", __name__)

    @current_status_bp.get(API_CURRENT_STATUS)
    def current_status():
        observation = get_current_status(repo)
        if not observation:
            return jsonify({"data": None, "schema": OBSERVATION_SCHEMA})
        return jsonify({"data": observation, "schema": OBSERVATION_SCHEMA})

    @plant_history_bp.get(API_PLANT_HISTORY)
    def plant_history():
        items = list_history(repo)
        return jsonify({"items": items, "schema": OBSERVATION_SCHEMA})

    @plant_timeline_bp.get(API_PLANT_TIMELINE_CURRENT)
    def current_timeline():
        timeline = get_timeline(repo)
        current = next((item for item in timeline if item.get("state") == "current"), timeline[3] if len(timeline) > 3 else None)
        snapshot = current.get("snapshot") if current else None

        return jsonify({
            "value": current.get("value") if current else None,
            "unit": current.get("unit") if current else "%",
            "source": current.get("source") if current else "timeline-cache",
            "capturedAt": current.get("capturedAt") if current else None,
            "timeline": timeline,
            "snapshot": snapshot,
            "schema": OBSERVATION_SCHEMA,
        })

    @sensor_ingest_bp.post(API_SENSOR_INGEST)
    def sensor_ingest():
        if request.is_json:
            payload = request.get_json(silent=True) or {}
        else:
            payload = dict(request.form or {})
        files = request.files

        result = ingest_observation(payload, files, repo, weather_provider, image_dir)
        if not result.get("ok"):
            return jsonify(result), 400

        observation = result.get("observation")
        return jsonify({
            "ok": True,
            "observation": observation,
            "schema": OBSERVATION_SCHEMA,
        }), 201

    @camera_snapshot_bp.get(API_CAMERA_SNAPSHOT_CAPTURE)
    def camera_snapshot_capture():
        try:
            data = capture_snapshot()
            return jsonify(data)
        except Exception as exc:
            return jsonify({
                "error": "capture_failed",
                "message": str(exc),
            }), 502

    @environment_bp.get(API_ENVIRONMENT_CURRENT)
    def environment_current():
        weather, source = weather_provider()
        if not weather:
            return jsonify({"error": "Failed"}), 500
        return jsonify({"data": {**weather, "source": source}, "schema": ENVIRONMENT_SCHEMA})

    return [
        current_status_bp,
        plant_history_bp,
        plant_timeline_bp,
        sensor_ingest_bp,
        camera_snapshot_bp,
        environment_bp,
    ]
