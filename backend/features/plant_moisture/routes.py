import os
from flask import Blueprint, jsonify

from backend.features.plant_moisture.service import get_moisture_timeline

plant_moisture_bp = Blueprint('plant_moisture', __name__)

API_PLANT_MOISTURE_CURRENT = os.getenv('API_PLANT_MOISTURE_CURRENT', '/api/plant-moisture/current')


@plant_moisture_bp.get(API_PLANT_MOISTURE_CURRENT)
def current_moisture():
    timeline = get_moisture_timeline()
    current = next((item for item in timeline if item.get('state') == 'current'), timeline[3] if len(timeline) > 3 else None)
    snapshot = current.get('snapshot') if current else None

    return jsonify({
        'value': current.get('value') if current else None,
        'unit': current.get('unit') if current else '%',
        'source': current.get('source') if current else 'timeline-cache',
        'capturedAt': current.get('capturedAt') if current else None,
        'timeline': timeline,
        'snapshot': snapshot,
    })
