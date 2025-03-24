LATEST_READINGS_QUERY = """
SELECT DISTINCT ON (sensors.sensor_id) 
    sensors.sensor_id,
    sensors.sensor_type, 
    sensors.sensor_unit, 
    records.record_time, 
    records.record_value, 
    modules.*
FROM records
INNER JOIN modules ON records.module_id = modules.module_id
INNER JOIN sensors ON records.sensor_id = sensors.sensor_id
WHERE modules.room_id = %s
ORDER BY sensors.sensor_id, records.record_time DESC;
""" # params: Room ID

READINGS_TIMERANGE_QUERY = """
SELECT DISTINCT ON (sensors.sensor_id) 
    sensors.sensor_id,
    sensors.sensor_type, 
    sensors.sensor_unit, 
    records.record_time, 
    records.record_value, 
    modules.*
FROM records
INNER JOIN modules ON records.module_id = modules.module_id
INNER JOIN sensors ON records.sensor_id = sensors.sensor_id
WHERE records.record_time >= %s AND records.record_time <= %s
ORDER BY sensors.sensor_id, records.record_time DESC;
""" # params: Minimum record time, maximum record time

SAVE_SENSOR_READING = """
INSERT INTO records (module_id, record_time, record_value, sensor_id)
VALUES (%s, %s, %s, %s);
""" # params: Module ID, record time, record value, sensor ID