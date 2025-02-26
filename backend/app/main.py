from fastapi import FastAPI
from . import broker as Broker
from . import db

def startServer() -> FastAPI:
    Broker.setup_connection()
    return FastAPI()

app = startServer()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/test_post")
def test_post():
    Broker.publish.single("paho/test/topic", "payload", hostname="mqtt-broker")
    return {"message": "Hello, World!"}

@app.get("/test_db")
def test_db():
    return {"test_result", db.selectTest()}