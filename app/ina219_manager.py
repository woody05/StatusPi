import board
import busio
from adafruit_ina219 import INA219


class INA219Manager:
    def __init__(self, settings_manager=None):
        self.debug = False
        self.settings_manager = settings_manager  # Injected dependency

        self.i2c = None
        self.sensor = None

    def init_app(self, app, **kwargs):
        app.ina219_manager = self
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = app.settings_manager

        # Initialize I2C with CircuitPython
        self.i2c = busio.I2C(board.SCL, board.SDA)

        ina219_address = 0x43  # Example: setting address to 0x41

        # Create the sensor object without passing an address
        self.sensor = INA219(self.i2c, addr=ina219_address)

    def read_battery_voltage(self):
        return self.sensor.bus_voltage

    def estimate_battery_percentage(self):
        """Estimate battery percentage based on voltage.
        Assuming a Li-ion battery with a voltage range of 3.0V to 4.2V
        This is a rough estimate and may not be accurate for all batteries"""

        if self.debug:
            print("Reading battery parameters...")

        voltage, _, _ = self.read_battery_voltage()

        if self.debug:
            print(f"Voltage: {voltage} V")
            
        min_voltage = 3.0  # Voltage at 0%
        max_voltage = 4.2  # Voltage at 100%
        percentage = ((voltage - min_voltage) / (max_voltage - min_voltage)) * 100
        percentage = max(0, min(100, percentage))  # Clamp between 0 and 100

        if self.debug:
            print(f"Estimated battery percentage: {percentage}%")

        return percentage
