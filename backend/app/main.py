from fastapi import FastAPI
import paho.mqtt.client as mqtt

app = FastAPI()

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("$SYS/#")

mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.connect("mqtt-broker", 1883, 60)


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/")
def read_root():
    return {"message": "Hello, World!"}