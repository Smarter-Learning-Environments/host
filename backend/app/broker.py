from . import utils as Utils
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("$SYS/#")

def setup_connection(host: str = Utils.ENV_VARS.MQTT_BROKER_HOST, port: int = 1883, keepalive: int = 60):
    mqttc.connect(host, port, keepalive)
    mqttc.loop_start()

mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect