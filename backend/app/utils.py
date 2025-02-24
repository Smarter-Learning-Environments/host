from enum import StrEnum

class Factors(StrEnum):
    TEMPERATURE = "temp"
    HUMIDITY = "humid"
    NOISE = "noise"
    LIGHT = "light"
    PARTICULATE_MATTER = "pm"
    CARBON_DIOXIDE = "co2"
    OCCUPANCY = "occu"

class Platforms:
    TEST = "test"
    PI = "pi"
    ESP32 = "esp"
    ARDUINO = "arduino"