import base64
import os
from datetime import datetime, timezone

import requests

CAPTURE_URL = os.getenv('CAMERA_CAPTURE_URL', 'http://192.168.41.104/capture')
DEFAULT_TIMEOUT_SEC = float(os.getenv('CAMERA_CAPTURE_TIMEOUT_SEC', '20'))


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _as_data_url(content: bytes, content_type: str) -> str:
    encoded = base64.b64encode(content).decode('ascii')
    return f"data:{content_type};base64,{encoded}"


def capture_camera_snapshot() -> dict:
    response = requests.get(CAPTURE_URL, timeout=DEFAULT_TIMEOUT_SEC)
    response.raise_for_status()

    content_type = response.headers.get('content-type', '')
    captured_at = _utc_now_iso()

    if 'application/json' in content_type:
        data = response.json()
        image_url = data.get('imageUrl') or data.get('image_url') or data.get('url') or ''
        return {
            'capturedAt': data.get('capturedAt') or data.get('captured_at') or captured_at,
            'imageUrl': image_url,
            'raw': data,
        }

    if content_type.startswith('image/'):
        return {
            'capturedAt': captured_at,
            'imageUrl': _as_data_url(response.content, content_type),
        }

    return {
        'capturedAt': captured_at,
        'imageUrl': '',
        'raw': response.text,
    }
