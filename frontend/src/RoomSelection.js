import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./style.css"; 
import floorplan from "./floorplan_0.png";

const RoomSelection = () => {
    const [selectedFactors, setSelectedFactors] = useState({
        co2: false,
        pm25: false,
        temp: false,
        humd: false,
    });

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
        <div className="container">
            <div className="image-container">
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
