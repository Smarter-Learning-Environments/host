import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import BrowserRouter
import RoomSelection from "./RoomSelection";
import RoomAdmin from "./RoomAdmin";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<RoomSelection />} />
            <Route path="/room-admin" element={<RoomAdmin />} />
        </Routes>
    </BrowserRouter>
);
