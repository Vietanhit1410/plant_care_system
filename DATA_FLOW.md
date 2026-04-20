# Data Flow Reference

Muc tieu: tong hop toan bo widget/giao dien, file UI lay du lieu, va luong du lieu qua tung truong hop.

## 1) Tong quan widget/giao dien

| Widget/Giao dien | File UI | API/nguon du lieu | Du lieu chinh |
| --- | --- | --- | --- |
| Thoi tiet (Environment) | `frontend/public/js/features/environment.js` | `GET /api/environment/current` | `temperature`, `humidity`, `weather`, `clouds`, `wind_speed`, `rain`, `timestamp`, `source` |
| Trang thai cay (Current Status) | `frontend/public/js/features/current_status.js` | `GET /api/current_status` | `received_at`, `moisture`, `temperature`, `humidity`, `weather`, `clouds`, `wind_speed`, `rain`, `image_url`, `source`, `note` |
| Timeline do am dat | `frontend/public/js/features/plant_timeline.js` | `GET /api/plant_timeline/current` | `timeline[]` (items), `snapshot`, `value`, `unit`, `source`, `capturedAt` |
| Lich su cay (Modal) | `frontend/public/js/features/plant_history.js` | `GET /api/plant_history` | `items[]` tu observations |
| Camera snapshot | `frontend/public/js/features/camera_snapshot.js` | `GET /api/camera_snapshot/capture` | `imageUrl`, `capturedAt` |
| Thong bao | `frontend/public/js/features/notifications.js` | `GET /api/notifications/list` (neu co) | `items[]` (mock/placeholder) |

## 2) Dinh nghia schema dong

- Schema dong duoc tra ve tu API va UI render theo `frontend/public/js/core/schema_renderer.js`.
- Nguon schema duy nhat: `backend/app/domain/observation_schema.py`.
- Tung widget co the chi dinh truong can hien thi bang `summaryFieldKeys`, `detailFieldKeys`, `listFieldKeys` trong file UI.

## 3) Luong du lieu chi tiet theo truong hop

### 3.1. Trang thai cay hien tai

**UI**
- File: `frontend/public/js/features/current_status.js`
- Go API: `GET /api/current_status`
- Render: `renderSchemaCard()` tu `schema_renderer.js`

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `current_status()`
- Use-case: `backend/app/application/plant_use_cases.py` -> `get_current_status(repo)`
- Repository: `backend/app/infrastructure/sqlite_repository.py` -> `get_latest_observation()`

**DB**
- Table: `plant_observations`
- Fields lay: `received_at`, `moisture`, `temperature`, `humidity`, `weather`, `clouds`, `wind_speed`, `rain`, `image_url`, `source`, `note`

### 3.2. Timeline do am dat

**UI**
- File: `frontend/public/js/features/plant_timeline.js`
- Go API: `GET /api/plant_timeline/current`
- Render timeline + popup chi tiet

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `current_timeline()`
- Use-case: `backend/app/application/plant_use_cases.py` -> `get_timeline(repo)`
- Cache: `timeline.json` trong `backend/app/application/` (duong dan qua env `PLANT_TIMELINE_CACHE_PATH`)

**DB**
- Neu cache khong co, lay tu `repo.list_observations()`
- Tao timeline items tu observations

### 3.3. Lich su cay (modal)

**UI**
- File: `frontend/public/js/features/plant_history.js`
- Go API: `GET /api/plant_history`
- Render danh sach dong theo schema list_fields

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `plant_history()`
- Use-case: `backend/app/application/plant_use_cases.py` -> `list_history(repo)`
- Repository: `sqlite_repository.py` -> `list_observations()`

### 3.4. Thoi tiet hien tai

**UI**
- File: `frontend/public/js/features/environment.js`
- Go API: `GET /api/environment/current`
- Render: `renderSchemaCard()`

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `environment_current()`
- Infra: `backend/app/infrastructure/weather_provider.py` -> `get_current_weather()`
- Cache: `weather_cache.json` (duong dan qua env)

### 3.5. Camera snapshot

**UI**
- File: `frontend/public/js/features/camera_snapshot.js`
- Go API: `GET /api/camera_snapshot/capture`

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `camera_snapshot_capture()`
- Infra: `backend/app/infrastructure/camera_client.py` -> `capture_snapshot()`

### 3.6. Sensor ingest (ghi du lieu moi)

**Client**
- API: `POST /api/sensor/ingest`
- Payload: `moisture`, `note`, `source`, `image` (file) hoac `image_base64`

**API**
- Route: `backend/app/interfaces/http/routes.py` -> `sensor_ingest()`
- Use-case: `backend/app/application/plant_use_cases.py` -> `ingest_observation(...)`

**Infra**
- Image: `backend/app/infrastructure/image_storage.py`
- Weather: `backend/app/infrastructure/weather_provider.py`

**DB**
- Save vao `plant_observations`
- Sau do update timeline cache

## 4) File UI lay du lieu

| File UI | Ham load | API |
| --- | --- | --- |
| `frontend/public/js/features/environment.js` | `loadEnvironment()` | `GET /api/environment/current` |
| `frontend/public/js/features/current_status.js` | `loadCurrentStatus()` | `GET /api/current_status` |
| `frontend/public/js/features/plant_timeline.js` | `loadPlantTimeline()` | `GET /api/plant_timeline/current` |
| `frontend/public/js/features/plant_history.js` | `loadPlantHistory()` | `GET /api/plant_history` |
| `frontend/public/js/features/camera_snapshot.js` | `captureCameraSnapshot()` | `GET /api/camera_snapshot/capture` |
| `frontend/public/js/features/notifications.js` | `loadNotifications()` | `GET /api/notifications/list` (neu co) |

## 5) Cho phep them truong moi

- Chi can cap nhat `backend/app/domain/observation_schema.py`:
  - them column trong `OBSERVATION_TABLE`
  - them field trong `OBSERVATION_SCHEMA`
- UI tu dong render theo schema, khong can sua tung file UI.
- Neu muon an/hien theo widget, cap nhat danh sach field trong file UI tuong ung (vi du: `current_status.js`, `environment.js`).
