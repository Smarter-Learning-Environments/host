import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./style.css"; 
import { RoomSelector, DataTooltip, Spinner, SensorGraph} from "./subcomponents";

const Dashboard = () => {
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
    const [loading, setLoading] = useState(false);

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
            const res = await fetch(`http://${window.location.hostname}:8000/get-room-data`);
            const data = await res.json();
            setRoomData(data);
        } catch (err) {
            console.error("Error fetching room data: ",err);
        }
    }
 
    const fetchLast = async () => {
        try {
            const res = await fetch(`http://${window.location.hostname}:8000/get-latest-reading/${roomNumber}`);
            const data = await res.json();
            if(Array.isArray(data)) {
                setLatestModules(data);
            }
        } catch (err) {
            console.error("Error fetching latest: ", err);
        }
    };

    const fetchData = async () => {

        try {
            var startMS = Math.floor(new Date(startTime).getTime()/1000);
            var endMS = Math.floor(new Date(endTime).getTime()/1000);

            if(startMS === 0 && endMS === 0) { //last hour
                endMS = Math.floor(Date.now()/1000);
                startMS = endMS - 60*60;
            }
            else if (startMS === 0) { //hour before endMS
                startMS = endMS - 60*60;
            }
            else if (endMS === 0) { //hour after startMS
                endMS = startMS + 60*60;
            }
            
            // console.log(`Start: ${startMS}, end: ${endMS}`);
            const res = await fetch(`http://${window.location.hostname}:8000/get-data-timerange/${roomNumber}/${startMS}/${endMS}`);
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

        if(!Array.isArray(apiData)) {
            return {};
        }

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
                            units: sensor_units,
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
        // console.log("selectedRoom:", roomNumber);
        // console.log(`images/floorplan_${roomNumber}.png`)
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

        try {
            const response = await fetch(`http://${window.location.hostname}:8000/login-admin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPass })
            });

            const data = await response.json(); // Parse the response body

            if(data.error) {
                throw new Error(data.error);
            }

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

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://${window.location.hostname}:8000/export-data`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "data.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error fetching export data: ", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-container">

            <div className="container">
                <div className="image-container">
                    <img ref={imageRef} src={`http://${window.location.hostname}:8000/get-floorplan?room_number=${roomNumber}`} alt="Floor Plan of the classroom" />
                        { (latestModules.length > 0) && latestModules.map((module, index) => {
                            const { left, top } = scalePosition(module.module_xyz[0], module.module_xyz[1]);
                            if(module.module_xyz[0] < 0) return null;
                            return (<div
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
                <a href="https://wpi.qualtrics.com/jfe/form/SV_bHPaIcQzv8w9A3Q" target="_blank">¡Toma nuestra encuesta!</a>
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

            <RoomSelector roomData={roomData} selectedRoom={roomNumber} onChange={setRoomNumber} />

            <div>
                {loading && <Spinner />}
                <button className="export-button" onClick={handleExport}>Exportar Datos</button>
            </div>

            <DataTooltip tooltip={tooltip} />

        </div>
    );
};

export default Dashboard;
