from enum import Enum
import random
import threading
import time

class Mode(Enum):
    SOLID = 1
    FLASHING = 2
    WAVE = 3
    SCATTER = 4

BLANK_COLOR = 'rgb(0, 0, 0)'  # Default color for blank status
DEFAULT_FLASH_INTERVAL = 0.5  # Interval in seconds for flashing status
DEFAULT_WAVE_INTERVAL = 0.08  # Interval in seconds for wave status
DEFFAULT_SCATTER_INTERVAL = 0.03  # Interval in seconds for scatter status
DEFAULT_MODE = Mode.SOLID  # Default mode for the status manager

class StatusManager:
    def __init__(self, settings_manager=None, rpi_ws281x_manager=None):
        self.status = None
        self.debug = False
        self.settings_manager = settings_manager  # Injected dependency
        self.rpi_ws281x_manager = rpi_ws281x_manager

        self.status_mode_task_thread = None
        self.status_mode_task_stop_event = threading.Event()

        self.mode_settings = {
            Mode.SOLID: {
                "interval": None,
                "interval_variable": None,  # No interval variable for solid mode
                "method": self._set_solid_mode
            },
            Mode.FLASHING: {
                "interval": self.settings_manager.get_settings().flashing_intervals if settings_manager else DEFAULT_FLASH_INTERVAL,
                "interval_variable": "flashing_intervals",  # Use the attribute name as a string
                "method": self._set_flashing_mode
            },
            Mode.WAVE: {
                "interval": DEFAULT_WAVE_INTERVAL,
                "interval_variable": "wave_intervals",  # Use the attribute name as a string
                "method": self._set_wave_mode
            },
            Mode.SCATTER: {
                "interval": DEFFAULT_SCATTER_INTERVAL,
                "interval_variable": "scatter_intervals",  # Use the attribute name as a string
                "method": self._set_scatter_mode
            }
        }

    def init_app(self, app, **kwargs):
        app.status_manager = self
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = app.settings_manager
        self.rpi_ws281x_manager = app.rpi_ws281x_manager
        self.mode = self.settings_manager.get_settings().default_mode if self.settings_manager else DEFAULT_MODE
        self.flashing_intervals = self.settings_manager.get_settings().flashing_intervals if self.settings_manager else DEFAULT_FLASH_INTERVAL
        self.wave_intervals = self.settings_manager.get_settings().wave_intervals if self.settings_manager else DEFAULT_WAVE_INTERVAL
        self.scatter_intervals = self.settings_manager.get_settings().scatter_intervals if self.settings_manager else DEFFAULT_SCATTER_INTERVAL
        # Set the default status
        self.status = self.get_available_status_by_id(1)
        if self.debug:
            print(f"Initialized status: {self.status}")

        # Set the default mode without starting a new thread
        self.set_status_mode(self.mode, start_thread=False)

    def get_mode_list(self):
        """Return the Mode enum as a list of strings."""
        return [mode.name for mode in Mode]

    def _stop_status_mode_task(self):
        if self.debug:
            print("Stopping status mode task...")
         # if we have a task running, stop it
        if self.status_mode_task_thread and self.status_mode_task_thread.is_alive():
            self.status_mode_task_stop_event.set()
            if threading.current_thread() != self.status_mode_task_thread:
                self.status_mode_task_thread.join()
                if self.debug:
                    print("Status mode task stopped.")

    def status_mode_background_task(self, action):
        while not self.status_mode_task_stop_event.is_set():
            action()

    def set_status(self, status):
        try:
            self.status = status
            if self.mode == Mode.SOLID:
                self._set_solid_mode()
            self.rpi_ws281x_manager.set_color(self.status.color)
        except Exception as e:
            if self.debug:
                print(f"Error setting status: {e}")
            raise

    def set_status_mode(self, mode=None, start_thread=True):
        if not mode:
            mode = self.mode

        if self.debug:
            print(f"Setting status mode to {mode.name}")

        # Stop the current task if a thread is running
        self._stop_status_mode_task()

        mode_setting = self.mode_settings.get(mode)
        mode_action = None

        if mode_setting:
            self.mode = mode
            if mode_setting.get("interval_variable") is not None and mode_setting.get("interval") is not None:
                setattr(self, mode_setting.get("interval_variable"), mode_setting.get("interval"))
            if mode_setting.get("method") is not None:
                mode_action = mode_setting.get("method")

        # If start_thread is False, execute the mode action directly
        if not start_thread and mode_action:
            if self.debug:
                print(f"Executing mode action directly for mode: {mode.name}")
            mode_action()
            return

        # Start a new thread for the mode's background task
        if mode_action:
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
            self.rpi_ws281x_manager.set_brightness(brightness)
        except Exception as e:
            if self.debug:
                print(f"Error setting brightness: {e}")
            raise

    def _set_flashing_mode(self):

        try:

            if self.debug:
                print(f"Flashing mode: {self.status.color}")

            self.rpi_ws281x_manager.set_color(BLANK_COLOR)

            time.sleep(self.flashing_intervals)

            self.rpi_ws281x_manager.set_color(self.status.color)

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
                self.rpi_ws281x_manager.set_status_wave(self.status.color, i)
                time.sleep(self.wave_intervals)

            for i in range(9):
                self.rpi_ws281x_manager.set_status_wave(BLANK_COLOR, i)
                time.sleep(self.wave_intervals)

        except Exception as e:
            if self.debug:
                print(f"Error setting wave mode: {e}")
            raise
    
    def _set_scatter_mode(self):

        try:

            if self.debug:
                print(f"Scatter mode: {self.status.color}")

            # Adjust the probability: 55% chance to turn LED on, 45% chance to turn it off
            turn_led_on = random.choices([True, False], weights=[60, 40], k=1)[0]
            random_led_index = random.randint(0, 33)
                
            if turn_led_on:
                if self.debug:
                    print(f"Setting color {self.status.color} on LED index {random_led_index}")
                self.rpi_ws281x_manager.set_color_single_index(self.status.color, random_led_index)
            else:
                if self.debug:
                    print(f"Setting color {BLANK_COLOR} on LED index {random_led_index}")
                self.rpi_ws281x_manager.set_color_single_index(BLANK_COLOR, random_led_index)

            time.sleep(self.scatter_intervals)

        except Exception as e:
            if self.debug:
                print(f"Error setting scatter mode: {e}")
            raise

    def _set_solid_mode(self):

        if self.debug:
            print(f"Solid mode: {self.status.color}")

        self.rpi_ws281x_manager.set_color(self.status.color)

        self._stop_status_mode_task()


        
