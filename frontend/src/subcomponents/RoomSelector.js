import React from "react";

const RoomSelector = ({roomData, selectedRoom, onChange}) => (
        <div className="room-selector">
            <label>Cuarto</label>
            <select value={selectedRoom} onChange={(e) => onChange(e.target.value)}>
                {roomData.map((room, index) => {
                    return (
                        <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                    )
                })}
            </select>
        </div>
);

export default RoomSelector;