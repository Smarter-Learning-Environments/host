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
            time_points: [
                {
                    time: "1700000000",
                    modules: [
                        {
                            module_id: "0",
                            module_xyz: ["100", "50", "0"],
                            readings: [
                                {
                                    sensor_id: "2381",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "600"
                                },
                                {
                                    sensor_id: "2382",
                                    sensor_type: "temp",
                                    sensor_units: "celsius",
                                    value: "22"
                                }
                            ]
                        },
                        {
                            module_id: "1",
                            module_xyz: ["25, 25, 0"],
                            readings: [
                                {
                                    sensor_id: "20",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "100"
                                }
                            ]
                        }
                    ]
                },
                {
                    time: "1700000600",
                    modules: [
                        {
                            module_id: "0",
                            module_xyz: ["100", "50", "0"],
                            readings: [
                                {
                                    sensor_id: "2381",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "630"
                                },
                                {
                                    sensor_id: "2382",
                                    sensor_type: "temp",
                                    sensor_units: "celsius",
                                    value: "23"
                                }
                            ]
                        },
                        {
                            module_id: "1",
                            module_xyz: ["25, 25, 0"],
                            readings: [
                                {
                                    sensor_id: "20",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "500"
                                }
                            ]
                        }
                    ]
                },
                {
                    time: "1700001200",
                    modules: [
                        {
                            module_id: "0",
                            module_xyz: ["100", "50", "0"],
                            readings: [
                                {
                                    sensor_id: "2381",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "620"
                                },
                                {
                                    sensor_id: "2382",
                                    sensor_type: "temp",
                                    sensor_units: "celsius",
                                    value: "22.5"
                                }
                            ]
                        },
                        {
                            module_id: "1",
                            module_xyz: ["25, 25, 0"],
                            readings: [
                                {
                                    sensor_id: "20",
                                    sensor_type: "CO2",
                                    sensor_units: "ppm",
                                    value: "70"
                                }
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

        apiData.time_points.forEach((point) => {
            const time = new Date(parseInt(point.time) * 1000).toISOString();
            point.modules.forEach((mod) => {
                mod.readings.forEach((reading) => {
                    const { sensor_type, sensor_id, value } = reading;
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
                });
            });
        });

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
