from flask import Flask
from flask_cors import CORS

from backend.app.infrastructure.sqlite_repository import ObservationRepository
from backend.app.infrastructure.weather_provider import get_current_weather
from backend.app.interfaces.http.routes import build_blueprints


def create_app() -> Flask:
    repo = ObservationRepository()
    repo.initialize()

    app = Flask(__name__)
    CORS(app)

    deps = {
        "repo": repo,
        "weather_provider": lambda: get_current_weather(repo.default_lat, repo.default_lon),
        "image_dir": repo.image_dir,
    }
    for bp in build_blueprints(deps):
        app.register_blueprint(bp)

    return app
