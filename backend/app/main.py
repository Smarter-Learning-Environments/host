import io
import csv
import psycopg2
import pandas as pd

from .utils import *
from . import broker, db, sql
from pydantic import ValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Response, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse

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

@app.exception_handler(psycopg2.Error)
async def db_exception_handler(request, exc: psycopg2.Error):
    return JSONResponse(status_code=500, content={"error": "Database Error", "msg": str(exc), "detail": exc.pgerror})

@app.exception_handler(psycopg2.errors.UniqueViolation)
async def db_exception_handler(request, exc: psycopg2.errors.UniqueViolation):
    return JSONResponse(status_code=409, content={"error": "Resource already exists", "msg": str(exc), "detail": exc.pgerror})

@app.exception_handler(Exception)
async def db_exception_handler(request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Unknown server error", "msg": str(exc)})

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"error": "Validation Error", "msg": str(exc)})

@app.exception_handler(ValueError)
async def validation_exception_handler(request, exc: ValueError):
    return JSONResponse(status_code=500, content={"error": "Value Error", "msg": str(exc)})

@app.get("/")
def read_root():
    # TODO health/status endpoint for modules
    # TODO health/status endpoint for docker
    # TODO pass error codes through node/react engine
    return {"message": "Hello, World!"}

@app.get("/get-floorplan")
def get_floorplan(room_number: int):
    try:
        c, r = db.execute_sql(sql.GET_FLOORPLAN_QUERY, args=(room_number,), column_names=True)
        if not r or r[0][0] is None:
            print("\n\n\nhi\n\n\n")
            return FileResponse("app/static/default.png", media_type="image/png")
        
        img_data = r[0][0]
        return Response(content=img_data, media_type="img/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        


@app.post("/upload-floorplan")
async def upload_floorplan(room_number: int = Form(...), img_file: UploadFile = File(...)):
    try:
        img_data = await img_file.read()

        db.execute_insert(sql.INSERT_FLOORPLAN_QUERY, args=(db.psycopg2.Binary(img_data), room_number))

        return {"success": True}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/login-admin")
def login_admin(request: LoginRequest, response: Response):
    columns, results = db.execute_sql(sql.LOGIN_ADMIN_QUERY, column_names=True)
    if results is None:
        response.status_code = 404
        return {"error": "No se encontraron credenciales de administrador"}
    df = pd.DataFrame(results, columns=columns)
    if df.empty:
        response.status_code = 404
        return {"error": "Admin credentials not found"}
    
    res = {}
    if request.password == df.iloc[0]["pass"]:
        return {"success": "true"}
    return {"error": "¡contraseña incorrecta!"}

@app.post("/import-data")
async def import_data(file: UploadFile = File(...), response: Response = None):
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
        if room_id is not None and room_id not in inserted_rooms:
            db.execute_insert(
                """INSERT INTO room (room_id, room_name, img_path)
                    VALUES (%s, %s, %s) ON CONFLICT (room_id) DO NOTHING;""",
                args=(room_id, room_name, img_path)
            )
            inserted_rooms.add(room_id)

        # Insert Module
        if module_id is not None and module_id not in inserted_modules:
            db.execute_insert(
                """INSERT INTO modules (module_id, room_id, position_x, position_y, position_z)
                    VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                args=(module_id, room_id, x, y, z)
            )
            inserted_modules.add(module_id)
        # Insert Sensor
        if sensor_id is not None and sensor_id not in inserted_sensors:
            db.execute_insert(
                """INSERT INTO sensors (sensor_id, sensor_type, sensor_unit, module_id)
                    VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                args=(sensor_id, sensor_type, sensor_unit, module_id)
            )
            inserted_sensors.add(sensor_id)

        # Insert Record
        if record_time is not None:
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

@app.get("/export-data")
def export_data(response: Response):
    def stream_csv():
        with db.conn.cursor() as cursor:

            cursor.itersize = 1000
            cursor.execute(sql.GET_ALL_DATA_QUERY)
            
            yield "room_id,room_name,img_path,module_id,position_x,position_y,position_z,sensor_id,sensor_type,sensor_unit,record_time,record_value\n"
            for row in cursor:
                frow = [str(item) if item is not None else '' for item in row]
                yield ','.join(frow) + '\n'

    return StreamingResponse(
        stream_csv(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=data.csv"}
    )
    

@app.post("/discover-module")
def discover_module(module: DiscoverableModule, response: Response):
    # TODO check if already exists
    db.execute_sql(sql.DISCOVER_MODULE, args=(module.hw_id,))
    for i, sensor in enumerate(module.sensor_descriptions):
        db.execute_sql(sql.DISCOVER_SENSOR, args=(module.hw_id, i, sensor))
    
    return {"status": "OK"}


@app.post("/register-module")
def register_module(module: UnregModuleIn, response: Response):
    #update module
    db.execute_sql(sql.UPDATE_MODULE_QUERY, args=(module.room_id, module.x, module.y, module.z, module.hw_id,))
    
    #update sensors
    for sensor in module.sensors:
        db.execute_sql(sql.UPDATE_SENSOR_QUERY, args=(sensor.sensor_type, sensor.sensor_unit, module.hw_id, sensor.original_type,))

    return {"success": "true"}

@app.get("/get-unregistered-module")
def get_unregistered_module(response: Response): # TODO return multiple results
    df = None

    columns, results = db.execute_sql(sql.GET_UNREG_QUERY, column_names=True)
    df = pd.DataFrame(results, columns=columns)

    if df.empty:
        return JSONResponse({}, 404)

    res = []
    
    for module_id, module_df in df.groupby('module_id'):
        mod_data = { "hw_id": module_id, "sensors": [] }
    
        columns, results = db.execute_sql(sql.GET_SENSORS_FROM_ID_QUERY, args=(module_id,), column_names=True)
        sdf = pd.DataFrame(results, columns=columns)
        
        for sensor_id, sensor_df in sdf.groupby('sensor_id'):
            mod_data["sensors"].append({
                "sensor_id": int(sensor_df.iloc[0]['sensor_id']),
                "sensor_type": sensor_df.iloc[0]['sensor_type'],
                "sensor_unit": sensor_df.iloc[0]['sensor_unit']
            })
        
        res.append(mod_data)

    return res

@app.get("/get-room-data")
def get_room_data(response: Response):
    df = None

    columns, results = db.execute_sql(sql.GET_ROOM_QUERY, column_names=True)
    df = pd.DataFrame(results, columns=columns)
    
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

    columns, results = db.execute_sql(sql.LATEST_READINGS_QUERY, args=(room_id,), column_names=True)
    df = pd.DataFrame(results, columns=columns)

    if df.empty:
        return JSONResponse({}, 404)

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

    columns, results = db.execute_sql(sql.READINGS_TIMERANGE_QUERY, args=(room_id, time_start, time_end), column_names=True)
    df = pd.DataFrame(results, columns=columns)
    # TODO Query params to filter by module? Room? Sensor 

    if df.empty:
        return JSONResponse({}, 404)
    
    res = []
    module_idx = 0
    for module_id, module_df in df.groupby('module_id'):

        if pd.isna(module_df.iloc[0]['position_x']) or pd.isna(module_df.iloc[0]['position_y']) or pd.isna(module_df.iloc[0]['position_z']):
            continue

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