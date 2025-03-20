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
        df = pd.DataFrame(results, columns=columns)
    except psycopg2.Error as e:
        response.status_code = 500
        return {"error": type(e), "msg": e.pgerror}

    res = []
    for module_id, module_df in df.groupby('module_id'):
        print(module_df)
        res.append({
            "module_id": module_id,
            "module_xyz": [
                module_df.iloc[0]['position_x'],
                module_df.iloc[0]['position_y'],
                module_df.iloc[0]['position_z']
            ],
            "readings": [
                # TODO
            ]
        })
    return res