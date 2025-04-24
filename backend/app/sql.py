GET_FLOORPLAN_QUERY = """
    SELECT img_data FROM room WHERE room_id = %s
"""

INSERT_FLOORPLAN_QUERY = """
    UPDATE room SET img_data = %s WHERE room_id = %s
"""

LOGIN_ADMIN_QUERY = """
    SELECT pass FROM credentials WHERE id = 1;
"""

GET_ALL_DATA_QUERY = """
    SELECT 
        r.room_id,
        r.room_name,
        r.img_path,
        m.module_id,
        m.position_x,
        m.position_y,
        m.position_z,
        s.sensor_id,
        s.sensor_type,
        s.sensor_unit,
        rec.record_time,
        rec.record_value
    FROM room r
    LEFT JOIN modules m ON r.room_id = m.room_id
    LEFT JOIN sensors s ON m.module_id = s.module_id
    LEFT JOIN records rec ON s.sensor_id = rec.sensor_id
    ORDER BY r.room_id, m.module_id, s.sensor_id, rec.record_time;
"""

GET_ROOM_QUERY = """
    SELECT * FROM room
"""

UPDATE_UNREG_QUERY = """
    UPDATE registration SET module_id = %s WHERE hw_id = %s
"""

GET_SENSORS_FROM_ID_QUERY = """
    SELECT sensor_id, sensor_type, sensor_unit FROM sensors WHERE module_id = %s
"""

GET_UNREG_QUERY = """
    SELECT module_id FROM modules WHERE position_x IS NULL;
"""

UPDATE_MODULE_QUERY = """
    UPDATE modules 
    SET room_id = %s,
        position_x = %s,
        position_y = %s,
        position_z = %s
    WHERE module_id = %s
"""

UPDATE_SENSOR_QUERY = """
    UPDATE sensors
    SET sensor_type = %s,
        sensor_unit = %s
    WHERE module_id = %s AND sensor_type = %s;
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
WHERE modules.room_id = %s AND records.record_time >= %s AND records.record_time <= %s
ORDER BY modules.module_id, sensors.sensor_id, records.record_time DESC;
""" # params: Minimum record time, maximum record time

SAVE_SENSOR_READING = """
INSERT INTO records (module_id, record_time, record_value, sensor_id)
VALUES (%s, %s, %s, %s);
""" # params: Module ID, record time, record value, sensor ID

DISCOVER_MODULE = """
INSERT INTO modules (module_id) VALUES (%s);
""" # params: Module ID

DISCOVER_SENSOR = """
INSERT INTO sensors (module_id, sensor_id, sensor_type) SELECT %s, %s, %s;
""" # params: Module ID, Sensor ID, Sensor Type
