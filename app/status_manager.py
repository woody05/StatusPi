
from flask import current_app
from app.models.status import Status

class StatusManager:
    def __init__(self):
        self.status = None
        self.debug = False
    
    def init_app(self, app, **kwargs):
        app.status_manager = self
        self.debug = kwargs.get('debug', self.debug)

        self.status = self.get_available_status_by_id(1)  # Default status

    def set_status(self, status):
        try:
            self.status = status
            current_app.rpi_ws281x_manager.set_color(self.status.color)
        except e:
            if self.debug:
                print(f"Error setting status: {e}")
            raise

    def get_available_statuses(self):

        # TODO: Replace with parsing JSON file for statuses
        return [
            Status(id=1, name="Available", color="(0, 255, 0)"),
            Status(id=2, name="Away", color="(255, 255, 0)"),
            Status(id=3, name="Busy", color="(255, 0, 0)"),
        ]
    
    def get_available_status_by_id(self, status_id):
        available_statuses = self.get_available_statuses()
        status = next((s for s in available_statuses if s.id == status_id), None)

        if status:
            return status
        else:
            raise ValueError(f"Status with id {status_id} not found")