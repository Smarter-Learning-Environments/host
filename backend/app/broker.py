from . import utils as Utils, db
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    # client.subscribe("$SYS/#")
    client.subscribe("sensor_service/#")

def on_message(client, userdata, msg: mqtt.MQTTMessage):
    print(msg.topic+" "+str(msg.payload))

    # Topic contains:
    # sensor_service / Module ID / Sensor ID

    split_topic = msg.topic.split('/')
    module_id = split_topic[1].split('_')[1]
    sensor_id = split_topic[2].split('_')[1]

    # Payload contains:
    # TimestampUnix:Reading

    split_payload = str(msg.payload).split('\'')[1].split(":")
    time = int(split_payload[0])
    reading = float(split_payload[1])

    # print(f"{module_id} {sensor_id} {time} {reading}")

    code, msg = db.deposit_sensor_reading(module_id, sensor_id, record_time=time, record_value=reading)
    if code != 200: print(f"{code} {msg}")

    # TODO db dump

def setup_connection(host: str = Utils.ENV_VARS.MQTT_BROKER_HOST, port: int = 1883, keepalive: int = 60):
    mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqttc.on_connect = on_connect
    mqttc.on_message = on_message
    mqttc.connect(host, port, keepalive)
    mqttc.loop_start()
