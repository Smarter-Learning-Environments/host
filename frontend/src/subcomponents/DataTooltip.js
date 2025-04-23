import React from "react";

const DataTooltip = ({tooltip}) => 
    tooltip.visible && (
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
    );

export default DataTooltip;