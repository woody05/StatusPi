#!/usr/bin/env python3
# NeoPixel library strandtest example
# Author: Tony DiCola (tony@tonydicola.com)
#
# Direct port of the Arduino NeoPixel library strandtest example.  Showcases
# various animations on a strip of NeoPixels.

import time
from rpi_ws281x import Adafruit_NeoPixel, Color
import argparse

# LED strip configuration:
LED_COUNT = 32       # Number of LED pixels.
LED_PIN = 18          # GPIO pin connected to the pixels (18 uses PWM!).
# LED_PIN = 10        # GPIO pin connected to the pixels (10 uses SPI /dev/spidev0.0).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA = 10          # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255  # Set to 0 for darkest and 255 for brightest
LED_INVERT = False    # True to invert the signal (when using NPN transistor level shift)
LED_CHANNEL = 0       # set to '1' for GPIOs 13, 19, 41, 45 or 53

class RPIWS281XManager:
    def __init__(self, led_count=LED_COUNT, led_pin=LED_PIN, led_freq_hz=LED_FREQ_HZ,
                 led_dma=LED_DMA, led_brightness=LED_BRIGHTNESS, led_invert=LED_INVERT,
                 led_channel=LED_CHANNEL):
        self.debug = False
        self.strip = Adafruit_NeoPixel(led_count, led_pin, led_freq_hz, led_dma,
                                led_invert, led_brightness, led_channel)
        self.strip.begin()

    def init_app(self, app, **kwargs):
        app.rpi_ws281x_manager = self
        self.debug = kwargs.get('debug', self.debug)

    def set_color(self, color):

        #TODO: find cleaner way to convert string color to Color object
        if isinstance(color, str):
            color = color.strip("()").split(",")
            red = int(color[0])
            green = int(color[1])
            blue = int(color[2])
            
        color = Color(red, green, blue)

        for i in range(self.strip.numPixels()):
            self.strip.setPixelColor(i, color)
        self.strip.show()