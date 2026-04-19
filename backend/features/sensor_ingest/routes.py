import os
from flask import Blueprint, jsonify, request

from backend.features.sensor_ingest.service import ingest_sensor_payload

sensor_ingest_bp = Blueprint('sensor_ingest', __name__)

API_SENSOR_INGEST = os.getenv('API_SENSOR_INGEST', '/api/sensor/ingest')


@sensor_ingest_bp.post(API_SENSOR_INGEST)
def sensor_ingest():
    if request.is_json:
        payload = request.get_json(silent=True) or {}
    else:
        payload = dict(request.form or {})
    files = request.files

    result = ingest_sensor_payload(payload, files)
    if not result.get("ok"):
        return jsonify({"error": result.get("error")}), 400

    return jsonify(result), 201
