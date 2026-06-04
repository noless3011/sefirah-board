import React, { useRef, useState, useEffect } from "react";
import type { CanvasElement } from "@sefirah/shared";
import { ElementRenderer } from "./ElementRenderer";
import { FloatingCursor } from "./FloatingCursor";

interface CanvasAreaProps {
    elements: CanvasElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
    viewport: { x: number; y: number; zoom: number };
    onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
    cursors: Array<{ userId: string; userName: string; x: number; y: number; color: string }>;
    onCanvasMouseMove: (x: number, y: number) => void;
    threads: Array<{ id: string; targetElementId: string | null }>;
    onCanvasClick?: (x: number, y: number) => void;
    onElementDrag?: (id: string, x: number, y: number) => void;
    onElementDragEnd?: (id: string) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
    elements,
    selectedElementId,
    onSelectElement,
    viewport,
    onViewportChange,
    cursors,
    onCanvasMouseMove,
    threads,
    onCanvasClick,
    onElementDrag,
    onElementDragEnd,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [viewportStart, setViewportStart] = useState({ x: 0, y: 0 });
    const [spacePressed, setSpacePressed] = useState(false);

    // Element dragging state & refs
    const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const dragElementStartRef = useRef({ x: 0, y: 0 });

    // Track Space key for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && e.target === document.body) {
                e.preventDefault();
                setSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                setSpacePressed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Mouse handlers for pan
    const handleMouseDown = (e: React.MouseEvent) => {
        // Space + Left Click OR Middle Click
        const isMiddleClick = e.button === 1;
        const isLeftSpaceClick = e.button === 0 && spacePressed;

        if (isMiddleClick || isLeftSpaceClick) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            setViewportStart({ x: viewport.x, y: viewport.y });
        } else if (e.button === 0 && e.target === containerRef.current) {
            // Click empty canvas to deselect
            onSelectElement(null);

            if (onCanvasClick) {
                const rect = containerRef.current.getBoundingClientRect();
                const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
                const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
                onCanvasClick(worldX, worldY);
            }
        }
    };

    const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
        // If space is held (panning mode) or it's not a left click, do not drag
        if (spacePressed || e.button !== 0) return;

        e.stopPropagation();
        onSelectElement(elementId);
        setDraggedElementId(elementId);
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        const el = elements.find((el) => el.id === elementId);
        if (el) {
            dragElementStartRef.current = { x: el.x, y: el.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        // Mouse coordinate in world space
        const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

        onCanvasMouseMove(worldX, worldY);

        if (draggedElementId) {
            const dx = (e.clientX - dragStartRef.current.x) / viewport.zoom;
            const dy = (e.clientY - dragStartRef.current.y) / viewport.zoom;
            if (onElementDrag) {
                onElementDrag(
                    draggedElementId,
                    Math.round(dragElementStartRef.current.x + dx),
                    Math.round(dragElementStartRef.current.y + dy),
                );
            }
        } else if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            onViewportChange({
                x: viewportStart.x + dx,
                y: viewportStart.y + dy,
                zoom: viewport.zoom,
            });
        }
    };

    const handleMouseUp = () => {
        if (draggedElementId) {
            if (onElementDragEnd) {
                onElementDragEnd(draggedElementId);
            }
            setDraggedElementId(null);
        }
        setIsPanning(false);
    };

    // Zoom on scroll wheel
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Mouse coordinate in world space before zoom
        const worldX = (mouseX - viewport.x) / viewport.zoom;
        const worldY = (mouseY - viewport.y) / viewport.zoom;

        // Zoom scale calculation
        const zoomIntensity = 0.1;
        const zoomFactor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
        let newZoom = viewport.zoom * zoomFactor;

        // Boundaries: 10% to 500%
        newZoom = Math.max(0.1, Math.min(newZoom, 5));

        // Adjust position so zoom centers on cursor
        const newX = mouseX - worldX * newZoom;
        const newY = mouseY - worldY * newZoom;

        onViewportChange({ x: newX, y: newY, zoom: newZoom });
    };

    // Helper to check if an element has threads
    const elementHasThread = (elId: string) => {
        return threads.some((t) => t.targetElementId === elId);
    };

    return (
        <div
            ref={containerRef}
            className={`w-full h-full overflow-hidden relative select-none bg-slate-50 transition-colors ${
                spacePressed ? "cursor-grab" : isPanning ? "cursor-grabbing" : "cursor-default"
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* The infinite board canvas world */}
            <div
                className="absolute inset-0 origin-top-left pointer-events-none"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                    width: 5000,
                    height: 5000,
                }}
            >
                {/* Dot grid background that scales/moves naturally with canvas transformations */}
                <div
                    className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                />

                {/* Canvas Elements */}
                <div className="absolute inset-0 pointer-events-auto">
                    {elements.map((element) => (
                        <ElementRenderer
                            key={element.id}
                            element={element}
                            isSelected={selectedElementId === element.id}
                            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                            hasThread={elementHasThread(element.id)}
                        />
                    ))}
                </div>

                {/* Floating remote cursors */}
                <div className="absolute inset-0 pointer-events-none">
                    {cursors.map((cursor) => (
                        <FloatingCursor
                            key={cursor.userId}
                            userName={cursor.userName}
                            x={cursor.x}
                            y={cursor.y}
                            color={cursor.color}
                        />
                    ))}
                </div>
            </div>

            {/* Canvas overlay instructions */}
            <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-medium pointer-events-none flex flex-col gap-1">
                <div>Space + Drag to pan canvas</div>
                <div>Scroll wheel to zoom in/out</div>
            </div>
        </div>
    );
};
export default CanvasArea;
