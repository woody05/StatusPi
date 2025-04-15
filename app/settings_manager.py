import json
import os
from app.models.app_settings import AppSettings
from app.models.status import Status

#TODO: Add a version to the settings file
DEFAULT_SETTINGS_V1 = AppSettings(
            brightness=20,
            statuses=[
                Status(id=1, name="Available", color="rgb(0, 255, 0)"),
                Status(id=2, name="Away", color="rgb(255, 255, 0)"),
                Status(id=3, name="Busy", color="rgb(255, 0, 0)"),
            ],
            version=1
        )

class SettingsManager:
    def __init__(self):
        self.debug = False
    
    def init_app(self, app, **kwargs):
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
                app_settings.version = data.get("version", 1)
                app_settings.flashing_intervals = float(data.get("flashing_intervals", 0.5))
                
                return app_settings
        except FileNotFoundError:

            if self.debug:
                print(f"app_settings.json file not found at: {file_path}")

            # If the file is not found, create it with default settings
            if self.debug:
                print("Creating default settings file.")

            self.update_settings(DEFAULT_SETTINGS_V1)

            return DEFAULT_SETTINGS_V1
        
        except json.JSONDecodeError as e:
            if self.debug:
                print(f"Error decoding JSON: {e}")

            # If the JSON is corrupted, create a backup and return default settings
            self._create_backup_of_corrupted_settings(file_path)

            # Return default settings
            return DEFAULT_SETTINGS_V1
        
    def update_settings(self, settings):
        if self.debug:
            print(f"Updating settings: {settings}")

        file_path = os.path.join(os.path.dirname(__file__), 'app_settings.json')

        try:
            # Ensure settings is an instance of AppSettings
            if not isinstance(settings, AppSettings):
                settings = self._convert_to_app_settings(settings)

            settings_dict = settings.to_dict()

            if self.debug:
                print(f"Settings to save: {settings_dict}")

            with open(file_path, 'w') as file:
                json.dump(settings_dict, file)
        except Exception as e:
            if self.debug:
                print(f"Error updating settings: {e}")
            raise

    def _convert_to_app_settings(self, settings):
        try:
            return AppSettings(
                brightness=settings["brightness"],
                statuses=[Status(**status) for status in settings["statuses"]],
                version=settings["version"],
                flashing_intervals=settings["flashing_intervals"]
            )
        except KeyError as e:
            raise ValueError(f"Missing required setting: {e}")
        except Exception as e:
            raise ValueError(f"Failed to parse settings: {e}")

    def _create_backup_of_corrupted_settings(self, file_path):
        # Make a backup of the bad JSON file
        backup_file_path = file_path + ".corrupted_settings_backup"
        try:
            os.rename(file_path, backup_file_path)
            if self.debug:
                print(f"Corrupted settings file backed up to: {backup_file_path}")
        except Exception as backup_error:
            if self.debug:
                print(f"Failed to create backup of corrupted settings file: {backup_error}")