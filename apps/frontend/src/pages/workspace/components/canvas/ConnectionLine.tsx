import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./ConnectionLine.css";

interface ConnectionLineProps {
    element: CanvasElement & {
        type: "line" | "arrow" | "connector";
    };
    allElements: CanvasElement[];
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
    element,
    allElements,
    isSelected,
    onClick,
}) => {
    const points = element.points || [];
    if (points.length < 2) return null;

    // Find connected element centers for start/end anchoring
    let startPoint = points[0];
    let endPoint = points[points.length - 1];

    if (element.startElementId) {
        const startEl = allElements.find(
            (el) => el.id === element.startElementId
        );
        if (startEl) {
            startPoint = {
                x: startEl.x + startEl.width / 2,
                y: startEl.y + startEl.height / 2,
            };
        }
    }

    if (element.endElementId) {
        const endEl = allElements.find(
            (el) => el.id === element.endElementId
        );
        if (endEl) {
            endPoint = {
                x: endEl.x + endEl.width / 2,
                y: endEl.y + endEl.height / 2,
            };
        }
    }

    const allPts = [startPoint, ...points.slice(1, -1), endPoint];
    const strokeColor = element.appearance.strokeColor || "#4285f4";
    const strokeWidth = element.appearance.strokeWidth ?? 2;
    const isDashed = element.strokeDash ?? false;

    // Calculate SVG bounds
    const minX = Math.min(...allPts.map((p) => p.x)) - 20;
    const minY = Math.min(...allPts.map((p) => p.y)) - 20;
    const maxX = Math.max(...allPts.map((p) => p.x)) + 20;
    const maxY = Math.max(...allPts.map((p) => p.y)) + 20;

    const pathData = allPts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    return (
        <svg
            className={`connection-line ${isSelected ? "connection-line--selected" : ""}`}
            style={{
                position: "absolute",
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY,
                pointerEvents: "none",
                overflow: "visible",
            }}
            viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
            onClick={onClick}
        >
            {/* Invisible wider path for easier clicking */}
            <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth={strokeWidth + 12}
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
            />
            {/* Visible path */}
            <path
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isDashed ? "8 6" : "none"}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Arrow head for arrow type */}
            {element.type === "arrow" && allPts.length >= 2 && (
                <ArrowHead
                    from={allPts[allPts.length - 2]}
                    to={endPoint}
                    color={strokeColor}
                    size={strokeWidth * 4}
                />
            )}
        </svg>
    );
};

function ArrowHead({
    from,
    to,
    color,
    size,
}: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
    size: number;
}) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const p1 = {
        x: to.x - size * Math.cos(angle - Math.PI / 6),
        y: to.y - size * Math.sin(angle - Math.PI / 6),
    };
    const p2 = {
        x: to.x - size * Math.cos(angle + Math.PI / 6),
        y: to.y - size * Math.sin(angle + Math.PI / 6),
    };
    return (
        <polygon
            points={`${to.x},${to.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
            fill={color}
        />
    );
}

export default ConnectionLine;
