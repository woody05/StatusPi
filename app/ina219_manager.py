from adafruit_ina219 import INA219
from smbus2 import SMBus

class INA219Manager:
    def __init__(self, settings_manager=None):
        self.debug = False
        self.settings_manager = settings_manager  # Injected dependency

        self.i2c_bus = None
        self.ina219 = None

    def init_app(self, app, **kwargs):
        app.ina219_manager = self
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = app.settings_manager

        # Initialize I2C bus and INA219 sensor
        self.i2c_bus = SMBus(1)
        self.ina219 = INA219(self.i2c_bus)

        #Configure INA219
        self.ina219.configure()

    def read_battery_parameters(self):
        voltage = self.ina219.bus_voltage  # Voltage in volts
        current = self.ina219.current / 1000  # Current in amperes
        power = self.ina219.power / 1000  # Power in watts
        return voltage, current, power

    def estimate_battery_percentage(self):
        """Estimate battery percentage based on voltage.
        Assuming a Li-ion battery with a voltage range of 3.0V to 4.2V
        This is a rough estimate and may not be accurate for all batteries"""

        if self.debug:
            print("Reading battery parameters...")

        voltage, _, _ = self.read_battery_parameters()

        if self.debug:
            print(f"Voltage: {voltage} V")
            
        min_voltage = 3.0  # Voltage at 0%
        max_voltage = 4.2  # Voltage at 100%
        percentage = ((voltage - min_voltage) / (max_voltage - min_voltage)) * 100
        percentage = max(0, min(100, percentage))  # Clamp between 0 and 100

        if self.debug:
            print(f"Estimated battery percentage: {percentage}%")

        return percentage
