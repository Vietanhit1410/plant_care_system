from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from backend.core.database import initialize_database
from backend.features.camera_snapshot.routes import camera_snapshot_bp
from backend.features.current_status.routes import current_status_bp
from backend.features.environment.routes import environment_bp
from backend.features.plant_history.routes import plant_history_bp
from backend.features.plant_moisture.routes import plant_moisture_bp
from backend.features.sensor_ingest.routes import sensor_ingest_bp

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(environment_bp)
    app.register_blueprint(current_status_bp)
    app.register_blueprint(plant_history_bp)
    app.register_blueprint(camera_snapshot_bp)
    app.register_blueprint(plant_moisture_bp)
    app.register_blueprint(sensor_ingest_bp)
    initialize_database()
    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True)
