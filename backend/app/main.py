import psycopg2
import pandas as pd
from . import broker, db, sql
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from .utils import *

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001"
]

def startServer() -> FastAPI:
    broker.setup_connection()
    return FastAPI()

app = startServer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    # TODO health/status endpoint for modules
    # TODO health/status endpoint for docker
    # TODO pass error codes through node/react engine
    return {"message": "Hello, World!"}

@app.post("/place-module")
def place_module(module: ModuleIn, response: Response):
    try:
        #insert module
        module_id = db.execute_insert(sql.INSERT_MODULE_QUERY, args=(module.room_id, module.x, module.y, module.z,), returning=True)
        
        #insert sensors
        for sensor in module.sensors:
            db.execute_insert(sql.INSERT_SENSOR_QUERY, args=(sensor.sensor_type, sensor.sensor_unit, module_id,))

        return {"success": "true", "module_id": module_id}
    
    except psycopg2.Error as e:
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    except ValidationError as e:
        response.status_code = 422
        return {"error": type(e), "msg": str(e)}
    except Exception as e:
        response.status_code = 500
        return {"error": "Unknown Error", "msg": str(e)}

@app.post("/discover-module")
def discover_module(module: DiscoverableModule, response: Response):
    # TODO use decorator or FastAPI default exception handler
    # TODO check if already exists
    try:
        db.execute_sql(sql.DISCOVER_MODULE, args=(module.hw_id, module.hw_id, module.sensor_count))
    except psycopg2.Error as e:
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    except ValidationError as e:
        response.status_code = 422
        return {"error": type(e), "msg": str(e)}
    except Exception as e:
        response.status_code = 500
        return {"error": "Unknown Error", "msg": str(e)}
    
    return {"status": "OK"}


@app.post("/register-module")
def place_module(module: UnregModuleIn, response: Response):
    try:
        #insert module
        module_id = db.execute_insert(sql.INSERT_MODULE_QUERY, args=(module.room_id, module.x, module.y, module.z,), returning=True)
        
        #insert sensors
        for sensor in module.sensors:
            db.execute_insert(sql.INSERT_SENSOR_QUERY, args=(sensor.sensor_type, sensor.sensor_unit, module_id,))

        #insert assigned module ID into registration table
        db.execute_sql(sql.UPDATE_UNREG_QUERY, args=(module_id, module.hw_id,))

        return {"success": "true", "module_id": module_id}
    
    except psycopg2.Error as e:
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    except ValidationError as e:
        response.status_code = 422
        return {"error": type(e), "msg": str(e)}
    except Exception as e:
        response.status_code = 500
        return {"error": "Unknown Error", "msg": str(e)}


@app.post("/test-post")
def test_post():
    broker.publish.single("paho/test/topic", "message", hostname="mqtt-broker")
    return {"message": "Hello, World!"}

@app.get("/get-unregistered-modules")
def get_unregistered_modules(response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.GET_UNREG_QUERY, column_names=True)
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 room id not found
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}

    res = []
    for hw_id, hw_df in df.groupby('hw_id'):
        res.append({
            "hw_id": hw_id,
            "num_sensors": int(hw_df.iloc[0]['num_sensors']),
        })

    return res

@app.get("/get-room-data")
def get_room_data(response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.GET_ROOM_QUERY, column_names=True)
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 room id not found
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    
    res = []
    for room_id, room_df in df.groupby('room_id'):
        res.append({
            "room_id": int(room_df.iloc[0]['room_id']),
            "room_name": str(room_df.iloc[0]['room_name']),
            "img_path": room_df.iloc[0]['img_path']
        })
    return res


@app.get("/get-latest-reading/{room_id}")
def get_latest_reading(room_id: int, response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.LATEST_READINGS_QUERY, args=(room_id,), column_names=True)
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 room id not found
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}

    res = []
    idx = 0
    for module_id, module_df in df.groupby('module_id'):
        res.append({
            "module_id": module_id,
            "module_xyz": [
                int(module_df.iloc[0]['position_x']), # TODO fix nonetype error
                int(module_df.iloc[0]['position_y']),
                int(module_df.iloc[0]['position_z'])
            ],
            "sensors": []
        })
        for sensor_id, sensor_df in module_df.groupby('sensor_id'):
            time = sensor_df.iloc[0]['record_time']
            if pd.isna(time):
                continue

            res[idx]["sensors"].append({
                'sensor_id' : sensor_id,
                'sensor_type' : sensor_df.iloc[0]['sensor_type'],
                'sensor_units' : sensor_df.iloc[0]['sensor_unit'],
                'readings': [
                    {
                        'value': sensor_df.iloc[0]['record_value'],
                        'time': int(time)
                    }
                ]
            })
        idx += 1

    return res

@app.get('/get-data-timerange/{time_start}/{time_end}')
def get_data_timerange(time_start: int, time_end: int, response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.READINGS_TIMERANGE_QUERY, args=(time_start, time_end), column_names=True)
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 Time range returns no result
        # TODO Query params to filter by module? Room? Sensor 
        # TODO room id...
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    
    res = []
    module_idx = 0
    for module_id, module_df in df.groupby('module_id'):
        res.append({
            "module_id": module_id,
            "module_xyz": [
                int(module_df.iloc[0]['position_x']),
                int(module_df.iloc[0]['position_y']),
                int(module_df.iloc[0]['position_z'])
            ],
            "sensors": []
        })
        sensor_idx = 0
        for sensor_id, sensor_df in module_df.groupby('sensor_id'):
            res[module_idx]["sensors"].append({
                'sensor_id' : sensor_id,
                'sensor_type' : sensor_df.iloc[0]['sensor_type'],
                'sensor_units' : sensor_df.iloc[0]['sensor_unit'],
                'readings': []
            })
            for row in sensor_df[['record_value', 'record_time']].itertuples():
                res[module_idx]["sensors"][sensor_idx]["readings"].append({"value": row[1], "time": int(row[2])})
            sensor_idx += 1
        module_idx += 1
    return res