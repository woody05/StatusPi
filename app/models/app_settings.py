class AppSettings:
    def __init__(self, brightness=25, statuses=None, version=1):
        self.version = version
        self.brightness = brightness
        self.statuses = statuses
    
    def to_dict(self):
        return {
            "version": self.version,
            "brightness": self.brightness,
            "statuses": [status.to_dict() for status in self.statuses],
        }