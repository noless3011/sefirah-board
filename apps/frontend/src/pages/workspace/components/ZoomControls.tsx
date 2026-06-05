import React from "react";
import "./ZoomControls.css";

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
}) => {
    const percentage = Math.round(zoom * 100);

    return (
        <div className="zoom-controls">
            <button
                className="zoom-controls__btn"
                onClick={onZoomOut}
                aria-label="Zoom out"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
            <span className="zoom-controls__value">{percentage}%</span>
            <button
                className="zoom-controls__btn"
                onClick={onZoomIn}
                aria-label="Zoom in"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    );
};

export default ZoomControls;
