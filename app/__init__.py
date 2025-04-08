from flask import Flask

from app.status_manager import StatusManager
from app.rpi_ws281x_manager import RPIWS281XManager

status_manager = StatusManager()
rpi_ws281x_manager = RPIWS281XManager()


def create_app():
    app = Flask(__name__)
    
    from .views import status_view

    status_manager.init_app(app)
    rpi_ws281x_manager.init_app(app, debug=True)

    app.register_blueprint(status_view.bp)

    return app
