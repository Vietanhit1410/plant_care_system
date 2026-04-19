import os
import shutil
import sqlite3
from pathlib import Path

DB_PATH = Path(os.getenv('PLANT_CARE_SQLITE_PATH', Path(__file__).resolve().parents[2] / 'plant_care_system.sqlite3'))
MEDIA_DIR = Path(os.getenv('PLANT_CARE_MEDIA_DIR', Path(__file__).resolve().parents[2] / 'media'))
PLANT_IMAGE_DIR = MEDIA_DIR / 'plant-images'

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS plant_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    moisture_value REAL,
    moisture_unit TEXT NOT NULL DEFAULT '%',
    image_path TEXT,
    image_captured_at TEXT,
    note TEXT,
    kind TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

SEED_ROWS = [
    ('weather-api', '2026-04-18 06:00', 71, '%', '06_00.jpg', '2026-04-18 06:00', 'Độ ẩm còn cao sau tưới đêm qua.', 'previous', '{"label":"Trước đó 3","state":"previous"}'),
    ('weather-api', '2026-04-18 09:00', 67, '%', '09_00.jpg', '2026-04-18 09:00', 'Độ ẩm giảm nhẹ khi trời bắt đầu nóng lên.', 'previous', '{"label":"Trước đó 2","state":"previous"}'),
    ('weather-api', '2026-04-18 12:00', 63, '%', '12_00.jpg', '2026-04-18 12:00', 'Độ ẩm tiếp tục giảm theo thời gian.', 'previous', '{"label":"Trước đó 1","state":"previous"}'),
    ('weather-api', '2026-04-18 15:00', 61, '%', '15_00.jpg', '2026-04-18 15:00', 'Mức độ ẩm hiện tại của đất.', 'current', '{"label":"Hiện tại","state":"current"}'),
    ('weather-api', '2026-04-18 18:00', 57, '%', '18_00.jpg', '2026-04-18 18:00', 'Nếu không tưới thêm, độ ẩm có thể giảm tiếp.', 'prediction', '{"label":"Dự đoán","state":"prediction"}'),
]


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_media_dirs():
    PLANT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def ensure_seed_image(file_name: str) -> str:
    ensure_media_dirs()
    destination = PLANT_IMAGE_DIR / file_name
    if not destination.exists():
        source = Path(__file__).resolve().parents[2] / 'static' / 'plant-placeholder.jpg'
        if source.exists():
            shutil.copyfile(source, destination)
        else:
            destination.write_bytes(b'')
    return str(destination)


def initialize_database():
    ensure_media_dirs()
    with get_connection() as conn:
        conn.execute(SCHEMA_SQL)
        count = conn.execute('SELECT COUNT(*) AS count FROM plant_observations').fetchone()['count']
        if count == 0:
            conn.executemany(
                '''
                INSERT INTO plant_observations
                (source, observed_at, moisture_value, moisture_unit, image_path, image_captured_at, note, kind, payload_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                [
                    (source, observed_at, moisture_value, moisture_unit, ensure_seed_image(image_path), image_captured_at, note, kind, payload_json)
                    for source, observed_at, moisture_value, moisture_unit, image_path, image_captured_at, note, kind, payload_json in SEED_ROWS
                ],
            )
        conn.commit()


def fetch_plant_observations():
    initialize_database()
    with get_connection() as conn:
        rows = conn.execute(
            '''
            SELECT id, source, observed_at, moisture_value, moisture_unit, image_path, image_captured_at, note, kind, payload_json, created_at
            FROM plant_observations
            ORDER BY observed_at ASC, id ASC
            '''
        ).fetchall()

    return [dict(row) for row in rows]


def insert_plant_observation(
    source: str,
    observed_at: str,
    moisture_value: float | None,
    moisture_unit: str,
    image_path: str | None,
    image_captured_at: str | None,
    note: str,
    kind: str,
    payload_json: str,
) -> dict | None:
    initialize_database()
    with get_connection() as conn:
        cursor = conn.execute(
            '''
            INSERT INTO plant_observations
            (source, observed_at, moisture_value, moisture_unit, image_path, image_captured_at, note, kind, payload_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                source,
                observed_at,
                moisture_value,
                moisture_unit,
                image_path,
                image_captured_at,
                note,
                kind,
                payload_json,
            ),
        )
        observation_id = cursor.lastrowid
        conn.commit()
        row = conn.execute(
            '''
            SELECT id, source, observed_at, moisture_value, moisture_unit, image_path, image_captured_at, note, kind, payload_json, created_at
            FROM plant_observations
            WHERE id = ?
            ''',
            (observation_id,),
        ).fetchone()
    return dict(row) if row else None


def fetch_plant_moisture_timeline() -> list[dict]:
    observations = fetch_plant_observations()
    timeline = []
    for item in observations:
        timeline.append({
            'label': 'unknown',
            'capturedAt': item['observed_at'],
            'value': item['moisture_value'],
            'unit': item['moisture_unit'],
            'note': item['note'],
            'state': item['kind'],
            'prediction': item['kind'] == 'prediction',
            'snapshot': {
                'url': item['image_path'],
                'capturedAt': item['image_captured_at'],
            },
            'source': item['source'],
            'payload': item.get('payload_json') or '{}',
        })
    return timeline


def fetch_plant_history_items() -> list[dict]:
    observations = fetch_plant_observations()
    history_items = []
    for item in observations:
        history_items.append({
            'title': item.get('kind', '-'),
            'date': item.get('observed_at', '-'),
            'details': item.get('note', ''),
            'imagePath': item.get('image_path'),
            'moistureValue': item.get('moisture_value'),
            'source': item.get('source'),
        })
    return history_items


def fetch_latest_snapshot() -> dict:
    observations = fetch_plant_observations()
    latest = None
    for item in observations:
        if item.get('image_path'):
            latest = item
    if not latest:
        return {
            'capturedAt': None,
            'imageUrl': '',
        }
    return {
        'capturedAt': latest.get('image_captured_at') or latest.get('observed_at'),
        'imageUrl': latest.get('image_path') or '',
    }


def fetch_camera_history_items() -> list[dict]:
    observations = fetch_plant_observations()
    items = []
    for item in observations:
        if not item.get('image_path'):
            continue
        source = (item.get('source') or '').lower()
        if source in {'human', 'manual', 'user'}:
            capture_type = 'human'
        elif 'auto' in source:
            capture_type = 'auto'
        else:
            capture_type = 'unknown'
        items.append({
            'id': item.get('id'),
            'title': item.get('kind', 'snapshot'),
            'capturedAt': item.get('image_captured_at') or item.get('observed_at'),
            'observedAt': item.get('observed_at'),
            'imageUrl': item.get('image_path'),
            'note': item.get('note', ''),
            'moistureValue': item.get('moisture_value'),
            'moistureUnit': item.get('moisture_unit'),
            'source': item.get('source'),
            'captureType': capture_type,
            'kind': item.get('kind'),
        })
    return items
