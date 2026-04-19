import os
from flask import Blueprint, jsonify

current_status_bp = Blueprint('current_status', __name__)

API_CURRENT_STATUS = os.getenv('API_CURRENT_STATUS', '/api/current_status')


@current_status_bp.get(API_CURRENT_STATUS)
def current_status():
    return jsonify({
        'note': 'Current status placeholder',
        'capturedAt': '2026-04-18 15:00',
        'source': 'sqlite-seed',
    })
