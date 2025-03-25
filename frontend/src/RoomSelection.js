import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./style.css"; 
import floorplan from "./floorplan_0.png";
import SensorGraph from "./SensorGraph";

const RoomSelection = () => {
    const [selectedFactors, setSelectedFactors] = useState({
        co2: false,
        pm25: false,
        temp: false,
        humd: false,
    });

    const [sensorData, setSensorData] = useState({});

    useEffect(() => {
        const exampleData = {
            "modules": [
              {
                "module_id": 0,
                "module_xyz": [100, 50, 0],
                "sensors": [
                  {
                    "sensor_id": "2381",
                    "sensor_type": "CO2",
                    "sensor_units": "ppm",
                    "readings": [
                      { "value": 600, "time": 1700000000 },
                      { "value": 620, "time": 1700000600 },
                      { "value": 630, "time": 1700001200 }
                    ]
                  },
                  {
                    "sensor_id": "2382",
                    "sensor_type": "temp",
                    "sensor_units": "°C",
                    "readings": [
                      { "value": 21.5, "time": 1700000000 },
                      { "value": 22.0, "time": 1700000600 },
                      { "value": 21.8, "time": 1700001200 }
                    ]
                  }
                ]
              },
              {
                "module_id": 1,
                "module_xyz": [300, 75, 0],
                "sensors": [
                  {
                    "sensor_id": "9999",
                    "sensor_type": "CO2",
                    "sensor_units": "ppm",
                    "readings": [
                      { "value": 580, "time": 1700000000 },
                      { "value": 590, "time": 1700000600 },
                      { "value": 610, "time": 1700001200 }
                    ]
                  },
                  {
                    "sensor_id": "8888",
                    "sensor_type": "humd",
                    "sensor_units": "%",
                    "readings": [
                      { "value": 45, "time": 1700000000 },
                      { "value": 47, "time": 1700000600 },
                      { "value": 46, "time": 1700001200 }
                    ]
                  }
                ]
              }
            ]
          };          
        const grouped = processSensorData(exampleData);
        setSensorData(grouped);
    }, []);

    const fetchData = async (n) => {
        const res = await fetch(`/get-lastn-datapoints/${n}`);
        const data = await res.json();
        setSensorData(processSensorData(data));
    };

    const processSensorData = (apiData) => {
        const grouped = {};

        apiData.modules.forEach((module) => {
            const id = parseInt(module.module_id);
            const x = parseInt(module.module_xyz[0]);
            const y = parseInt(module.module_xyz[1]);
            const z = parseInt(module.module_xyz[2]);

            module.sensors.forEach((sensor) => {
                const sensor_id = parseInt(sensor.sensor_id);
                const sensor_type = sensor.sensor_type;
                const sensor_units = sensor.sensor_units;
                
                sensor.readings.forEach((reading) => {
                    const time = new Date(parseInt(reading.time) * 1000).toISOString();
                    const value = parseInt(reading.value);

                    if (!grouped[sensor_type]) grouped[sensor_type] = {};
                    if (!grouped[sensor_type][sensor_id]) {
                        grouped[sensor_type][sensor_id] = {
                            label: `Sensor ${sensor_id}`,
                            data: [],
                        };
                    }
                    grouped[sensor_type][sensor_id].data.push({
                        x: time,
                        y: parseFloat(value),
                    });
                })
            })

        })

        // apiData.time_points.forEach((point) => {
        //     const time = new Date(parseInt(point.time) * 1000).toISOString();
        //     point.modules.forEach((mod) => {
        //         mod.readings.forEach((reading) => {
        //             const { sensor_type, sensor_id, value } = reading;
        //             if (!grouped[sensor_type]) grouped[sensor_type] = {};
        //             if (!grouped[sensor_type][sensor_id]) {
        //                 grouped[sensor_type][sensor_id] = {
        //                     label: `Sensor ${sensor_id}`,
        //                     data: [],
        //                 };
        //             }
        //             grouped[sensor_type][sensor_id].data.push({
        //                 x: time,
        //                 y: parseFloat(value),
        //             });
        //         });
        //     });
        // });

        return grouped;
    };

    const [adminPass, setAdminPass] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [moduleData, setModuleData] = useState({type: "", units: ""});
    const imageRef = useRef(null);
    const originalSize = useRef({ width: 1, height: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        // Set the original image dimensions when it loads
        const img = new Image();
        img.src = floorplan;
        img.onload = () => {
            originalSize.current = { width: img.width, height: img.height };
        };
    }, []);

    const handleCheckboxChange = (event) => {
        const { id, checked } = event.target;
        setSelectedFactors((prev) => ({
            ...prev,
            [id]: checked,
        }));
    };

    const handleLogin = async (event) => {
        event.preventDefault();

        navigate("/room-admin");

        try {
            const response = await fetch("/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(adminPass),
            });

            if (!response.ok) {
                throw new Error("Contraseña Incorrecta");
            }

            // If login is successful, navigate to RoomAdmin.js
            navigate("/room-admin");
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    return (
        <div>

            <div className="container">
                <div className="image-container">
                    <img ref={imageRef} src={floorplan} alt="Floor Plan of the classroom" />
                </div>

                <div className="checkbox-container">
                    <table>
                        <thead>
                            <tr>
                                <th><b>Niveles Recomendados</b></th>
                                <th><b>Factores Ambientales</b></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><label>0 - 1000ppm</label></td>
                                <td>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            id="co2" 
                                            checked={selectedFactors.co2}
                                            onChange={handleCheckboxChange}
                                        /> CO2
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td><label>0 - 5 μg/m^3</label></td>
                                <td>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            id="pm25" 
                                            checked={selectedFactors.pm25}
                                            onChange={handleCheckboxChange} 
                                        /> PM2.5
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td><label>15 - 27°C</label></td>
                                <td>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            id="temp" 
                                            checked={selectedFactors.temp}
                                            onChange={handleCheckboxChange} 
                                        /> Temperatura
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td><label>30% - 60%</label></td>
                                <td>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            id="humd" 
                                            checked={selectedFactors.humd}
                                            onChange={handleCheckboxChange} 
                                        /> Humedad
                                    </label>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="graphs-container">
                {Object.entries(sensorData).map(([sensorType, sensors], idx) =>
                    selectedFactors[sensorType.toLowerCase()] ? (
                        <SensorGraph
                            key={sensorType}
                            title={sensorType}
                            sensorSeries={Object.values(sensors).map((s, i) => ({
                                ...s,
                                colorIndex: i
                            }))}
                        />
                    ) : null
                )}
            </div>

            <div className="admin-login">
                <a href="https://youtube.com" target="_blank">¡Toma nuestra encuesta!</a>
                <form onSubmit={handleLogin}>
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Contraseña Administrador"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        required
                    />
                    <button type="submit">Ingresar</button>
                    {errorMessage && <p className="error">{errorMessage}</p>}
                </form>
            </div>
        </div>
    );
};

export default RoomSelection;
