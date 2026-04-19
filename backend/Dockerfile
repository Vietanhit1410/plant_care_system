FROM python:3.10-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn backend vào
COPY . .

# Chạy server bằng Gunicorn (Chuẩn cho Production, không dùng Flask development server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:create_app()"]
