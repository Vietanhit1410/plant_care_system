import os
from flask import Blueprint, jsonify

from backend.core.database import fetch_plant_history_items

plant_history_bp = Blueprint('plant_history', __name__)

API_PLANT_HISTORY = os.getenv('API_PLANT_HISTORY', '/api/plant-history')


@plant_history_bp.get(API_PLANT_HISTORY)
def plant_history():
    return jsonify({
        'items': fetch_plant_history_items(),
        'message': 'History loaded from shared plant observations table',
    })
