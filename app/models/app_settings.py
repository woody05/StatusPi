class AppSettings:
    def __init__(self, brightness=25, statuses=None, version=1, flashing_intervals=0.5):
        self.version = version
        self.brightness = brightness
        self.statuses = statuses
        self.flashing_intervals = flashing_intervals
    
    def to_dict(self):
        return {
            "version": self.version,
            "brightness": self.brightness,
            "statuses": [status.to_dict() for status in self.statuses],
            "flashing_intervals": self.flashing_intervals
        }