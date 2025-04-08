import json
import os
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
        # Construct the absolute path to the JSON file
        file_path = os.path.join(os.path.dirname(__file__), 'status_settings.json')
    
        if self.debug:
            print(f"Looking for status_settings.json at: {file_path}")

        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                if self.debug:
                    print(f"Loaded status settings: {data}")
                # Convert each status dictionary into a Status object
                return [Status(**status) for status in data.get("statuses", None).get("statuses", [])]
        except FileNotFoundError:
            if self.debug:
                print(f"status_settings.json file not found at: {file_path}")
            return []
        except json.JSONDecodeError as e:
            if self.debug:
                print(f"Error decoding JSON: {e}")
            return []

    def get_available_status_by_id(self, status_id):
        # Retrieve the list of available statuses
        available_statuses = self.get_available_statuses()
        
        # Find the status with the matching id
        status = next((s for s in available_statuses if str(s.id) == str(status_id)), None)

        if self.debug:
            print(f"Available statuses: {available_statuses}")
            print(f"Requested status ID: {status_id}, Found: {status}")

        if status:
            return status
        else:
            raise ValueError(f"Status with id {status_id} not found")
        
    def update_statuses(self, statuses):
        if self.debug:
            print(f"Updating statuses: {statuses}")

        file_path = os.path.join(os.path.dirname(__file__), 'status_settings.json')

        try:
            with open(file_path, 'w') as file:
                json.dump({"statuses": statuses}, file)
        except Exception as e:
            if self.debug:
                print(f"Error updating statuses: {e}")
            raise