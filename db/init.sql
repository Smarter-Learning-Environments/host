CREATE TABLE room (
    room_id SERIAL PRIMARY KEY,
    room_name varchar,
    x_max int,
    y_max int,
    z_max int
);

INSERT INTO room (room_name) VALUES ('Test room');

CREATE TABLE modules (
    -- position and model are not defined yet, but should be in the future
    module_id varchar PRIMARY KEY,
    room_id int,
    position_x int,
    position_y int,
    position_z int,
    model varchar,
    FOREIGN KEY (room_id) REFERENCES room(room_id)
);

INSERT INTO modules (module_id, room_id, model, position_x, position_y, position_z) VALUES ('b1:a2:5f:08:6c:c1', 1, 'UNKNOWN_MODEL', 0, 0, 0);

CREATE TABLE sensors (
    sensor_id int NOT NULL PRIMARY KEY,
    sensor_type varchar,
    sensor_unit varchar,
    module_id varchar NOT NULL,
    foreign key (module_id) references modules(module_id)
);

INSERT INTO sensors (sensor_type, sensor_unit, module_id, sensor_id) VALUES ('UNKNOWN_SENSOR', 'UNKNOWN_MODEL', 'b1:a2:5f:08:6c:c1', 1);
INSERT INTO sensors (sensor_type, sensor_unit, module_id, sensor_id) VALUES ('UNKNOWN_SENSOR_2', 'UNKNOWN_MODEL', 'b1:a2:5f:08:6c:c1', 2);

CREATE TABLE records (
    module_id varchar NOT NULL,
    -- record_time : unix time
    record_time int NOT NULL,
    record_value float NOT NULL,
    sensor_id int NOT NULL,

    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(module_id),
    CONSTRAINT fk_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
);

CREATE INDEX idx_record_time ON records (record_time);
CREATE INDEX idx_module_id ON modules (module_id);

INSERT INTO records (module_id, record_time, record_value, sensor_id) VALUES ('b1:a2:5f:08:6c:c1', 1300, 18, 1);

CREATE TABLE registration (
    hw_id varchar(49) PRIMARY KEY,
    num_sensors int NOT NULL,
    module_id int
);