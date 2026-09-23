import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from app.settings_manager import SettingsManager
from app.status_manager import StatusManager
from app.rpi_ws281x_manager import RPIWS281XManager
from app.ina219_manager import INA219Manager
from app.logger import Logger
from app.log_reader import LogReader
from app.database.settings_models import db
from app.database.db_manager import DatabaseManager


def create_app():
    app = Flask(__name__)

    app.config['APP_ENV'] = os.getenv('APP_ENV', 'development')
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app_settings.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    isBatteryEnabled = os.getenv("BATTERY", False)
    logDb = os.getenv("LOG_DB")

    # Instantiate managers inside the factory
    settings_manager = SettingsManager()
    status_manager = StatusManager()
    rpi_ws281x_manager = RPIWS281XManager()
    logger = Logger()
    log_reader = LogReader()

    # Initialize extensions with app
    db.init_app(app)

    with app.app_context():
        from app.database.settings_models import SettingsGroup, SettingsModel
        db.create_all()
        DatabaseManager.seed_database()

    logger.init_app(app, logDb)
    settings_manager.init_app(app, debug=True)
    rpi_ws281x_manager.init_app(app, debug=True)
    status_manager.init_app(app, debug=True)
    log_reader.init_app(app, logDb)

    # Register blueprints
    from .views import status_view, settings_view, battery_view
    app.register_blueprint(status_view.bp)
    #app.register_blueprint(settings_view.bp)

    from .api import api_status_view, api_mode_view, api_brightness_view, api_settings_view, api_logs_view
    app.register_blueprint(api_status_view.bp)
    app.register_blueprint(api_mode_view.bp)
    app.register_blueprint(api_brightness_view.bp)
    app.register_blueprint(api_settings_view.bp, url_prefix="/api")
    app.register_blueprint(api_logs_view.bp)

    # Ensure models are loaded BEFORE db.create_all() executes


    # if isBatteryEnabled:
    #     ina219_manager = INA219Manager()
    #     ina219_manager.init_app(app, addr=0x43, debug=True)
    #     app.register_blueprint(battery_view.bp)

    return app