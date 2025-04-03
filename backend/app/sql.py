GET_ROOM_QUERY = """
    SELECT * FROM room
"""

UPDATE_UNREG_QUERY = """
    UPDATE registration SET module_id = %s WHERE hw_id = %s
"""

GET_UNREG_QUERY = """
    SELECT hw_id, num_sensors FROM registration WHERE module_id IS NULL;
"""

INSERT_MODULE_QUERY = """
    INSERT INTO modules (room_id, position_x, position_y, position_z)
    VALUES (%s, %s, %s, %s)
    RETURNING module_id;
"""

INSERT_SENSOR_QUERY = """
    INSERT INTO sensors (sensor_type, sensor_unit, module_id)
    VALUES (%s, %s, %s);
"""

LATEST_READINGS_QUERY = """
SELECT 
    m.module_id,
    m.position_x,
    m.position_y,
    m.position_z,
    m.room_id,
    s.sensor_id,
    s.sensor_type,
    s.sensor_unit,
    r.record_time,
    r.record_value
FROM modules m
LEFT JOIN sensors s ON m.module_id = s.module_id
LEFT JOIN LATERAL (
    SELECT r.record_time, r.record_value
    FROM records r
    WHERE r.sensor_id = s.sensor_id AND r.module_id = m.module_id
    ORDER BY r.record_time DESC
    LIMIT 1
) r ON true
WHERE m.room_id = %s;

""" # params: Room ID

READINGS_TIMERANGE_QUERY = """
SELECT
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
ORDER BY modules.module_id, sensors.sensor_id, records.record_time DESC;
""" # params: Minimum record time, maximum record time

SAVE_SENSOR_READING = """
INSERT INTO records (module_id, record_time, record_value, sensor_id)
VALUES (%s, %s, %s, %s);
""" # params: Module ID, record time, record value, sensor ID

DISCOVER_MODULE = """
INSERT INTO modules (module_id) VALUES (%s);
INSERT INTO sensors (module_id, sensor_id) SELECT %s, i FROM generate_series(0, %s) AS i;
""" # params: Module ID, Module ID, # sensors
