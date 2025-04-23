import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import BrowserRouter
import Dashboard from "./Dashboard.js";
import RoomAdmin from "./RoomAdmin.js"

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/room-admin" element={<RoomAdmin />} />
        </Routes>
    </BrowserRouter>
);
