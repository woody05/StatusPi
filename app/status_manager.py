from enum import Enum
import threading
import time
from flask import current_app
from app.models.status import Status

BLANK_COLOR = 'rgb(0, 0, 0)'  # Default color for blank status
DEFAULT_FLASH_INTERVAL = 0.5  # Interval in seconds for flashing status
DEFAULT_WAVE_INTERVAL = 0.08  # Interval in seconds for wave status

class Mode(Enum):
    SOLID = 1
    FLASHING = 2
    WAVE = 3

class StatusManager:
    def __init__(self, settings_manager=None):
        self.status = None
        self.debug = False
        self.settings_manager = settings_manager  # Injected dependency
        self.mode = Mode.SOLID
        self.flashing_intervals = self.settings_manager.get_settings().flashing_intervals if settings_manager else DEFAULT_FLASH_INTERVAL
        self.wave_intervals = DEFAULT_WAVE_INTERVAL  #TODO: make configurable  # Interval in seconds for wave status

        self.status_mode_task_thread = None
        self.status_mode_task_stop_event = threading.Event()

    def init_app(self, app, settings_manager, **kwargs):
        app.status_manager = self
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = settings_manager

        # Set the default status
        self.status = self.get_available_status_by_id(1)
        #set default mode
        self.set_status_mode(self.mode)

    def _stop_status_mode_task(self):
         # if we have a task running, stop it
        if self.status_mode_task_thread and self.status_mode_task_thread.is_alive():
            self.status_mode_task_stop_event.set()
            if threading.current_thread() != self.status_mode_task_thread:
                self.status_mode_task_thread.join()

        current_app.rpi_ws281x_manager.set_color(BLANK_COLOR)

    def status_mode_background_task(self, action):
        while not self.status_mode_task_stop_event.is_set():
            action()

    def set_status(self, status):
        try:
            self.status = status
            if self.mode == Mode.SOLID:
                self._set_solid_mode()
            current_app.rpi_ws281x_manager.set_color(self.status.color)
        except Exception as e:
            if self.debug:
                print(f"Error setting status: {e}")
            raise

    def set_status_mode(self, mode):

        if mode == self.mode:
            if self.debug:
                print(f"Status mode is already set to {mode.name}")
            return

        self._stop_status_mode_task()

        mode_action = None
        
        if mode == Mode.FLASHING:
            self.mode = Mode.FLASHING
            self.flashing_intervals = self.settings_manager.get_settings().flashing_intervals

            if not self.flashing_intervals:
                self.flashing_intervals = DEFAULT_FLASH_INTERVAL

            mode_action = self._set_flashing_mode

        elif mode == Mode.WAVE:
            self.mode = Mode.WAVE
            self.wave_intervals = None

            if not self.wave_intervals:
                self.wave_intervals = DEFAULT_WAVE_INTERVAL

            mode_action = self._set_wave_mode

        elif mode == Mode.SOLID:
            self.mode = Mode.SOLID
            mode_action = self._set_solid_mode
        
        self.status_mode_task_stop_event.clear()
        self.status_mode_task_thread = threading.Thread(target=self.status_mode_background_task, args=(mode_action,))

        self.status_mode_task_thread.start()

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

    def _set_flashing_mode(self):

        try:

            if self.debug:
                print(f"Flashing mode: {self.status.color}")

            current_app.rpi_ws281x_manager.set_color(BLANK_COLOR)

            time.sleep(self.flashing_intervals)

            current_app.rpi_ws281x_manager.set_color(self.status.color)

            time.sleep(self.flashing_intervals)

        except Exception as e:
            if self.debug:
                print(f"Error setting flashing mode: {e}")
            raise

    def _set_wave_mode(self):

        try:

            if self.debug:
                print(f"Wave mode: {self.status.color}")

            for i in range(9):
                current_app.rpi_ws281x_manager.set_status_wave(self.status.color, i)
                time.sleep(self.wave_intervals)

            for i in range(9):
                current_app.rpi_ws281x_manager.set_status_wave(BLANK_COLOR, i)
                time.sleep(self.wave_intervals)

        except Exception as e:
            if self.debug:
                print(f"Error setting wave mode: {e}")
            raise

    def _set_solid_mode(self):

        if self.debug:
            print(f"Solid mode: {self.status.color}")

        current_app.rpi_ws281x_manager.set_color(self.status.color)

        self._stop_status_mode_task()


        
