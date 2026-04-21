OBSERVATION_TABLE = {
    "name": "plant_observations",
    "columns": [
        {"name": "id", "type": "INTEGER", "constraints": "PRIMARY KEY AUTOINCREMENT"},
        {"name": "received_at", "type": "TEXT", "constraints": "NOT NULL"},
        {"name": "temperature", "type": "REAL", "constraints": ""},
        {"name": "humidity", "type": "REAL", "constraints": ""},
        {"name": "weather", "type": "TEXT", "constraints": ""},
        {"name": "clouds", "type": "REAL", "constraints": ""},
        {"name": "wind_speed", "type": "REAL", "constraints": ""},
        {"name": "rain", "type": "REAL", "constraints": ""},
        {"name": "moisture", "type": "REAL", "constraints": ""},
        {"name": "image_url", "type": "TEXT", "constraints": ""},
        {"name": "source", "type": "TEXT", "constraints": "NOT NULL"},
        {"name": "note", "type": "TEXT", "constraints": ""},
    ],
}

OBSERVATION_TABLE_NAME = OBSERVATION_TABLE["name"]
OBSERVATION_FIELDS = [col["name"] for col in OBSERVATION_TABLE["columns"]]
OBSERVATION_SELECT_FIELDS = OBSERVATION_FIELDS


def field_key(name: str) -> str:
    if name not in OBSERVATION_FIELDS:
        raise ValueError(f"Unknown observation field: {name}")
    return name


OBSERVATION_SCHEMA = {
    "fields": [
        {"key": field_key("received_at"), "label": "Thời gian cập nhật", "format": "datetime", "summary": True},
        {"key": field_key("moisture"), "label": "Độ ẩm đất", "format": "percent", "summary": True},
        {"key": field_key("temperature"), "label": "Nhiệt độ", "format": "celsius", "summary": True},
        {"key": field_key("humidity"), "label": "Độ ẩm không khí", "format": "percent"},
        {"key": field_key("weather"), "label": "Thời tiết", "format": "text"},
        {"key": field_key("clouds"), "label": "Mây", "format": "percent"},
        {"key": field_key("wind_speed"), "label": "Gió", "format": "wind"},
        {"key": field_key("rain"), "label": "Mưa", "format": "rain"},
        {"key": field_key("image_url"), "label": "Ảnh", "format": "image"},
        {"key": field_key("source"), "label": "Nguồn", "format": "source"},
        {"key": field_key("note"), "label": "Ghi chú", "format": "text"},
    ],
    "list_fields": [
        field_key("received_at"),
        field_key("moisture"),
        field_key("note"),
        field_key("source"),
    ],
}
