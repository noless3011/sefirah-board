import React, { useMemo } from "react";
import type { CanvasElement } from "@sefirah/shared";

interface MinimapProps {
    elements: CanvasElement[];
    viewport: { x: number; y: number; zoom: number };
    canvasSize?: { width: number; height: number };
}

export const Minimap: React.FC<MinimapProps> = ({
    elements,
    viewport,
    canvasSize = { width: 1920, height: 1080 },
}) => {
    const MAP_WIDTH = 180;
    const MAP_HEIGHT = 120;
    const PADDING = 20;

    // Compute bounding box of elements (with defaults)
    const bounds = useMemo(() => {
        if (elements.length === 0) {
            return {
                minX: 0,
                maxX: canvasSize.width,
                minY: 0,
                maxY: canvasSize.height,
            };
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        elements.forEach((el) => {
            minX = Math.min(minX, el.x);
            maxX = Math.max(maxX, el.x + el.width);
            minY = Math.min(minY, el.y);
            maxY = Math.max(maxY, el.y + el.height);
        });

        // Add padding
        minX -= PADDING;
        maxX += PADDING;
        minY -= PADDING;
        maxY += PADDING;

        // Ensure aspect ratio fits nicely
        const width = maxX - minX;
        const height = maxY - minY;

        return { minX, maxX, minY, maxY, width, height };
    }, [elements, canvasSize]);

    // Scale factor to map coordinates to map box
    const scale = useMemo(() => {
        const scaleX = MAP_WIDTH / (bounds.maxX - bounds.minX || 1);
        const scaleY = MAP_HEIGHT / (bounds.maxY - bounds.minX || 1);
        return Math.min(scaleX, scaleY, 0.1); // Cap scale at 0.1
    }, [bounds]);

    // Map function
    const mapCoords = (x: number, y: number) => {
        const cx = (x - bounds.minX) * scale;
        const cy = (y - bounds.minY) * scale;
        return { x: cx, y: cy };
    };

    // Render scaled-down elements
    const renderedElements = useMemo(() => {
        return elements.map((el) => {
            const mapped = mapCoords(el.x, el.y);
            const w = el.width * scale;
            const h = el.height * scale;

            // Pick color based on type
            let color = "bg-slate-300";
            if (el.type === "service-card") color = "bg-blue-400";
            else if (el.type === "database-card") color = "bg-amber-400";
            else if (el.type === "sticky-note") color = "bg-yellow-350";
            else if (el.type === "text") color = "bg-slate-400";

            return (
                <div
                    key={el.id}
                    className={`absolute rounded-[1px] opacity-70 ${color}`}
                    style={{
                        left: mapped.x,
                        top: mapped.y,
                        width: Math.max(w, 2),
                        height: Math.max(h, 2),
                    }}
                />
            );
        });
    }, [elements, scale, bounds]);

    // Calculate viewport box relative to board coordinate space
    // Canvas area is usually window.innerWidth by window.innerHeight.
    // viewport.x and viewport.y are translation.
    // screenX = viewport.x + canvasX * viewport.zoom => canvasX = (screenX - viewport.x) / viewport.zoom
    const viewportBox = useMemo(() => {
        const screenW = window.innerWidth || 1280;
        const screenH = window.innerHeight || 720;

        const left = -viewport.x / viewport.zoom;
        const top = -viewport.y / viewport.zoom;
        const w = screenW / viewport.zoom;
        const h = screenH / viewport.zoom;

        const mappedStart = mapCoords(left, top);
        const mappedW = w * scale;
        const mappedH = h * scale;

        return {
            left: mappedStart.x,
            top: mappedStart.y,
            width: Math.max(mappedW, 5),
            height: Math.max(mappedH, 5),
        };
    }, [viewport, scale, bounds]);

    return (
        <div className="w-[180px] h-[120px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden relative shadow-inner select-none pointer-events-none mx-auto mb-2">
            {/* Dots Grid Background inside map */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] opacity-50" />

            {/* Elements */}
            <div className="absolute inset-0">{renderedElements}</div>

            {/* Viewport Indicator Frame */}
            <div
                className="absolute border border-blue-500 bg-blue-500/10 rounded-[2px]"
                style={{
                    left: viewportBox.left,
                    top: viewportBox.top,
                    width: viewportBox.width,
                    height: viewportBox.height,
                }}
            />

            {/* MAP Tag Badge */}
            <div className="absolute bottom-1.5 right-1.5 bg-slate-200 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded leading-none">
                MAP
            </div>
        </div>
    );
};
export default Minimap;
