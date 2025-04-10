import json
import os
from flask import current_app
from app.models.app_settings import AppSettings
from app.models.status import Status

class SettingsManager:
    def __init__(self):
        self.debug = False
    
    def init_app(self, app, **kwargs):
        print("Initializing SettingsManager")
        app.settings_manager = self
        self.debug = kwargs.get('debug', self.debug)

    def get_settings(self):
        # Construct the absolute path to the JSON file
        file_path = os.path.join(os.path.dirname(__file__), 'app_settings.json')
    
        if self.debug:
            print(f"Looking for app_settings.json at: {file_path}")

        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                if self.debug:
                    print(f"Loaded app settings: {data}")

                # Convert each status dictionary into a Status object
                app_settings = AppSettings()
                app_settings.brightness = data.get("brightness", 0)
                app_settings.statuses = [Status(**status) for status in data.get("statuses", [])]
                
                return app_settings
        except FileNotFoundError:
            if self.debug:
                print(f"app_settings.json file not found at: {file_path}")
            return []
        except json.JSONDecodeError as e:
            if self.debug:
                print(f"Error decoding JSON: {e}")
            return []
        
    def update_settings(self, settings):
        if self.debug:
            print(f"Updating settings: {settings}")

        file_path = os.path.join(os.path.dirname(__file__), 'app_settings.json')

        try:
            with open(file_path, 'w') as file:
                json.dump(settings, file)
        except Exception as e:
            if self.debug:
                print(f"Error updating statuses: {e}")
            raise