from flask import Flask

from app.settings_manager import SettingsManager
from app.status_manager import StatusManager
from app.rpi_ws281x_manager import RPIWS281XManager
from app.ina219_manager import INA219Manager

settings_manager = SettingsManager()
status_manager = StatusManager()
rpi_ws281x_manager = RPIWS281XManager()
ina219_manager = INA219Manager()


def create_app():
    app = Flask(__name__)
    
    from .views import status_view, settings_view, battery_view

    settings_manager.init_app(app, debug=True)
    rpi_ws281x_manager.init_app(app, debug=True)
    status_manager.init_app(app, debug=True)
    ina219_manager.init_app(app, addr=0x43, debug=True)

    app.register_blueprint(status_view.bp)
    app.register_blueprint(settings_view.bp)
    app.register_blueprint(battery_view.bp)

    return app
