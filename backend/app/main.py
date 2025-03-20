import pandas as pd
from fastapi import FastAPI, Response, status
from . import broker, db

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
    code, query =  db.get_latest_reading(room_id=room_id)
    response.status_code = code
    df = pd.DataFrame(query[1], columns=query[0])
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