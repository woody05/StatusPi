import json
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
        except Exception as e:
            if self.debug:
                print(f"Error setting status: {e}")
            raise

    def get_available_statuses(self):
        # Read statuses from the JSON file
        print(self.debug)
        try:
            with open('status_settings.json', 'r') as file:
                data = json.load(file)
                print(f"Loaded status settings: {data}")
                return [Status(**status) for status in data.get("statuses", [])]
        except FileNotFoundError:
            if self.debug:
                print("status_settings.json file not found.")
            return []
        except json.JSONDecodeError as e:
            if self.debug:
                print(f"Error decoding JSON: {e}")
            return []

    def get_available_status_by_id(self, status_id):
        available_statuses = self.get_available_statuses()
        status = next((s for s in available_statuses if s.id == status_id), None)

        print(f"Available statuses: {available_statuses}")

        if status:
            return status
        else:
            raise ValueError(f"Status with id {status_id} not found")