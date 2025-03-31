from . import utils, db, sql
import time
import psycopg2
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
    # TODO sensor type, not sensor ID

    split_topic = msg.topic.split('/')
    service = split_topic[0] # TODO reply based on service type
    module_id = split_topic[1].split('_')[1] # TODO test/allow underscore in module name
    sensor_id = split_topic[2].split('_')[1]

    # Payload contains:
    # TimestampUnix:Reading

    split_payload = str(msg.payload).split('\'')[1].split(":")
    # msg_time = int(split_payload[0])
    msg_time = int(time.time()) # TODO use sensor time
    reading = float(split_payload[1])

    try:
        db.execute_sql(sql.SAVE_SENSOR_READING, args=(module_id, msg_time, reading, sensor_id))
    except psycopg2.errors.ForeignKeyViolation as e:
        print(f"Unable to find module_id <{module_id}> or member sensor_id <{sensor_id}> : {e.pgerror}")
    except psycopg2.Error as e:
        print(f"{type(e)} {e.pgerror}")

    # TODO db dump
    

def setup_connection(host: str = utils.ENV_VARS.MQTT_BROKER_HOST, port: int = 1883, keepalive: int = 60):
    mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqttc.on_connect = on_connect
    mqttc.on_message = on_message
    mqttc.connect(host, port, keepalive)
    mqttc.loop_start()
