import React, { useRef } from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./Minimap.css";

interface MinimapProps {
    elements: CanvasElement[];
    viewport: { x: number; y: number; zoom: number };
    onViewportChange: (x: number, y: number) => void;
}

const Minimap: React.FC<MinimapProps> = ({ elements, viewport, onViewportChange }) => {
    const minimapRef = useRef<HTMLDivElement>(null);

    // Approximate screen viewport width/height based on window size (minus sidebars/headers)
    const width = typeof window !== "undefined" ? window.innerWidth - 340 : 1000;
    const height = typeof window !== "undefined" ? window.innerHeight - 80 : 600;

    const viewportLeft = -viewport.x / viewport.zoom;
    const viewportTop = -viewport.y / viewport.zoom;
    const viewportWidth = width / viewport.zoom;
    const viewportHeight = height / viewport.zoom;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;

    // Bounding box bounds initialized with viewport bounds
    let minX = viewportLeft;
    let maxX = viewportRight;
    let minY = viewportTop;
    let maxY = viewportBottom;

    // Expand bounds to include all elements
    elements.forEach((el) => {
        const anyEl = el as any;
        if (["line", "arrow", "connector"].includes(el.type)) {
            if (anyEl.points && anyEl.points.length > 0) {
                anyEl.points.forEach((p: { x: number; y: number }) => {
                    minX = Math.min(minX, p.x);
                    maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y);
                    maxY = Math.max(maxY, p.y);
                });
            }
        } else {
            minX = Math.min(minX, el.x);
            maxX = Math.max(maxX, el.x + el.width);
            minY = Math.min(minY, el.y);
            maxY = Math.max(maxY, el.y + el.height);
        }
    });

    // Add padding around the bounds
    const padding = 150;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    // Maintain aspect ratio (container is roughly 248px x 100px)
    const minimapWidth = 248;
    const minimapHeight = 100;
    const minimapAspectRatio = minimapWidth / minimapHeight;
    const boundsAspectRatio = boundsWidth / boundsHeight;

    let adjustedMinX = minX;
    let adjustedMaxX = maxX;
    let adjustedMinY = minY;
    let adjustedMaxY = maxY;

    if (boundsAspectRatio > minimapAspectRatio) {
        const targetHeight = boundsWidth / minimapAspectRatio;
        const diff = targetHeight - boundsHeight;
        adjustedMinY -= diff / 2;
        adjustedMaxY += diff / 2;
    } else {
        const targetWidth = boundsHeight * minimapAspectRatio;
        const diff = targetWidth - boundsWidth;
        adjustedMinX -= diff / 2;
        adjustedMaxX += diff / 2;
    }

    const finalWidth = adjustedMaxX - adjustedMinX;
    const finalHeight = adjustedMaxY - adjustedMinY;

    const getStyle = (rect: { x: number; y: number; w: number; h: number }) => {
        const left = ((rect.x - adjustedMinX) / finalWidth) * 100;
        const top = ((rect.y - adjustedMinY) / finalHeight) * 100;
        const wPct = (rect.w / finalWidth) * 100;
        const hPct = (rect.h / finalHeight) * 100;
        return {
            left: `${left}%`,
            top: `${top}%`,
            width: `${wPct}%`,
            height: `${hPct}%`,
        };
    };

    const getElementColor = (el: CanvasElement): string => {
        if (["line", "arrow", "connector"].includes(el.type)) {
            return el.appearance?.strokeColor || "#4285f4";
        }
        if (el.type === "sticky-note") {
            return el.appearance?.fillColor || "#ffeb3b";
        }
        if (el.type === "text") {
            return el.appearance?.fillColor || "#1a1a2e";
        }
        if (["service-card", "database-card"].includes(el.type)) {
            return el.appearance?.fillColor || "#ffffff";
        }
        return el.appearance?.fillColor || "#cbd5e1";
    };

    const handleMinimapInteraction = (clientX: number, clientY: number) => {
        if (!minimapRef.current) return;
        const rect = minimapRef.current.getBoundingClientRect();
        
        const pctX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const pctY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

        const canvasX = adjustedMinX + pctX * finalWidth;
        const canvasY = adjustedMinY + pctY * finalHeight;

        const newX = -canvasX * viewport.zoom + width / 2;
        const newY = -canvasY * viewport.zoom + height / 2;

        onViewportChange(newX, newY);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        handleMinimapInteraction(e.clientX, e.clientY);
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            handleMinimapInteraction(moveEvent.clientX, moveEvent.clientY);
        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const viewportStyle = getStyle({
        x: viewportLeft,
        y: viewportTop,
        w: viewportWidth,
        h: viewportHeight,
    });

    return (
        <div 
            ref={minimapRef}
            className="minimap-container"
            onMouseDown={handleMouseDown}
            style={{ cursor: "crosshair" }}
        >
            <div className="minimap-content">
                {elements.map((el) => {
                    let rect;
                    if (["line", "arrow", "connector"].includes(el.type)) {
                        const anyEl = el as any;
                        if (!anyEl.points || anyEl.points.length === 0) return null;
                        const ptsX = anyEl.points.map((p: { x: number; y: number }) => p.x);
                        const ptsY = anyEl.points.map((p: { x: number; y: number }) => p.y);
                        const elMinX = Math.min(...ptsX);
                        const elMaxX = Math.max(...ptsX);
                        const elMinY = Math.min(...ptsY);
                        const elMaxY = Math.max(...ptsY);
                        rect = {
                            x: elMinX,
                            y: elMinY,
                            w: Math.max(2, elMaxX - elMinX),
                            h: Math.max(2, elMaxY - elMinY),
                        };
                    } else {
                        rect = {
                            x: el.x,
                            y: el.y,
                            w: el.width,
                            h: el.height,
                        };
                    }

                    const style = getStyle(rect);
                    const color = getElementColor(el);

                    return (
                        <div
                            key={el.id}
                            className="minimap-el"
                            style={{
                                ...style,
                                background: color,
                                border: ["service-card", "database-card"].includes(el.type) ? "1px solid #cbd5e1" : undefined,
                            }}
                        />
                    );
                })}
                
                <div className="minimap-viewport" style={viewportStyle} />
            </div>
            <div className="minimap-label">MAP</div>
        </div>
    );
};

export default Minimap;
