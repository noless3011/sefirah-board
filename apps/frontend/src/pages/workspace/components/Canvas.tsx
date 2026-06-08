import React, { useRef, useEffect, useState } from "react";
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
    penColor?: string;
    penWidth?: number;
    canvasBgColor?: string;
    canvasGridStyle?: "dots" | "lines" | "none";
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
    onAddElement,
    penColor = "#4285f4",
    penWidth = 3,
    canvasBgColor = "#f8f9fa",
    canvasGridStyle = "dots",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [editingElementId, setEditingElementId] = useState<string | null>(null);

    const handleElementDoubleClick = (e: React.MouseEvent, id: string) => {
        if (activeTool === "select") {
            e.stopPropagation();
            setEditingElementId(id);
        }
    };

    const { startPan, movePan, endPan, isPanning, screenToCanvas } = useCanvas(containerRef);

    // Sync viewport state to hook's state
    useEffect(() => {
        setViewport(viewport);
    }, [viewport, setViewport]);

    // Handle element dragging
    const draggingRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
    const initialPointsRef = useRef<{ x: number; y: number }[] | null>(null);
    
    // Tracking state for drawing & connections
    const firstConnectElementIdRef = useRef<string | null>(null);
    const isDrawingRef = useRef(false);
    const drawingLineIdRef = useRef<string | null>(null);
    const drawingPointsRef = useRef<{ x: number; y: number }[]>([]);

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        if (e.button === 0 && (activeTool === "select" || activeTool === "connector")) {
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

            if (element.type === "line" && element.points) {
                initialPointsRef.current = [...element.points];
            } else {
                initialPointsRef.current = null;
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

            if (initialPointsRef.current) {
                const shiftedPoints = initialPointsRef.current.map(p => ({
                    x: p.x + dx,
                    y: p.y + dy
                }));
                onUpdateElement(id, {
                    points: shiftedPoints
                });
            } else {
                onUpdateElement(id, {
                    x: initialX + dx,
                    y: initialY + dy
                });
            }
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            endPan();
        }
        if (activeTool === "pen" && isDrawingRef.current) {
            isDrawingRef.current = false;
            drawingLineIdRef.current = null;
            // Keep pen tool active to allow continuous drawing of multiple strokes
        }
        draggingRef.current = null;
        initialPointsRef.current = null;
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
                        strokeColor: penColor,
                        strokeWidth: penWidth,
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
        const isEditing = editingElementId === el.id;
        
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
                        onDoubleClick={(e) => handleElementDoubleClick(e, el.id)}
                    >
                        <CanvasCard
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                            isEditing={isEditing}
                            onEditComplete={(changes) => {
                                onUpdateElement(el.id, changes);
                                setEditingElementId(null);
                            }}
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
                        onDoubleClick={(e) => handleElementDoubleClick(e, el.id)}
                    >
                        <StickyNote
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                            isEditing={isEditing}
                            onEditComplete={(content) => {
                                onUpdateElement(el.id, { content });
                                setEditingElementId(null);
                            }}
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
                        onDoubleClick={(e) => handleElementDoubleClick(e, el.id)}
                    >
                        <TextElement
                            element={el as any}
                            isSelected={isSelected}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                            isEditing={isEditing}
                            onEditComplete={(content) => {
                                onUpdateElement(el.id, { content });
                                setEditingElementId(null);
                            }}
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

    const isDarkBg = (color: string) => {
        const hex = color.replace("#", "");
        if (hex.length === 3 || hex.length === 6) {
            const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
            const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
            const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
            const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq < 128;
        }
        return false;
    };

    const gridColor = isDarkBg(canvasBgColor) ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
    const gridBackgroundImage = canvasGridStyle === "dots"
        ? `radial-gradient(${gridColor} 1.5px, transparent 0)`
        : canvasGridStyle === "lines"
        ? `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`
        : "none";

    return (
        <div
            ref={containerRef}
            className={`canvas-container ${isPanning ? 'canvas-container--panning' : ''}`}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ backgroundColor: canvasBgColor }}
        >
            <div
                className="canvas-surface"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                }}
            >
                {/* Background grid */}
                <div 
                    className="canvas-grid" 
                    style={{
                        backgroundImage: gridBackgroundImage,
                        backgroundSize: "20px 20px"
                    }}
                />
                
                {/* Connection lines */}
                {lines.map((line) => (
                    <ConnectionLine
                        key={line.id}
                        element={line as any}
                        allElements={elements}
                        isSelected={selectedIds.includes(line.id)}
                        onMouseDown={(e) => handleElementMouseDown(e, line.id)}
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
