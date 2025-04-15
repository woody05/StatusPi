import json
import os
import time
from flask import current_app
from app.models.status import Status

BLANK_COLOR = 'rgb(0, 0, 0)'  # Default color for blank status
DEFAULT_FLASH_INTERVAL = 0.5  # Interval in seconds for flashing status

class StatusManager:
    def __init__(self, settings_manager=None):
        self.status = None
        self.debug = False
        self.settings_manager = settings_manager  # Injected dependency
        self.is_flashing = False

    def init_app(self, app, settings_manager, **kwargs):
        app.status_manager = self
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = settings_manager

        # Set the default status
        self.status = self.get_available_status_by_id(1)

    def set_status(self, status):
        try:
            self.status = status
            current_app.rpi_ws281x_manager.set_color(self.status.color)
        except Exception as e:
            if self.debug:
                print(f"Error setting status: {e}")
            raise

    def get_available_statuses(self):
        if not self.settings_manager:
            raise RuntimeError("SettingsManager is not initialized!")

        available_statuses = self.settings_manager.get_settings().statuses
        if self.debug:
            print(f"Available statuses: {available_statuses}")
        return available_statuses

    def get_available_status_by_id(self, status_id):
        available_statuses = self.get_available_statuses()
        status = next((s for s in available_statuses if str(s.id) == str(status_id)), None)

        if self.debug:
            print(f"Available statuses: {available_statuses}")
            print(f"Requested status ID: {status_id}, Found: {status}")

        if status:
            return status
        else:
            raise ValueError(f"Status with id {status_id} not found")
        
    def set_brightness(self, brightness):
        try:
            if self.debug:
                print(f"Setting brightness to {brightness}")
            current_app.rpi_ws281x_manager.set_brightness(brightness)
        except Exception as e:
            if self.debug:
                print(f"Error setting brightness: {e}")
            raise

    def set_flashing_status(self):

        flashing_intervals = self.settings_manager.get_settings().flashing_intervals

        if not flashing_intervals:
            flashing_intervals = DEFAULT_FLASH_INTERVAL

        try:
            self.is_flashing = True
            while self.is_flashing:
                # Flashing logic here

                if self.debug:
                    print(f"Flashing status: {self.status.color}")

                current_app.rpi_ws281x_manager.set_color(BLANK_COLOR)

                time.sleep(flashing_intervals)

                current_app.rpi_ws281x_manager.set_color(self.status.color)

                time.sleep(flashing_intervals)

        except Exception as e:
            if self.debug:
                print(f"Error setting flashing status: {e}")
            raise

    def stop_flashing(self):
        self.is_flashing = False