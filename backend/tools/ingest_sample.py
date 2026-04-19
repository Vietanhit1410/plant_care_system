import os
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(repo_root))

os.environ.setdefault(
    "PLANT_TIMELINE_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "timeline.sample.json")
)

import json
from datetime import datetime

from backend.features.plant_moisture.service import write_timeline_cache, update_timeline_cache_with_observation


def main():
    seed_item = {
        "label": "Hiện tại",
        "capturedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "value": 60.0,
        "unit": "%",
        "note": "Dữ liệu mẫu trước khi nhận gói tin mới.",
        "state": "current",
        "prediction": False,
        "snapshot": None,
        "source": "sample",
        "payload": json.dumps({"sample": True}),
    }
    write_timeline_cache([seed_item])

    observation = {
        "id": 0,
        "source": "sensor",
        "observed_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "moisture_value": 58.0,
        "moisture_unit": "%",
        "image_path": None,
        "image_captured_at": None,
        "note": "Gói tin mẫu từ cảm biến.",
        "kind": "current",
        "payload_json": json.dumps({"sample": True}),
    }

    timeline = update_timeline_cache_with_observation(observation, {"data": {"temperature": 30}})
    print(f"Updated timeline size: {len(timeline)}")
    print("Cache file:", os.environ["PLANT_TIMELINE_CACHE_PATH"])


if __name__ == "__main__":
    main()
