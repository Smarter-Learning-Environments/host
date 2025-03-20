LATEST_READINGS_QUERY = """
SELECT DISTINCT ON (sensors.sensor_id) sensors.sensor_type, sensors.sensor_unit, record_to_module.*
FROM
    
    (
    SELECT records.record_time, records.record_value, records.sensor_id, modules.*
    FROM records
    INNER JOIN modules ON records.module_id = modules.module_id AND modules.room_id = %s
    ) record_to_module

INNER JOIN sensors ON record_to_module.sensor_id = sensors.sensor_id
ORDER BY sensors.sensor_id, record_time DESC;
"""

SAVE_SENSOR_READING = """
INSERT INTO records (module_id, record_time, record_value, sensor_id)
VALUES (%s, %s, %s, %s);
"""