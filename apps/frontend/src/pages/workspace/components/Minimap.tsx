import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./Minimap.css";

interface MinimapProps {
    elements: CanvasElement[];
    viewport: { x: number; y: number; zoom: number };
    onViewportChange: (x: number, y: number) => void;
}

const Minimap: React.FC<MinimapProps> = (_props) => {
    // In a real implementation, this would compute the bounding box of all elements
    // and scale them down to fit in the minimap container.
    // For now, this is a placeholder visually matching the design.
    return (
        <div className="minimap-container">
            <div className="minimap-content">
                {/* Simplified visual representation of elements */}
                <div className="minimap-el minimap-el-blue" style={{ top: '20%', left: '30%', width: '15%', height: '20%' }} />
                <div className="minimap-el minimap-el-red" style={{ top: '25%', left: '50%', width: '25%', height: '30%' }} />
                <div className="minimap-el minimap-el-yellow" style={{ top: '65%', left: '60%', width: '15%', height: '15%' }} />
                
                {/* Viewport indicator */}
                <div className="minimap-viewport" />
            </div>
            <div className="minimap-label">MAP</div>
        </div>
    );
};

export default Minimap;
