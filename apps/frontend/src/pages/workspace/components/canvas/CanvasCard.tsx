import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./CanvasCard.css";

interface CanvasCardProps {
    element: CanvasElement & { type: "service-card" | "database-card" };
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
}

const BADGE_COLORS: Record<string, string> = {
    SERVICE: "#4285f4",
    DATABASE: "#8B6914",
    API: "#34a853",
    CACHE: "#ea4335",
    QUEUE: "#9b59b6",
};

const CanvasCard: React.FC<CanvasCardProps> = ({
    element,
    isSelected,
    onMouseDown,
}) => {
    const badgeColor =
        BADGE_COLORS[element.badge?.toUpperCase()] ||
        element.appearance.strokeColor ||
        "#4285f4";

    return (
        <div
            className={`canvas-card ${isSelected ? "canvas-card--selected" : ""}`}
            style={{
                borderLeftColor: badgeColor,
                borderLeftWidth: element.appearance.strokeWidth ?? 4,
                backgroundColor:
                    element.appearance.fillColor || "#ffffff",
            }}
            onMouseDown={onMouseDown}
        >
            <span
                className="canvas-card__badge"
                style={{ color: badgeColor }}
            >
                {element.badge}
            </span>
            <h3 className="canvas-card__title">{element.title}</h3>
            <p className="canvas-card__description">{element.description}</p>
        </div>
    );
};

export default CanvasCard;
