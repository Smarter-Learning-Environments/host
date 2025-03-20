import psycopg2
from . import utils as Utils

conn = psycopg2.connect(
    database=Utils.ENV_VARS.DB_NAME,
    user=Utils.ENV_VARS.DB_USER,
    password=Utils.ENV_VARS.DB_PASS,
    host=Utils.ENV_VARS.DB_HOST,
)

# TODO wait to connect/retry on failure/status on root
# TODO persistent changes with conn.commit()

def get_latest_reading(room_id: int) -> list:
    try:
        # Join records to module, filter by room
        # Get latest data from each sensor in the room
        return (200, execute_sql(conn, """
                    SELECT DISTINCT ON (sensors.sensor_id) sensors.sensor_type, sensors.sensor_unit, record_to_module.*
                    FROM

                    (SELECT records.record_time, records.record_value, records.sensor_id, modules.*
                    FROM records
                    INNER JOIN modules ON records.module_id = modules.module_id AND modules.room_id = %s)
                    record_to_module
                    
                    INNER JOIN sensors ON record_to_module.sensor_id = sensors.sensor_id
                    ORDER BY sensors.sensor_id, record_time DESC;
        """, args=(room_id,), column_names=True))
    except psycopg2.Error as e:
        return (500, f"{type(e)} {e.diag.message_primary}")

def deposit_sensor_reading(module_id: int, sensor_id: int, record_time: int, record_value: float) -> tuple[int, str]:
    try:
        execute_sql(conn, "INSERT INTO records (module_id, record_time, record_value, sensor_id) VALUES (%s, %s, %s, %s);", args=(module_id, record_time, record_value, sensor_id))
        return (200, 'OK')
    except psycopg2.errors.ForeignKeyViolation as e:
        return (404, f"Unable to find module_id <{module_id}> or member sensor_id <{sensor_id}> : {e.pgerror}")
    except psycopg2.Error as e:
        return (500, f"{type(e)} {e.pgerror}")

        # TODO move error handling and error codes to calling function

def execute_sql(conn, sql: str, args: tuple = None, column_names: bool = False):
    """
    Use an existing connection to open a cursor and execute the given SQL.
    
    :param conn: Open postgres connection
    :param sql: SQL to run. Use %s to denote an argument
    :param args: Arguments to fill inside the SQL string
    :param column_names: Return query results and column names extracted from cursor information. 
    """
    with conn:
        with conn.cursor() as curs:
            if args:
                curs.execute(sql, args)
            else:
                curs.execute(sql)
            
            if(column_names):
                return([desc[0] for desc in curs.description], curs.fetchall())