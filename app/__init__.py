from flask import Flask

from app.settings_manager import SettingsManager
from app.status_manager import StatusManager
from app.rpi_ws281x_manager import RPIWS281XManager

settings_manager = SettingsManager()
status_manager = StatusManager()
rpi_ws281x_manager = RPIWS281XManager()


def create_app():
    app = Flask(__name__)
    
    from .views import status_view, settings_view

    settings_manager.init_app(app, debug=True)
    rpi_ws281x_manager.init_app(app, debug=True)
    status_manager.init_app(app, debug=True)

    app.register_blueprint(status_view.bp)
    app.register_blueprint(settings_view.bp)

    #Run set_status_mode after the app is fully initialized
    @app.before_first_request
    def initialize_status_mode():
        app.status_manager.set_status_mode()

    return app
