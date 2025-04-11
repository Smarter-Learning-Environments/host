import psycopg2
import pandas as pd
from . import broker, db, sql
from fastapi import FastAPI, Response, status, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .utils import *
import io
import csv

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
    allow_origins=["*"],
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

@app.post("/import-data")
async def import_data(file: UploadFile = File(...), response: Response = None):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))

        inserted_rooms = set()
        inserted_modules = set()
        inserted_sensors = set()
        inserted_records = 0

        for _, row in df.iterrows():
            room_id = int(row["room_id"]) if not pd.isna(row["room_id"]) else None
            room_name = row["room_name"] if not pd.isna(row["room_name"]) else None
            img_path = row["img_path"] if not pd.isna(row["img_path"]) else None
            
            module_id = str(row["module_id"]) if not pd.isna(row["module_id"]) else None
            x = int(row["position_x"]) if not pd.isna(row["position_x"]) else None
            y = int(row["position_y"]) if not pd.isna(row["position_y"]) else None
            z = int(row["position_z"]) if not pd.isna(row["position_z"]) else None

            sensor_id = int(row["sensor_id"]) if not pd.isna(row["sensor_id"]) else None
            sensor_type = row["sensor_type"] if not pd.isna(row["sensor_type"]) else None
            sensor_unit = row["sensor_unit"] if not pd.isna(row["sensor_unit"]) else None

            record_time = int(row["record_time"]) if not pd.isna(row["record_time"]) else None
            record_value = float(row["record_value"]) if not pd.isna(row["record_value"]) else None

            # Insert Room
            if room_id and room_id not in inserted_rooms:
                db.execute_insert(
                    """INSERT INTO room (room_id, room_name, img_path)
                       VALUES (%s, %s, %s) ON CONFLICT (room_id) DO NOTHING;""",
                    args=(room_id, room_name, img_path)
                )
                inserted_rooms.add(room_id)

            # Insert Module
            if module_id and module_id not in inserted_modules:
                db.execute_insert(
                    """INSERT INTO modules (module_id, room_id, position_x, position_y, position_z)
                       VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                    args=(module_id, room_id, x, y, z)
                )
                inserted_modules.add(module_id)

            # Insert Sensor
            if sensor_id and module_id and sensor_id not in inserted_sensors:
                db.execute_insert(
                    """INSERT INTO sensors (sensor_id, sensor_type, sensor_unit, module_id)
                       VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                    args=(sensor_id, sensor_type, sensor_unit, module_id)
                )
                inserted_sensors.add(sensor_id)

            # Insert Record
            if record_time and record_value and sensor_id:
                db.execute_insert(
                    """INSERT INTO records (module_id, record_time, record_value, sensor_id)
                       VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                    args=(module_id, record_time, record_value, sensor_id)
                )
                inserted_records += 1

        return {
            "status": "success",
            "inserted": {
                "rooms": len(inserted_rooms),
                "modules": len(inserted_modules),
                "sensors": len(inserted_sensors),
                "records": inserted_records
            }
        }

    except Exception as e:
        response.status_code = 500
        return {"status": "error", "message": str(e)}

@app.get("/export-data")
def export_data(response: Response):
    try:
        columns, results = db.execute_sql(sql.GET_ALL_DATA_QUERY, column_names=True)
        df = pd.DataFrame(results, columns=columns)

        csv_data = df.to_csv(index=False, encoding="utf-8-sig")

        return StreamingResponse(
            csv_data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=data.csv"}
        )

    except psycopg2.Error as e:
        response.status_code = 500
        return f"Database error: {e.pgerror}"
    except Exception as e:
        response.status_code = 500
        return f"Unknown error: {str(e)}"
    

@app.post("/discover-module")
def discover_module(module: DiscoverableModule, response: Response):
    # TODO use decorator or FastAPI default exception handler
    # TODO check if already exists
    try:
        db.execute_sql(sql.DISCOVER_MODULE, args=(module.hw_id, module.hw_id, module.sensor_count))
    except psycopg2.errors.UniqueViolation as e:
        # If a UniqueViolation error occurs (duplicate key), return HTTP 409 Conflict
        response.status_code = 409  # Conflict
        return {"error": "Resource already exists", "msg": str(e)}
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
def register_module(module: UnregModuleIn, response: Response):
    try:
        #update module
        db.execute_sql(sql.UPDATE_MODULE_QUERY, args=(module.room_id, module.x, module.y, module.z, module.hw_id,))
        
        #update sensors
        for sensor in module.sensors:
            db.execute_sql(sql.UPDATE_SENSOR_QUERY, args=(sensor.sensor_type, sensor.sensor_unit, module.hw_id, sensor.original_type,))

        return {"success": "true"}
    
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

@app.get("/get-unregistered-module")
def get_unregistered_module(response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.GET_UNREG_QUERY, column_names=True)
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 room id not found
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}

    if df.empty:
        return {}

    res = {
        "hw_id": df.iloc[0]['module_id'],
        "sensors": []
    }
    
    try:
        columns, results = db.execute_sql(sql.GET_SENSORS_FROM_ID_QUERY, args=(df.iloc[0]['module_id'],), column_names=True)
        sdf = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        # TODO more granular error codes
        # TODO 404 room id not found
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}
    
    if sdf.empty:
        return res
    
    for sensor_id, sensor_df in sdf.groupby('sensor_id'):
        res["sensors"].append({
            "sensor_id": int(sensor_df.iloc[0]['sensor_id']),
            "sensor_type": sensor_df.iloc[0]['sensor_type'],
            "sensor_unit": sensor_df.iloc[0]['sensor_unit']
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

        x = module_df.iloc[0]['position_x']
        y = module_df.iloc[0]['position_y']
        z = module_df.iloc[0]['position_z']
        x = int(-1) if pd.isna(x) else int(x)
        y = int(-1) if pd.isna(y) else int(y)
        z = int(-1) if pd.isna(z) else int(z)

        res.append({
            "module_id": module_id,
            "module_xyz": [
                x, y, z #TODO FIX NONETYPE ERROR
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

@app.get('/get-data-timerange/{room_id}/{time_start}/{time_end}')
def get_data_timerange(room_id: int, time_start: int, time_end: int, response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.READINGS_TIMERANGE_QUERY, args=(room_id, time_start, time_end), column_names=True)
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