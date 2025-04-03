import os
from enum import StrEnum
from pydantic import BaseModel, ValidationError
from typing import List

class SensorIn(BaseModel):
    sensor_type: str
    sensor_unit: str

class ModuleIn(BaseModel):
    room_id: int
    x: int
    y: int
    z: int
    sensors: List[SensorIn]

class UnregModuleIn(BaseModel):
    hw_id: str
    room_id: int
    x: int
    y: int
    z: int
    sensors: List[SensorIn]
    
class ENV_VARS(StrEnum):
    MQTT_BROKER_HOST = os.getenv('MQTT_BROKER_HOST', 'mqtt-broker')
    DB_HOST = os.getenv('DB_HOST', 'postgres')
    DB_USER = os.getenv('DB_USER', 'user')
    DB_PASS = os.getenv('DB_PASS', 'password')
    DB_NAME = os.getenv('DB_NAME', 'mydb')

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