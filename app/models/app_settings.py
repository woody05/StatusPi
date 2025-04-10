class AppSettings:
    def __init__(self, brightness=25, statuses=None):
        self.brightness = brightness
        self.statuses = statuses
    
    def to_dict(self):
        return {
            "brightness": self.brightness,
            "statuses": [status.to_dict() for status in self.statuses],
        }