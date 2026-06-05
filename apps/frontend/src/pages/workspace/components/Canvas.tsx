import React, { useRef, useEffect } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type { CollaboratorCursorInfo, ToolType } from "../types/canvas.types";
import { useCanvas } from "../hooks/useCanvas";
import CanvasCard from "./canvas/CanvasCard";
import StickyNote from "./canvas/StickyNote";
import TextElement from "./canvas/TextElement";
import ConnectionLine from "./canvas/ConnectionLine";
import CollaboratorCursor from "./canvas/CollaboratorCursor";
import "./Canvas.css";

interface CanvasProps {
    elements: CanvasElement[];
    selectedIds: string[];
    onSelect: (id: string | null, addToSelection?: boolean) => void;
    onUpdateElement: (id: string, changes: Partial<CanvasElement>) => void;
    collaboratorCursors: CollaboratorCursorInfo[];
    viewport: ReturnType<typeof useCanvas>["viewport"];
    setViewport: ReturnType<typeof useCanvas>["setViewport"];
    onCanvasClick?: () => void;
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    onAddElement: (element: CanvasElement) => void;
}

const Canvas: React.FC<CanvasProps> = ({
    elements,
    selectedIds,
    onSelect,
    onUpdateElement,
    collaboratorCursors,
    viewport,
    setViewport,
    onCanvasClick,
    activeTool,
    setActiveTool,
    onAddElement
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { handleWheel, startPan, movePan, endPan, isPanning, screenToCanvas } = useCanvas(containerRef);

    // Sync viewport state to hook's state
    useEffect(() => {
        setViewport(viewport);
    }, [viewport, setViewport]);

    // Handle element dragging
    const draggingRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
    
    // Tracking state for drawing & connections
    const firstConnectElementIdRef = useRef<string | null>(null);
    const isDrawingRef = useRef(false);
    const drawingLineIdRef = useRef<string | null>(null);
    const drawingPointsRef = useRef<{ x: number; y: number }[]>([]);

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        if (activeTool === "select" || activeTool === "connector") {
            e.stopPropagation();
        }

        if (activeTool === "connector" && e.button === 0) {
            if (!firstConnectElementIdRef.current) {
                firstConnectElementIdRef.current = id;
                onSelect(id);
            } else if (firstConnectElementIdRef.current !== id) {
                const baseZIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) : 0;
                const newConnector: CanvasElement = {
                    id: crypto.randomUUID(),
                    type: "connector",
                    startElementId: firstConnectElementIdRef.current,
                    endElementId: id,
                    points: [],
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    rotation: 0,
                    zIndex: baseZIndex + 1,
                    isLocked: false,
                    appearance: {
                        strokeColor: "#4285f4",
                        strokeWidth: 2,
                    },
                    createdBy: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as any;
                onAddElement(newConnector);
                firstConnectElementIdRef.current = null;
                setActiveTool("select");
                onSelect(null);
            }
            return;
        }

        if (activeTool === "select" && e.button === 0) {
            const element = elements.find(el => el.id === id);
            if (!element) return;

            if (!selectedIds.includes(id)) {
                onSelect(id, e.shiftKey || e.ctrlKey || e.metaKey);
            }

            draggingRef.current = {
                id,
                startX: e.clientX,
                startY: e.clientY,
                initialX: element.x,
                initialY: element.y
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            movePan(e);
            return;
        }

        if (activeTool === "pen" && isDrawingRef.current && drawingLineIdRef.current) {
            const coords = screenToCanvas(e.clientX, e.clientY);
            const lastPt = drawingPointsRef.current[drawingPointsRef.current.length - 1];
            if (lastPt) {
                const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
                if (dist > 3) {
                    drawingPointsRef.current.push(coords);
                    onUpdateElement(drawingLineIdRef.current, {
                        points: [...drawingPointsRef.current]
                    });
                }
            }
            return;
        }

        if (draggingRef.current) {
            const { id, startX, startY, initialX, initialY } = draggingRef.current;
            const dx = (e.clientX - startX) / viewport.zoom;
            const dy = (e.clientY - startY) / viewport.zoom;

            onUpdateElement(id, {
                x: initialX + dx,
                y: initialY + dy
            });
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            endPan();
        }
        if (activeTool === "pen" && isDrawingRef.current) {
            isDrawingRef.current = false;
            drawingLineIdRef.current = null;
            setActiveTool("select");
        }
        draggingRef.current = null;
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey) || e.button === 2) {
             startPan(e);
             return;
        }

        if (e.button === 0) {
            const coords = screenToCanvas(e.clientX, e.clientY);

            if (activeTool === "pen") {
                isDrawingRef.current = true;
                const lineId = crypto.randomUUID();
                drawingLineIdRef.current = lineId;
                drawingPointsRef.current = [coords];

                const baseZIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) : 0;
                const newLine: CanvasElement = {
                    id: lineId,
                    type: "line",
                    points: [coords],
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    rotation: 0,
                    zIndex: baseZIndex + 1,
                    isLocked: false,
                    appearance: {
                        strokeColor: "#4285f4",
                        strokeWidth: 3,
                    },
                    createdBy: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as any;

                onAddElement(newLine);
                return;
            }

            if (["sticky", "text", "shape"].includes(activeTool)) {
                const id = crypto.randomUUID();
                const baseZIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) : 0;
                const zIndex = baseZIndex + 1;

                let newElement: CanvasElement;

                if (activeTool === "sticky") {
                    newElement = {
                        id,
                        type: "sticky-note",
                        content: "Sticky Note",
                        x: coords.x - 75,
                        y: coords.y - 75,
                        width: 150,
                        height: 150,
                        rotation: 0,
                        zIndex,
                        isLocked: false,
                        appearance: {
                            fillColor: "#ffeb3b",
                            borderRadius: 8,
                        },
                        createdBy: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as any;
                } else if (activeTool === "text") {
                    newElement = {
                        id,
                        type: "text",
                        content: "Text",
                        x: coords.x - 100,
                        y: coords.y - 25,
                        width: 200,
                        height: 50,
                        rotation: 0,
                        zIndex,
                        isLocked: false,
                        appearance: {
                            fillColor: "#1a1a2e",
                            fontSize: 16,
                        },
                        createdBy: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as any;
                } else {
                    newElement = {
                        id,
                        type: "service-card",
                        title: "New Service",
                        description: "Describe this service.",
                        badge: "SERVICE",
                        x: coords.x - 125,
                        y: coords.y - 60,
                        width: 250,
                        height: 120,
                        rotation: 0,
                        zIndex,
                        isLocked: false,
                        appearance: {
                            fillColor: "#ffffff",
                            strokeColor: "#4285f4",
                            strokeWidth: 4,
                        },
                        createdBy: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as any;
                }

                onAddElement(newElement);
                setActiveTool("select");
                onSelect(id);
                return;
            }

            if (activeTool === "connector") {
                firstConnectElementIdRef.current = null;
                onSelect(null);
                return;
            }

            onSelect(null);
            onCanvasClick?.();
        }
    };

    const renderElement = (el: CanvasElement) => {
        const isSelected = selectedIds.includes(el.id);
        
        switch (el.type) {
            case "service-card":
            case "database-card":
                return (
                    <div
                        key={el.id}
                        style={{
                            position: "absolute",
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            zIndex: el.zIndex,
                        }}
                    >
                        <CanvasCard
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                        />
                    </div>
                );
            case "sticky-note":
                return (
                    <div
                        key={el.id}
                        style={{
                            position: "absolute",
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            zIndex: el.zIndex,
                        }}
                    >
                        <StickyNote
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                        />
                    </div>
                );
            case "text":
                return (
                    <div
                        key={el.id}
                        style={{
                            position: "absolute",
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            zIndex: el.zIndex,
                        }}
                    >
                        <TextElement
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    // Split elements into lines and normal elements
    const lines = elements.filter(el => ['line', 'arrow', 'connector'].includes(el.type));
    const nodes = elements.filter(el => !['line', 'arrow', 'connector'].includes(el.type));

    return (
        <div
            ref={containerRef}
            className={`canvas-container ${isPanning ? 'canvas-container--panning' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div
                className="canvas-surface"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                }}
            >
                {/* Background grid */}
                <div className="canvas-grid" />
                
                {/* Connection lines */}
                {lines.map((line) => (
                    <ConnectionLine
                        key={line.id}
                        element={line as any}
                        allElements={elements}
                        isSelected={selectedIds.includes(line.id)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(line.id, e.shiftKey);
                        }}
                    />
                ))}

                {/* Nodes */}
                {nodes.map(renderElement)}

                {/* Collaborator Cursors */}
                {collaboratorCursors.map((cursor) => (
                    <CollaboratorCursor key={cursor.userId} cursor={cursor} />
                ))}
            </div>
        </div>
    );
};

export default Canvas;
