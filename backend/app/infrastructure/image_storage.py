import base64
from datetime import datetime
from pathlib import Path

from werkzeug.utils import secure_filename


def _file_timestamp(value: str | None) -> str:
    if not value:
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M").strftime("%Y%m%d_%H%M%S")
    except ValueError:
        return datetime.now().strftime("%Y%m%d_%H%M%S")


def save_upload_file(file_storage, received_at: str, image_dir: Path) -> str:
    image_dir.mkdir(parents=True, exist_ok=True)
    filename = secure_filename(file_storage.filename or "")
    if not filename:
        filename = f"sensor_{_file_timestamp(received_at)}.jpg"
    destination = image_dir / filename
    file_storage.save(destination)
    return str(destination)


def save_base64_image(image_base64: str, received_at: str, filename: str | None, image_dir: Path) -> str:
    image_dir.mkdir(parents=True, exist_ok=True)
    base64_value = image_base64.strip()
    extension = "jpg"
    if base64_value.startswith("data:") and "," in base64_value:
        header, base64_value = base64_value.split(",", 1)
        if "/" in header:
            extension = header.split("/")[-1].split(";")[0] or extension
    image_bytes = base64.b64decode(base64_value)
    safe_name = secure_filename(filename or "")
    if not safe_name:
        safe_name = f"sensor_{_file_timestamp(received_at)}.{extension}"
    destination = image_dir / safe_name
    Path(destination).write_bytes(image_bytes)
    return str(destination)
