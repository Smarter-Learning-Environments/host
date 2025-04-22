import os
from typing import List
from enum import StrEnum
from functools import wraps
from pydantic import BaseModel
from fastapi.responses import JSONResponse

class LoginRequest(BaseModel):
    password: str

class SensorIn(BaseModel):
    sensor_type: str
    sensor_unit: str

class UnregSensorIn(BaseModel):
    original_type: str
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
    sensors: List[UnregSensorIn]

class DiscoverableModule(BaseModel):
    hw_id: str
    sensor_count: int
    sensor_descriptions: List[str]
    
class ENV_VARS(StrEnum):
    MQTT_BROKER_HOST = os.getenv('MQTT_BROKER_HOST', 'mqtt-broker')
    DB_HOST = os.getenv('DB_HOST', 'postgres')
    DB_USER = os.getenv('DB_USER', 'user')
    DB_PASS = os.getenv('DB_PASS', 'password')
    DB_NAME = os.getenv('DB_NAME', 'mydb') # TODO secrets & hide passwords...

def set_404_if_field_empty(field: str, message: str = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            if not isinstance(result, dict):
                return result

            value = result.get(field)
            if not value:
                return JSONResponse(
                    status_code=404,
                    content={**result, "error": message or f"'{field}' not found or empty"}
                )
            return result
        return wrapper
    return decorator