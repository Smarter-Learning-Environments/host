import psycopg2
from . import utils as Utils

# TODO env vars
conn = psycopg2.connect(
    database=Utils.ENV_VARS.DB_NAME,
    user=Utils.ENV_VARS.DB_USER,
    password=Utils.ENV_VARS.DB_PASS,
    host=Utils.ENV_VARS.DB_HOST,
)

# TODO wait to connect
# TODO persistent changes with conn.commit()

def deposit_sensor_reading(module_id: int, sensor_id: int, record_time: int, record_value: float) -> bool:
    with conn:
        with conn.cursor() as curs:
            curs.execute("INSERT INTO records (module_id, record_time, record_value, sensor_id) VALUES (%s, %s, %s, %s);", (module_id, record_time, record_value, sensor_id))

            # TODO status code

def test_sensor_reading() -> list[tuple]:
    with conn:
        with conn.cursor() as curs:
            curs.execute("SELECT * FROM records")
            return curs.fetchall()
        
            # TODO status code