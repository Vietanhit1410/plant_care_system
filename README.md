# Plant Care System

## Mục tiêu

Dashboard + API để lưu và xem trạng thái cây, độ ẩm đất, dữ liệu môi trường.

## Kiến trúc

- Backend Clean Architecture: `backend/app` (domain / application / infrastructure / interfaces)
- Frontend schema-driven: `frontend/public/js/core/schema_renderer.js`

## Cấu hình trường dữ liệu

- Nguồn duy nhất: `backend/app/domain/observation_schema.py`
- Khi thêm field: cập nhật file này, UI tự render theo schema.

## Chạy nhanh

```powershell
D:\Dreamer\python\plant_care_system\.venv\Scripts\python.exe D:\Dreamer\python\plant_care_system\backend\run.py
```

```powershell
start D:\Dreamer\python\plant_care_system\frontend\public\index.html
```

Tài liệu ngắn: `SYSTEM_SPEC.md`
