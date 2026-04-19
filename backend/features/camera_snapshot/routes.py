import os
from flask import Blueprint, jsonify

from backend.features.camera_snapshot.service import capture_camera_snapshot

camera_snapshot_bp = Blueprint('camera_snapshot', __name__)

API_CAMERA_SNAPSHOT_CAPTURE = os.getenv('API_CAMERA_SNAPSHOT_CAPTURE', '/api/camera-snapshot/capture')


@camera_snapshot_bp.get(API_CAMERA_SNAPSHOT_CAPTURE)
def camera_snapshot_capture():
    try:
        data = capture_camera_snapshot()
        return jsonify(data)
    except Exception as exc:
        return jsonify({
            'error': 'capture_failed',
            'message': str(exc),
        }), 502
