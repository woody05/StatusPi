#!/usr/bin/env python3
import os
import logging
from flask import current_app, has_app_context

# 1. Check env variable or attempt hardware import
ENV = os.getenv("APP_ENV", "development")
IS_MOCK = False

if ENV != "development":
    try:
        from rpi_ws281x import PixelStrip, Color
    except ImportError:
        ENV = "development"
        IS_MOCK = True
else:
    IS_MOCK = True

if IS_MOCK:
    class PixelStrip:
        def __init__(self, num, pin, freq_hz=800000, dma=10, invert=False, brightness=255, channel=0, strip_type=None):
            self._num = num
            self._brightness = brightness

        def begin(self): pass
        def numPixels(self): return self._num
        def setPixelColor(self, n, color): pass
        def show(self): pass
        def setBrightness(self, brightness): self._brightness = brightness
        def getBrightness(self): return 12

    def Color(red, green, blue, white=0):
        """Match the exact integer bit-shift packed color of rpi_ws281x."""
        return (white << 24) | (red << 16) | (green << 8) | blue

# LED strip configuration:
LED_COUNT = 32       # Number of LED pixels.
LED_PIN = 18          # GPIO pin connected to the pixels (18 uses PWM!).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA = 10          # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 25  # Set to 0 for darkest and 255 for brightest
LED_INVERT = False    # True to invert the signal
LED_CHANNEL = 0       # Set to '1' for GPIOs 13, 19, 41, 45 or 53


class RPIWS281XManager:
    def __init__(self, led_count=LED_COUNT, led_pin=LED_PIN, led_freq_hz=LED_FREQ_HZ,
                 led_dma=LED_DMA, led_brightness=LED_BRIGHTNESS, led_invert=LED_INVERT,
                 led_channel=LED_CHANNEL, app=None, settings_manager=None):
        self.debug = False
        self.settings_manager = settings_manager
        self._app_logger = None
        self._fallback_logger = logging.getLogger(__name__)

        self.strip = PixelStrip(led_count, led_pin, led_freq_hz, led_dma,
                                led_invert, led_brightness, led_channel)
        self.strip.begin()

        if app is not None:
            self.init_app(app)

    @property
    def logger(self) -> logging.Logger:
        """
        Dynamically returns the Flask app logger if running within a Flask request/app context
        or if bound during init_app. Fallback to module logger otherwise.
        """
        if has_app_context():
            return current_app.logger
        if self._app_logger is not None:
            return self._app_logger
        return self._fallback_logger

    def init_app(self, app, **kwargs):
        app.rpi_ws281x_manager = self
        self._app_logger = app.logger
        self.debug = kwargs.get('debug', self.debug)
        self.settings_manager = getattr(app, 'settings_manager', self.settings_manager)

        mode_str = "MOCKED (Dev)" if IS_MOCK else "HARDWARE"
        self.logger.info(f"RPIWS281XManager initialized in {mode_str} mode")

        initial_brightness = self.settings_manager.get_settings().brightness if self.settings_manager else LED_BRIGHTNESS
        self.set_brightness(initial_brightness)
        self.strip.show()

    def get_brightness(self) -> float:
        return self.strip.getBrightness()

    def set_brightness(self, brightness):
        try:
            val = int(brightness)
            self.logger.info(f"Setting LED brightness to {val}")
            self.strip.setBrightness(val)
            self.strip.show()
        except Exception as e:
            self.logger.error(f"Failed to set brightness to {brightness}: {e}")
            raise

    def _parse_color(self, color):
        """Helper to safely parse 'rgb(r, g, b)' string or tuple into a Color integer."""
        if isinstance(color, str):
            clean_str = color.replace("rgb", "").strip("()")
            parts = [int(p.strip()) for p in clean_str.split(",")]
            return Color(parts[0], parts[1], parts[2])
        elif isinstance(color, (tuple, list)):
            return Color(color[0], color[1], color[2])
        return color

    def set_color(self, color):
        try:
            parsed_color = self._parse_color(color)

            for i in range(self.strip.numPixels()):
                self.strip.setPixelColor(i, parsed_color)

            self.strip.show()
        except Exception as e:
            self.logger.error(f"Error setting full strip color ({color}): {e}")
            raise

    def set_color_single_index(self, color, led_index):
        # High-frequency call (e.g. Scatter Mode): No info/debug logging here to prevent log floods
        try:
            parsed_color = self._parse_color(color)
            self.strip.setPixelColor(led_index, parsed_color)
            self.strip.show()
        except Exception as e:
            self.logger.error(f"Error setting single LED {led_index} color: {e}")
            raise

    def set_status_wave(self, color, line_number):
        # High-frequency call (Wave animation): No info/debug logging here
        try:
            parsed_color = self._parse_color(color)

            led_rows = [
                [0, 8, 16, 24],
                [1, 9, 17, 25],
                [2, 10, 18, 26],
                [3, 11, 19, 27],
                [4, 12, 20, 28],
                [5, 13, 21, 29],
                [6, 14, 22, 30],
                [7, 15, 23, 31],
                [8, 16, 24, 32],
            ]

            if 0 <= line_number < len(led_rows):
                row = led_rows[line_number]
                for i in row:
                    if i < self.strip.numPixels():
                        self.strip.setPixelColor(i, parsed_color)

            self.strip.show()
        except Exception as e:
            self.logger.error(f"Error rendering wave line {line_number}: {e}")
            raise