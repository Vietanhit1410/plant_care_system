import os
from flask import Blueprint, jsonify

from backend.features.plant_timeline.service import get_plant_timeline

plant_timeline_bp = Blueprint('plant_timeline', __name__)

API_PLANT_TIMELINE_CURRENT = os.getenv('API_PLANT_TIMELINE_CURRENT', '/api/plant_timeline/current')


@plant_timeline_bp.get(API_PLANT_TIMELINE_CURRENT)
def current_timeline():
    timeline = get_plant_timeline()
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
