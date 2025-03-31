import psycopg2
import pandas as pd
from . import broker, db, sql
from fastapi import FastAPI, Response, status

def startServer() -> FastAPI:
    broker.setup_connection()
    return FastAPI()

app = startServer()

@app.get("/")
def read_root():
    # TODO health/status endpoint for modules
    # TODO health/status endpoint for docker
    # TODO pass error codes through node/react engine
    return {"message": "Hello, World!"}

@app.post("/test-post")
def test_post():
    broker.publish.single("paho/test/topic", "message", hostname="mqtt-broker")
    return {"message": "Hello, World!"}
 
@app.get("/get-latest-reading/{room_id}")
def get_latest_reading(room_id: int, response: Response):
    df = None

    try:
        columns, results = db.execute_sql(sql.LATEST_READINGS_QUERY, args=(room_id,), column_names=True)
        print(columns)
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
                module_df.iloc[0]['position_x'],
                module_df.iloc[0]['position_y'],
                module_df.iloc[0]['position_z']
            ],
            "sensors": []
        })
        for sensor_id, sensor_df in module_df.groupby('sensor_id'):
            res[idx]["sensors"].append({
                'sensor_id' : sensor_id,
                'sensor_type' : sensor_df.iloc[0]['sensor_type'],
                'sensor_units' : sensor_df.iloc[0]['sensor_unit'],
                'readings': [
                    {
                        'value': sensor_df.iloc[0]['record_value'],
                        'time': int(sensor_df.iloc[0]['record_time'])
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
                module_df.iloc[0]['position_x'],
                module_df.iloc[0]['position_y'],
                module_df.iloc[0]['position_z']
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