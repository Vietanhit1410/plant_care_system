import os
from flask import Blueprint, jsonify

dashboard_bp = Blueprint('dashboard', __name__)

API_DASHBOARD_SUMMARY = os.getenv('API_DASHBOARD_SUMMARY', '/api/dashboard/summary')


@dashboard_bp.get(API_DASHBOARD_SUMMARY)
def summary():
    return jsonify({
        'status': 'ok',
        'message': 'Dashboard summary endpoint',
    })
