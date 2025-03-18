from fastapi import FastAPI
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

@app.get("/test-db")
def test_db():
    db.deposit_sensor_reading(1, 1, 1, 1.1)
    return {"test_result", db.test_sensor_reading()[0]}

@app.get("/get-latest-reading/{room_id}")
def get_latest_reading(room_id: int):
    res = {"modules", []}
    res['modules'].append
    return {"test_endpoint", "gwagwa"}