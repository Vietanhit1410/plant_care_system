import os

class Config:
    # Lấy DATABASE_URL do Docker truyền vào, nếu không có thì fallback về localhost (để dev không dùng docker)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/mydb')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-key')
