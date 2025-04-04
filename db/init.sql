CREATE TABLE room (
    room_id SERIAL PRIMARY KEY,
    room_name varchar,
    x_max int,
    y_max int,
    z_max int,
    img_path varchar
);

INSERT INTO room (room_name, img_path) VALUES 
    ('E18', 'floorplan_0.png'),
    ('FS12', 'floorplan_1.png');

CREATE TABLE modules (
    -- position and model are not defined yet, but should be in the future
    module_id varchar PRIMARY KEY,
    room_id int NULL,
    position_x int NULL,
    position_y int NULL,
    position_z int NULL,
    model varchar NULL,
    FOREIGN KEY (room_id) REFERENCES room(room_id)
);

INSERT INTO modules (module_id, room_id, model, position_x, position_y, position_z) VALUES 
    ('b1:a2:5f:08:6c:c1', 1, 'Arduino', 200, 100, 0),
    ('00:11:22:33:44:55', 1, 'Pi', 400, 300, 0),
    ('66:77:88:99:AA:BB', 2, 'ESP32', 100, 200, 0);

CREATE TABLE sensors (
    sensor_id int NOT NULL,
    sensor_type varchar NULL,
    sensor_unit varchar NULL,
    module_id varchar NOT NULL,
    foreign key (module_id) references modules(module_id)
);

INSERT INTO sensors (sensor_type, sensor_unit, module_id, sensor_id) VALUES 
    ('CO2', 'PPM', 'b1:a2:5f:08:6c:c1', 1),
    ('Noise', 'dB', 'b1:a2:5f:08:6c:c1', 2),
    ('Humidity', '%', '00:11:22:33:44:55', 3),
    ('Temp', '°C', '00:11:22:33:44:55', 4),
    ('PM2.5', 'μg/m³', '66:77:88:99:AA:BB', 5);



INSERT INTO sensors (sensor_type, sensor_unit, module_id, sensor_id) VALUES ('Temp', '°C', 'b1:a2:5f:08:6c:c1', 2);

CREATE TABLE records (
    module_id varchar NOT NULL,
    -- record_time : unix time
    record_time int NOT NULL,
    record_value float NOT NULL,
    sensor_id int NOT NULL,

    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(module_id)
);

CREATE INDEX idx_record_time ON records (record_time);
CREATE INDEX idx_module_id ON modules (module_id);

INSERT INTO records (module_id, record_time, record_value, sensor_id) VALUES
    ('b1:a2:5f:08:6c:c1', 1743760700, 480, 1),
    ('b1:a2:5f:08:6c:c1', 1743760760, 490, 1),
    ('b1:a2:5f:08:6c:c1', 1743760700, 315, 2),
    ('b1:a2:5f:08:6c:c1', 1743760760, 332, 2),
    ('00:11:22:33:44:55', 1743760700, 55, 3),
    ('00:11:22:33:44:55', 1743760760, 53, 3),
    ('66:77:88:99:AA:BB', 1743760700, 21.5, 5),
    ('66:77:88:99:AA:BB', 1743760760, 22.0, 5);


CREATE TABLE registration (
    hw_id varchar(49) PRIMARY KEY,
    num_sensors int NOT NULL,
    module_id int
);