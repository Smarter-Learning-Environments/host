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
    module_id SERIAL PRIMARY KEY,
    room_id int,
    position_x int,
    position_y int,
    position_z int,
    model varchar,
    FOREIGN KEY (room_id) REFERENCES room(room_id)
);

INSERT INTO modules (room_id, model) VALUES (1, 'UNKNOWN_MODEL');

CREATE TABLE sensors (
    sensor_id SERIAL PRIMARY KEY,
    sensor_type varchar,
    sensor_unit varchar,
    module_id int,
    foreign key (module_id) references modules(module_id)
);

INSERT INTO sensors (sensor_type, sensor_unit, module_id) VALUES ('UNKNOWN_SENSOR', 'UNKNOWN_MODEL', 1);

CREATE TABLE records (
    module_id int NOT NULL,
    -- record_time : unix time
    record_time int,
    record_value float,
    sensor_id int NOT NULL,

    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(module_id),
    CONSTRAINT fk_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
);