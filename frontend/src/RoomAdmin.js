import React, { useState, useRef, useEffect } from "react";
import "./style.css"; 
import { useNavigate } from "react-router-dom";
import { RoomSelector, DataTooltip } from "./subcomponents/";

const RoomSelection = () => {
    const [selectedFactors, setSelectedFactors] = useState({
        co2: false,
        pm25: false,
        temp: false,
        humd: false,
    });

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showPopup, setShowPopup] = useState(false);
    const [moduleData, setModuleData] = useState({type: "", units: ""});
    const imageRef = useRef(null);
    const originalSize = useRef({ width: 1, height: 1 });
    const [sensors, setSensors] = useState([{ sensor_type: "", sensor_unit: "" }]);
    const [recentMousePos, setRecentMousePos] = useState({ x: 0, y: 0});
    const [latestModules, setLatestModules] = useState([]);
    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: ""
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const [roomNumber, setRoomNumber] = useState(1);
    const [roomData, setRoomData] = useState([]);
    const [unregisteredModule, setUnregisteredModule] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);

    //CHECK FOR UNREGISTERED MODULES

    

    useEffect(() => {
        setIsLoggedIn(document.cookie
          .split("; ")
          .find((row) => row.startsWith("admin_logged_in="))
          ?.split("=")[1] === "true");
      }, [navigate]);

    const fetchAll = async () => {
        try {
            await fetchLast();
            await fetchRoomData();
            await fetchUnregisteredModule();
        } catch (err) {
            console.error("Error during data fetch:", err);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [roomNumber, showPopup]);

    const fetchUnregisteredModule = async () => {
        try {
            const res = await fetch("http://localhost:8000/get-unregistered-module");
            const data = await res.json();
            setUnregisteredModule(data);
        } catch (err) {
            console.error("Failed to fetch unregistered modules:", err);
        }
    };

    const fetchRoomData = async () => {
        try {
            const res = await fetch(`http://localhost:8000/get-room-data`);
            const data = await res.json();
            setRoomData(data);
        } catch (err) {
            console.error("Error fetching room data: ",err);
        }
    }

    useEffect(() => {
        if (!roomNumber) return;

        const img = new Image();
        img.src = `/images/floorplan_${roomNumber}.png`;
        img.onload = () => {
            originalSize.current = { width: img.width, height: img.height };
        };
    }, [roomNumber]);

    const handleFloorPlanClick = (event) => {
        if(selectedModule === null) return;

        //set recent mousePos click
        setRecentMousePos({x: mousePos.x, y: mousePos.y});
        //open popup
        setShowPopup(true);
    };

    const handleInputChange = (index, field, value) => {
        setSensors(prevSensors => {
          const updated = [...prevSensors];
          updated[index] = {
            ...updated[index],
            [field]: value // only update 'sensor_type' or 'sensor_unit'
          };
          return updated;
        });
      };

    const handleMouseMove = (event) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect(); // Get displayed image position
        const x = event.clientX - rect.left; // X relative to image
        const y = event.clientY - rect.top;  // Y relative to image

        const scaleX = originalSize.current.width / rect.width; // Scaling factor for X
        const scaleY = originalSize.current.height / rect.height; // Scaling factor for Y

        const trueX = Math.round(x * scaleX); // Normalize X
        const trueY = Math.round(y * scaleY); // Normalize Y

        setMousePos({ x: trueX, y: trueY }); // Normalized coordinates
    };

    const handleCancel = () => {
        setSelectedModule(null);
        setShowPopup(false)
    };
    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            hw_id: selectedModule.hw_id,
            room_id: roomNumber,
            x: recentMousePos.x.toString(),
            y: recentMousePos.y.toString(),
            z: 0,
            sensors: sensors.map(s => ({
                original_type: s.original_type,
                sensor_type: s.sensor_type,
                sensor_unit: s.sensor_unit
              }))
        };

        try {
            const response = await fetch("http://localhost:8000/register-module", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to place module");

            alert("Module placed successfully!");
            await fetchAll();
            setSelectedModule(null);
            setShowPopup(false);
            setSensors([{ sensor_type: "", sensor_unit: "" }]); // Reset form
        } catch (error) {
            alert(error.message);
        }
    };

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

    const fetchLast = async () => {
        try {
            const res = await fetch(`http://localhost:8000/get-latest-reading/${roomNumber}`);
            const data = await res.json();
            setLatestModules(data);
        } catch (err) {
            console.error("Error fetching latest: ", err);
        }
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

    const handleLogout = () => {
        document.cookie = "admin_logged_in=; path=/; max-age=0";
        navigate("/");
    };
      
    const handleRegister = async (formData) => {
    try {
        const res = await fetch("http://localhost:8000/register-module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error("Failed to register module");
        alert("Module registered successfully!");

        // Refresh unregistered list
        fetchUnregisteredModule();

    } catch (err) {
        console.error(err);
        alert("Error registering module.");
    }
};

const handleSelectModule = (module) => {
    setSelectedModule(module);

    // Auto-fill with empty sensor_type/unit fields
    const prefilled = [];
    for(const sensor of module.sensors) {
        prefilled.push({
            "original_type": sensor.sensor_type,
            "sensor_type": sensor.sensor_type, 
            "sensor_unit": sensor.sensor_unit
        });
    }
    setSensors(prefilled);
};
    
    return (
        <div>
            {isLoggedIn && (
                <div className="admin-container">
                    <div className="image-container" onMouseMove={handleMouseMove} onClick={handleFloorPlanClick}>
                        <img ref={imageRef} src={`images/floorplan_${roomNumber}.png`} alt="Floor Plan of the classroom" />
                        {!showPopup && Array.isArray(latestModules) && 
                            latestModules.map((module, index) => {
                                const {left, top} = scalePosition(module.module_xyz[0], module.module_xyz[1]);
                                if(module.module_xyz[0] < 0) return null;
                                return (
                                    <div
                                        key={index}
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
                                            setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                                        }}
                                        onMouseLeave={() => {
                                            setTooltip(prev => ({ ...prev, visible: false}));
                                        }}
                                    />
                                )
                        })}
                    </div>

                    {Object.keys(unregisteredModule).length > 0 && (
                        <div className={`placement-alert ${selectedModule ? "selected-module" : ""}`}>
                            <h3>Se encontró un módulo no registrado</h3>
                            <p>ID: {unregisteredModule.hw_id}</p>
                            <button onClick={() => handleSelectModule(unregisteredModule)}>Colocar este módulo</button>
                        </div>
                    )}

                    <div className="admin-logout">
                        <button onClick={handleLogout}>Cerrar sesión</button>
                    </div>

                    {showPopup && (
                            <div className="popup-overlay">
                                <div className="popup-content">
                                    <h2>Colocar Módulo</h2>
                                    <p>Posición: X: {recentMousePos.x}, Y: {recentMousePos.y}</p>
                                    <form onSubmit={handleSubmit}>
                                        {sensors.map((sensor, index) => (
                                            <div key={index} className="sensor-row">
                                                <input 
                                                    type="text" 
                                                    placeholder="Sensor Type"
                                                    value={sensor.sensor_type}
                                                    onChange={(e) => handleInputChange(index, "sensor_type", e.target.value)}
                                                    required
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Sensor Unit"
                                                    value={sensor.sensor_unit}
                                                    onChange={(e) => handleInputChange(index, "sensor_unit", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                        <button type="submit">Enviar</button>
                                        <button type="button" onClick={handleCancel}>Cancelar</button>
                                    </form>
                                </div>
                            </div>
                    )}

                    <RoomSelector roomData={roomData} selectedRoom={roomNumber} onChange={setRoomNumber} />

                    {tooltip.visible && !showPopup && (
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

                </div>)}
                
            {!isLoggedIn && (
                <label className="error-msg">
                    Error! Not authenticated as admin
                </label>
            )}



        </div>
    );
};

export default RoomSelection;
