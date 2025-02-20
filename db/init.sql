CREATE TABLE modules (module_id tinyint, position bit, model bit)
-- position and model are not defined yet, but should be in the future

CREATE TABLE sensors (sensor_id tinyint, sensor_type varchar, sensor_unit varchar )
CREATE TABLE records (module_ID tinyint, record_time datetime, record_value float(24), sensor_id)