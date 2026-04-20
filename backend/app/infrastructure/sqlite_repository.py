import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

from backend.app.domain.observation_schema import (
    OBSERVATION_FIELDS,
    OBSERVATION_TABLE,
    OBSERVATION_TABLE_NAME,
)

DB_PATH = Path(os.getenv("PLANT_CARE_SQLITE_PATH", Path(__file__).resolve().parents[3] / "plant_care_system.sqlite3"))
MEDIA_DIR = Path(os.getenv("PLANT_CARE_MEDIA_DIR", Path(__file__).resolve().parents[3] / "media"))
PLANT_IMAGE_DIR = MEDIA_DIR / "plant-images"


def _build_schema_sql() -> str:
    column_defs = []
    for column in OBSERVATION_TABLE["columns"]:
        parts = [column["name"], column["type"]]
        if column.get("constraints"):
            parts.append(column["constraints"])
        column_defs.append(" ".join(parts))
    columns_sql = ",\n    ".join(column_defs)
    return f"""
CREATE TABLE IF NOT EXISTS {OBSERVATION_TABLE['name']} (
    {columns_sql}
);
"""


SCHEMA_SQL = _build_schema_sql()

SEED_ROWS = [
    ("system", "2026-04-18 06:00", 71, 24.8, 78, "Nhiều mây", 70, 2.5, 0.0, "06_00.jpg", "Độ ẩm còn cao sau tưới đêm qua."),
    ("system", "2026-04-18 09:00", 67, 27.2, 72, "Ít mây", 35, 3.1, 0.0, "09_00.jpg", "Độ ẩm giảm nhẹ khi trời bắt đầu nóng lên."),
    ("system", "2026-04-18 12:00", 63, 30.1, 65, "Nắng nhẹ", 20, 3.8, 0.0, "12_00.jpg", "Độ ẩm tiếp tục giảm theo thời gian."),
    ("system", "2026-04-18 15:00", 61, 31.4, 60, "Nắng", 15, 4.2, 0.0, "15_00.jpg", "Mức độ ẩm hiện tại của đất."),
    ("system", "2026-04-18 18:00", 57, 29.0, 68, "Nhiều mây", 55, 2.9, 0.2, "18_00.jpg", "Nếu không tưới thêm, độ ẩm có thể giảm tiếp."),
]


class ObservationRepository:
    def __init__(self, db_path: Path | None = None, media_dir: Path | None = None) -> None:
        self.db_path = db_path or DB_PATH
        self.media_dir = media_dir or MEDIA_DIR
        self.image_dir = self.media_dir / "plant-images"
        self.default_lat = float(os.getenv("OPENWEATHER_LAT", "21.0285"))
        self.default_lon = float(os.getenv("OPENWEATHER_LON", "105.8542"))

    def _get_connection(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_seed_image(self, file_name: str) -> str:
        self.image_dir.mkdir(parents=True, exist_ok=True)
        destination = self.image_dir / file_name
        if not destination.exists():
            source = Path(__file__).resolve().parents[3] / "static" / "plant-placeholder.jpg"
            if source.exists():
                shutil.copyfile(source, destination)
            else:
                destination.write_bytes(b"")
        return str(destination)

    @staticmethod
    def _table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
        row = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
        ).fetchone()
        return row is not None

    @staticmethod
    def _get_table_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
        return {row["name"] for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()}

    @staticmethod
    def _column_expr(existing: set[str], options: list[str], default_expr: str) -> str:
        for name in options:
            if name in existing:
                return name
        return default_expr

    def _migrate_schema(self, conn: sqlite3.Connection) -> None:
        existing = self._get_table_columns(conn, OBSERVATION_TABLE_NAME)
        desired = set(OBSERVATION_FIELDS)
        if existing == desired:
            return

        conn.execute(f"DROP TABLE IF EXISTS {OBSERVATION_TABLE_NAME}_new")
        conn.execute(
            f"""
            CREATE TABLE {OBSERVATION_TABLE_NAME}_new (
                {', '.join([f"{col['name']} {col['type']}{(' ' + col['constraints']) if col.get('constraints') else ''}" for col in OBSERVATION_TABLE['columns']])}
            );
            """
        )

        defaults = {
            "received_at": "CURRENT_TIMESTAMP",
            "source": "'system'",
        }
        legacy_aliases = {
            "received_at": ["received_at", "observed_at", "created_at"],
            "moisture": ["moisture", "moisture_value"],
            "image_url": ["image_url", "image_path"],
        }

        select_fields = OBSERVATION_FIELDS
        select_exprs = []
        for field in select_fields:
            candidates = legacy_aliases.get(field, [field])
            expr = self._column_expr(existing, candidates, "NULL")
            if field in defaults:
                expr = f"COALESCE({expr}, {defaults[field]})"
            select_exprs.append(expr)

        conn.execute(
            f"""
            INSERT INTO {OBSERVATION_TABLE_NAME}_new
            ({', '.join(select_fields)})
            SELECT
                {', '.join(select_exprs)}
            FROM {OBSERVATION_TABLE_NAME}
            """
        )

        conn.execute(f"DROP TABLE {OBSERVATION_TABLE_NAME}")
        conn.execute(f"ALTER TABLE {OBSERVATION_TABLE_NAME}_new RENAME TO {OBSERVATION_TABLE_NAME}")

    def initialize(self) -> None:
        self.media_dir.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            if not self._table_exists(conn, OBSERVATION_TABLE_NAME):
                conn.execute(SCHEMA_SQL)
            else:
                self._migrate_schema(conn)

            insert_fields = [name for name in OBSERVATION_FIELDS if name != "id"]
            count = conn.execute(f"SELECT COUNT(*) AS count FROM {OBSERVATION_TABLE_NAME}").fetchone()["count"]
            if count == 0:
                conn.executemany(
                    f"""
                    INSERT INTO {OBSERVATION_TABLE_NAME}
                    ({', '.join(insert_fields)})
                    VALUES ({', '.join(['?'] * len(insert_fields))})
                    """,
                    [
                        (
                            source,
                            received_at,
                            moisture,
                            temperature,
                            humidity,
                            weather,
                            clouds,
                            wind_speed,
                            rain,
                            self._ensure_seed_image(image_url),
                            note,
                        )
                        for source, received_at, moisture, temperature, humidity, weather, clouds, wind_speed, rain, image_url, note in SEED_ROWS
                    ],
                )
            conn.commit()

    def list_observations(self) -> list[dict]:
        select_fields = OBSERVATION_FIELDS
        with self._get_connection() as conn:
            rows = conn.execute(
                f"""
                SELECT {', '.join(select_fields)}
                FROM {OBSERVATION_TABLE_NAME}
                ORDER BY received_at ASC, id ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def get_latest_observation(self) -> dict | None:
        select_fields = OBSERVATION_FIELDS
        with self._get_connection() as conn:
            row = conn.execute(
                f"""
                SELECT {', '.join(select_fields)}
                FROM {OBSERVATION_TABLE_NAME}
                ORDER BY received_at DESC, id DESC
                LIMIT 1
                """
            ).fetchone()
        return dict(row) if row else None

    def save_observation(self, payload: dict) -> dict | None:
        insert_fields = [name for name in OBSERVATION_FIELDS if name != "id"]
        received_at = payload.get("received_at") or datetime.now().isoformat(timespec="seconds")
        insert_payload = {"received_at": received_at, **payload}
        values = [insert_payload.get(field) for field in insert_fields]
        with self._get_connection() as conn:
            cursor = conn.execute(
                f"""
                INSERT INTO {OBSERVATION_TABLE_NAME}
                ({', '.join(insert_fields)})
                VALUES ({', '.join(['?'] * len(insert_fields))})
                """,
                values,
            )
            observation_id = cursor.lastrowid
            conn.commit()
            row = conn.execute(
                f"""
                SELECT {', '.join(OBSERVATION_FIELDS)}
                FROM {OBSERVATION_TABLE_NAME}
                WHERE id = ?
                """,
                (observation_id,),
            ).fetchone()
        return dict(row) if row else None
