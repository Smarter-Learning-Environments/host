import React from "react";
import "../style.css";

const Spinner = () => (
    <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Procesando...</p>
    </div>
);

export default Spinner;