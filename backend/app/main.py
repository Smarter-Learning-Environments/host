from fastapi import FastAPI
from . import broker, db

def startServer() -> FastAPI:
    broker.setup_connection()
    return FastAPI()

app = startServer()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/test_post")
def test_post():
    broker.publish.single("paho/test/topic", "message", hostname="mqtt-broker")
    return {"message": "Hello, World!"}

@app.get("/test_db")
def test_db():
    return {"test_result", db.selectTest()}