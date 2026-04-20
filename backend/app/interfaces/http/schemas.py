from backend.app.domain.observation_schema import OBSERVATION_SCHEMA

ENVIRONMENT_SCHEMA = {
    "fields": [
        {"key": "weather", "label": "Thời tiết", "format": "text", "summary": True},
        {"key": "humidity", "label": "Độ ẩm không khí", "format": "percent", "summary": True},
        {"key": "temperature", "label": "Nhiệt độ", "format": "celsius", "summary": True},
        {"key": "clouds", "label": "Mây", "format": "percent"},
        {"key": "wind_speed", "label": "Gió", "format": "wind"},
        {"key": "rain", "label": "Mưa", "format": "rain"},
        {"key": "timestamp", "label": "Cập nhật", "format": "timestamp"},
        {"key": "source", "label": "Nguồn", "format": "text"},
    ]
}
