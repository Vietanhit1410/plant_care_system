import os
from flask import Blueprint, jsonify

from backend.features.environment.service import get_current_weather

environment_bp = Blueprint('environment', __name__)

LAT = 21.0285
LON = 105.8542
API_ENVIRONMENT_CURRENT = os.getenv('API_ENVIRONMENT_CURRENT', '/api/environment/current')


@environment_bp.get(API_ENVIRONMENT_CURRENT)
def environment_current():
    weather, source = get_current_weather(LAT, LON)

    if not weather:
        return jsonify({"error": "Failed"}), 500

    return jsonify({
        **weather,
        "source": source
    })