from app.status_manager import Mode


class AppSettings:
    def __init__(self, brightness=25, statuses=None, version=1,
                 flashing_intervals=0.5, wave_intervals=0.5, scatter_intervals=0.03, default_mode=Mode.SOLID):
        self.version = version
        self.brightness = brightness
        self.statuses = statuses
        self.flashing_intervals = flashing_intervals
        self.wave_intervals = wave_intervals
        self.scatter_intervals = scatter_intervals
        self.default_mode = default_mode
    
    def to_dict(self):
        return {
            "version": self.version,
            "brightness": self.brightness,
            "statuses": [status.to_dict() for status in self.statuses],
            "flashing_intervals": self.flashing_intervals,
            "wave_intervals": self.wave_intervals,
            "scatter_intervals": self.scatter_intervals,
            "default_mode": self.default_mode.name  
        }