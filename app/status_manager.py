from enum import Enum
import random
import threading
import time
from app.database.db_manager import DatabaseManager as DB
from app.models.status import Status

class Mode(Enum):
    SOLID = 1
    FLASHING = 2
    WAVE = 3
    SCATTER = 4

BLANK_COLOR = 'rgb(0, 0, 0)'       # Default color for blank status
DEFAULT_FLASH_INTERVAL = 0.5       # Default fallback interval (seconds)
DEFAULT_WAVE_INTERVAL = 0.08       # Default fallback interval (seconds)
DEFAULT_SCATTER_INTERVAL = 0.03    # Default fallback interval (seconds)
DEFAULT_MODE = Mode.SOLID          # Default fallback mode


class StatusManager:
    def __init__(self, rpi_ws281x_manager=None):
        self.status = None
        self.debug = False
        self.rpi_ws281x_manager = rpi_ws281x_manager
        self.logger = None

        self.status_mode_task_thread = None
        self.status_mode_task_stop_event = threading.Event()

        self.mode_settings = {
            Mode.SOLID: {
                "method": self._set_solid_mode
            },
            Mode.FLASHING: {
                "method": self._set_flashing_mode
            },
            Mode.WAVE: {
                "method": self._set_wave_mode
            },
            Mode.SCATTER: {
                "method": self._set_scatter_mode
            }
        }

    def init_app(self, app, **kwargs):
        app.status_manager = self
        self.logger = app.logger
        self.debug = kwargs.get('debug', self.debug)
        
        self.logger.info("StatusManager initialized")

        self.rpi_ws281x_manager = app.rpi_ws281x_manager

        # --- Wrap DB calls inside Flask Application Context ---
        with app.app_context():
            # Load mode & timing values directly from DatabaseManager
            raw_mode = self._get_db_setting("default_mode", DEFAULT_MODE.name)
            try:
                self.mode = Mode[str(raw_mode).upper()]
            except KeyError:
                self.mode = DEFAULT_MODE

            self.flashing_intervals = float(self._get_db_setting("default_flash_intervals", DEFAULT_FLASH_INTERVAL))
            self.wave_intervals = float(self._get_db_setting("default_wave_intervals", DEFAULT_WAVE_INTERVAL))
            self.scatter_intervals = float(self._get_db_setting("default_scatter_intervals", DEFAULT_SCATTER_INTERVAL))

            # Fetch target default status name/key (e.g., "Available")
            default_status_name = self._get_db_setting("default_status", "Available")
            
            # Fetch all available status option dicts from DB
            available_statuses = self.get_available_statuses()

            # Find matching status dict by name or setting_key; fallback to the first status if not found
            status = next(
                (s for s in available_statuses if s.get("name") == default_status_name or s.get("setting_key") == default_status_name),
                available_statuses[0] if available_statuses else None
            )

            # Set hardware LED color if status exists
            if status:
                self.status = Status(status.get('id'), status.get('name'), status.get('value'))
                status_color = self.status.color
                self.logger.info(f"Setting initial status '{self.status.name}' with color: {status_color}")
                if self.rpi_ws281x_manager:
                    self.rpi_ws281x_manager.set_color(status_color)

    def _get_db_setting(self, key: str, fallback: any):
        """Helper to safely retrieve a setting value from DB."""
        setting = DB.get_setting_by_key(key)
        return setting.value if setting else fallback

    def get_mode_list(self):
        """Return the Mode enum as a list of strings."""
        return [mode.name for mode in Mode]

    def _stop_status_mode_task(self):
        if self.status_mode_task_thread and self.status_mode_task_thread.is_alive():
            self.status_mode_task_stop_event.set()
            self.status_mode_task_thread.join()

    def status_mode_background_task(self, action):
        while not self.status_mode_task_stop_event.is_set():
            if action:
                action()

    def set_status(self, status):
        try:
            status_id = status.get('id', 'unknown') if isinstance(status, dict) else getattr(status, 'id', 'unknown')
            color = status.get('value') if isinstance(status, dict) else getattr(status, 'color', BLANK_COLOR)

            if self.logger:
                self.logger.info(f"Setting status to ID {status_id} ({color})")
            
            self.status = Status(status_id, status.get("name"), color)
            if self.mode == Mode.SOLID:
                self._set_solid_mode()
            
            if self.rpi_ws281x_manager:
                self.rpi_ws281x_manager.set_color(color)
        except Exception as e:
            if self.logger:
                self.logger.error(f"Error setting status: {e}")
            raise

    def set_status_mode(self, mode=None):
        self._stop_status_mode_task()

        if not mode:
            mode = self.mode

        if self.logger:
            self.logger.info(f"Setting status mode to {mode.name}")

        mode_setting = self.mode_settings.get(mode)
        mode_action = None

        if mode_setting:
            self.mode = mode
            mode_action = mode_setting.get("method")

        self.status_mode_task_stop_event.clear()
        self.status_mode_task_thread = threading.Thread(
            target=self.status_mode_background_task, 
            args=(mode_action,),
            daemon=True
        )
        self.status_mode_task_thread.start()

    def get_available_statuses(self):
        """Fetch status dictionary list directly from DatabaseManager."""
        statuses = DB.get_statuses()
        if statuses is None:
            if self.logger:
                self.logger.error("Statuses group not found in Database!")
            raise RuntimeError("Statuses group not found in Database!")
        #statuses = [Status(status.get(id), status.get('name'), status.get('value')) for status in statuses]
        return statuses

    def get_available_status_by_id(self, status_id):
        available_statuses = self.get_available_statuses()
        status = next((s for s in available_statuses if str(s.get("id")) == str(status_id)), None)

        if status:
            return status
        else:
            if self.logger:
                self.logger.error(f"Status with id {status_id} not found")
            raise ValueError(f"Status with id {status_id} not found")

    def get_brightness(self) -> float:
        try:
            return self.rpi_ws281x_manager.get_brightness()
        except Exception as ex:
            if self.logger:
                self.logger.error(f"Error getting brightness: {ex}")
            raise
        
    def set_brightness(self, brightness):
        try:
            if self.logger:
                self.logger.info(f"Setting brightness to {brightness}")
            self.rpi_ws281x_manager.set_brightness(brightness)
        except Exception as e:
            if self.logger:
                self.logger.error(f"Error setting brightness: {e}")
            raise

    # -------------------------------------------------------------------------
    # Helper to resolve status RGB value from dict or object
    # -------------------------------------------------------------------------

    def _get_current_status_color(self) -> str:
        if not self.status:
            return BLANK_COLOR
        if isinstance(self.status, dict):
            return self.status.get("value", BLANK_COLOR)
        return getattr(self.status, "color", BLANK_COLOR)

    # -------------------------------------------------------------------------
    # Animation loops (No debug logging in hot execution paths)
    # -------------------------------------------------------------------------

    def _set_flashing_mode(self):
        try:
            if self.rpi_ws281x_manager:
                self.rpi_ws281x_manager.set_color(BLANK_COLOR)
            time.sleep(self.flashing_intervals)

            if self.rpi_ws281x_manager:
                self.rpi_ws281x_manager.set_color(self._get_current_status_color())
            time.sleep(self.flashing_intervals)

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error in flashing mode: {e}")
            raise

    def _set_wave_mode(self):
        try:
            current_color = self._get_current_status_color()
            for i in range(9):
                if self.rpi_ws281x_manager:
                    self.rpi_ws281x_manager.set_status_wave(current_color, i)
                time.sleep(self.wave_intervals)

            for i in range(9):
                if self.rpi_ws281x_manager:
                    self.rpi_ws281x_manager.set_status_wave(BLANK_COLOR, i)
                time.sleep(self.wave_intervals)

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error in wave mode: {e}")
            raise
    
    def _set_scatter_mode(self):
        try:
            turn_led_on = random.choices([True, False], weights=[60, 40], k=1)[0]
            random_led_index = random.randint(0, 33)
                
            color = self._get_current_status_color() if turn_led_on else BLANK_COLOR
            
            if self.rpi_ws281x_manager:
                self.rpi_ws281x_manager.set_color_single_index(color, random_led_index)
            time.sleep(self.scatter_intervals)

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error in scatter mode: {e}")
            raise

    def _set_solid_mode(self):
        try:
            if self.rpi_ws281x_manager:
                self.rpi_ws281x_manager.set_color(self._get_current_status_color())
            self._stop_status_mode_task()
        except Exception as e:
            if self.logger:
                self.logger.error(f"Error in solid mode: {e}")
            raise