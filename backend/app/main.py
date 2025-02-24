from fastapi import FastAPI
from . import broker

app = FastAPI()
broker.mqttc.loop_start()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/test_post")
def test_post():
    broker.publish.single("paho/test/topic", "payload", hostname="mqtt-broker")
    return {"message": "Hello, World!"}