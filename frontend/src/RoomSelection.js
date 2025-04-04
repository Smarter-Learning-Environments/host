import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./style.css"; 
import SensorGraph from "./SensorGraph";

const RoomSelection = () => {
    const [selectedFactors, setSelectedFactors] = useState({
        co2: false,
        pm25: false,
        temperatura: false,
        humedad: false,
    });
    const [adminPass, setAdminPass] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const imageRef = useRef(null);
    const originalSize = useRef({ width: 1, height: 1 });
    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: ""
    });
    const [latestModules, setLatestModules] = useState([]);
    const [sensorData, setSensorData] = useState([]);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isNoData, setIsNoData] = useState(false);
    const [firstDataFetch, setFirstDataFetch] = useState(true);
    const [roomNumber, setRoomNumber] = useState(1);
    const [roomData, setRoomData] = useState([]);

    const navigate = useNavigate();

    useLayoutEffect(() => {
        const handleResize = () => {
            setLatestModules((prev) => [...prev]);
        };
    
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    useEffect(() => {
        const fetchAll = async () => {
            try {
                await fetchLast();
                await fetchData();
                await fetchRoomData();
            } catch (err) {
                console.error("Error during data fetch:", err);
            }
        };
    
        fetchAll();
    }, [roomNumber]);

    const fetchRoomData = async () => {
        try {
            const res = await fetch(`http://localhost:8000/get-room-data`);
            const data = await res.json();
            setRoomData(data);
        } catch (err) {
            console.error("Error fetching room data: ",err);
        }
    }
 
    const fetchLast = async () => {
        try {
            const res = await fetch(`http://localhost:8000/get-latest-reading/${roomNumber}`);
            const data = await res.json();
            setLatestModules(data);
        } catch (err) {
            console.error("Error fetching lateest: ", err);
        }
    };

    const fetchData = async () => {

        try {
            const startMS = Math.floor(new Date(startTime).getTime()/1000);
            const endMS = Math.floor(new Date(endTime).getTime()/1000);
            console.log(`Start: ${startMS}, end: ${endMS}`);
            const res = await fetch(`http://localhost:8000/get-data-timerange/${roomNumber}/${startMS}/${endMS}`);
            const data = await res.json();

            setIsNoData(!firstDataFetch && Object.keys(data).length === 0);
            setFirstDataFetch(false);

            setSensorData(processSensorData(data));

        } catch (err) {
            console.error("Error fetching data timerange: ", err);
        }
    };

    const processSensorData = (apiData) => {
        const grouped = {};

        apiData.forEach((module) => {
            const id = module.module_id;
            const x = module.module_xyz[0];
            const y = module.module_xyz[1];
            const z = module.module_xyz[2];

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

        return grouped;
    };

    useEffect(() => {
        console.log("selectedRoom:", roomNumber);
        console.log(`images/floorplan_${roomNumber}.png`)
    }, [roomNumber]);

    useEffect(() => {
        if (!roomNumber) return;

        const img = new Image();
        img.src = `/images/floorplan_${roomNumber}.png`;
        img.onload = () => {
            originalSize.current = { width: img.width, height: img.height };
        };
    }, [roomNumber]);

    const scalePosition = (x, y) => {
        if (!imageRef.current || !originalSize.current) return { left: 0, top: 0 };
    
        const rect = imageRef.current.getBoundingClientRect();
    
        const scaleX = rect.width / originalSize.current.width;
        const scaleY = rect.height / originalSize.current.height;
    
        return {
            left: x * scaleX,
            top: y * scaleY
        };
    };

    const getTooltipContent = (module) => {
        return (
            `<strong>ID del Módulo:</strong> ${module.module_id}<br/>` +
            module.sensors.map(sensor => {
                const latest = sensor.readings.at(-1); // Get the most recent reading
                return `${sensor.sensor_type}: ${latest.value} ${sensor.sensor_units}`;
            }).join("<br/>")
        );
    };
    
    const handleLogin = async (event) => {
        event.preventDefault();

        navigate("/room-admin");

        try {
            // const response = await fetch("/admin-login", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify(adminPass),
            // });

            // if (!response.ok) {
            //     throw new Error("Contraseña Incorrecta");
            // }

            // If login is successful, navigate to RoomAdmin.js
            document.cookie = "admin_logged_in=true; path=/; max-age=3600";
            navigate("/room-admin");
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleStartPick = (e) => {
        setStartTime(e.target.value);
    }
    const handleEndPick = (e) => {
        setEndTime(e.target.value);
    }
    const handleTimeSubmit = () => {
        fetchData();
    }

    return (
        <div className="main-container">

            <div className="container">
                <div className="image-container">
                    <img ref={imageRef} src={`images/floorplan_${roomNumber}.png`} alt="Floor Plan of the classroom" />
                        {latestModules.map((module, index) => {
                            const { left, top } = scalePosition(module.module_xyz[0], module.module_xyz[1]);

                            return (
                                <div
                                    key={module.module_id}
                                    className="sensor-dot"
                                    style={{ left: `${left}px`, top: `${top}px` }}
                                    onMouseEnter={(e) => {
                                        setTooltip({
                                        visible: true,
                                        x: e.clientX,
                                        y: e.clientY,
                                        content: getTooltipContent(module)
                                        });
                                    }}
                                    onMouseMove={(e) => {
                                        setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip((prev) => ({ ...prev, visible: false }));
                                    }}
                                />
                            );
                        })}

                </div>

                {/* <div className="checkbox-container">
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
                                <td><label>0 - 5 μg/m³</label></td>
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
                </div> */}
                <div className="timerangeinput">
                    <table><tbody>
                        <tr>
                            <td><label>Fecha de Inicio</label></td>
                            <td><input id="start" type="datetime-local" name="Start" value={startTime} onChange={handleStartPick}/></td>
                        </tr>
                        <tr>
                            <td><label>Fecha de Fin</label></td>
                            <td><input id="end" type="datetime-local" name="End" value={endTime} onChange={handleEndPick}/></td>
                        </tr>
                    </tbody></table>
                    <button id="submittime" onClick={handleTimeSubmit}>Enviar</button>
                </div>
            </div>
            

            <div className="graphs-container">
                {isNoData && (
                    <label className="error-msg">¡No se encontraron datos en el rango de tiempo seleccionado!</label> )}
                {Object.entries(sensorData).map(([sensorType, sensors], idx) =>
                        <div className="graph-bg">
                            <SensorGraph
                                key={sensorType}
                                title={sensorType}
                                sensorSeries={Object.values(sensors).map((s, i) => ({
                                    ...s,
                                    colorIndex: i
                                }))}
                            />
                        </div>
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
                    {errorMessage && <p className="error-msg">{errorMessage}</p>}
                </form>
            </div>

            {tooltip.visible && (
                <div
                    className="tooltip"
                    style={{
                        position: "fixed",
                        left: tooltip.x + 10,
                        top: tooltip.y + 10,
                        background: "white",
                        border: "1px solid #ccc",
                        padding: "8px",
                        borderRadius: "4px",
                        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
                        zIndex: 999,
                        pointerEvents: "none",
                        fontSize: "12px"
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltip.content }}
                />
            )}

            <div className="room-selector">
                <label>Room</label>
                <select value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}>
                    {roomData.map((room, index) => {
                        return (
                            <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                        )
                    })}
                </select>
            </div>

        </div>
    );
};

export default RoomSelection;
