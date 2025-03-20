import React, { useState, useRef, useEffect } from "react";
import "./style.css"; 
import floorplan from "./floorplan_0.png";

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

    const handleFloorPlanClick = (event) => {
        //set recent mousePos click
        setRecentMousePos({x: mousePos.x, y: mousePos.y});
        //open popup
        setShowPopup(true);
    };

    

    const handleInputChange = (index, field, value) => {
        const updatedSensors = [...sensors];
        updatedSensors[index][field] = value;
        setSensors(updatedSensors);
    };

    const addSensor = () => {
        setSensors([...sensors, { sensor_type: "", sensor_unit: "" }]);
    };

    const removeSensor = (index) => {
        if (sensors.length === 1) return;
        const updatedSensors = sensors.filter((_, i) => i !== index);
        setSensors(updatedSensors);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            x: recentMousePos.x.toString(),
            y: recentMousePos.y.toString(),
            sensors: sensors.filter(sensor => sensor.sensor_type && sensor.sensor_unit)
        };

        try {
            const response = await fetch("/place-module", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to place module");

            alert("Module placed successfully!");
            setShowPopup(false);
            setSensors([{ sensor_type: "", sensor_unit: "" }]); // Reset form
        } catch (error) {
            alert(error.message);
        }
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

    return (
        <div>
        <div className="container">
            <div className="image-container" onMouseMove={handleMouseMove} onClick={handleFloorPlanClick}>
                <img ref={imageRef} src={floorplan} alt="Floor Plan of the classroom" />
            </div>
            <div className="checkbox-container">
                <table>
                    <thead>
                        <tr>
                            <th><b>Niveles Seguros</b></th>
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
        <div className="mouse-coordinates">
            X: {mousePos.x}px, Y: {mousePos.y}px
        </div>
            {showPopup && (
                    <div className="popup-overlay">
                        <div className="popup-content">
                            <h2>Place Module</h2>
                            <p>Position: X: {recentMousePos.x}, Y: {recentMousePos.y}</p>
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
                                        <button type="button" onClick={() => removeSensor(index)}>-</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addSensor}>+ Add Sensor</button>
                                <button type="submit">Submit</button>
                                <button type="button" onClick={() => setShowPopup(false)}>Cancel</button>
                            </form>
                        </div>
                    </div>
                )}
        </div>

    );
};

export default RoomSelection;
