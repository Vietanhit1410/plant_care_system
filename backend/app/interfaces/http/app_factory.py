from flask import Flask, send_from_directory
from flask_cors import CORS

from backend.app.infrastructure.sqlite_repository import ObservationRepository
from backend.app.infrastructure.weather_provider import get_current_weather
from backend.app.interfaces.http.routes import build_blueprints


def create_app() -> Flask:
    repo = ObservationRepository()
    repo.initialize()

    app = Flask(__name__)
    CORS(app)

    @app.get("/media/<path:filename>")
    def media_file(filename: str):
        return send_from_directory(repo.media_dir, filename)

    deps = {
        "repo": repo,
        "weather_provider": lambda: get_current_weather(repo.default_lat, repo.default_lon),
        "image_dir": repo.image_dir,
    }
    for bp in build_blueprints(deps):
        app.register_blueprint(bp)

    return app
