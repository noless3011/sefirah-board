import React, { useRef, useState, useEffect } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type { CollaboratorCursorInfo, ToolType } from "../types/canvas.types";
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
    onUpdateElement: (id: string, changes: Partial<CanvasElement>, skipHistory?: boolean) => void;
    onDeleteElement: (id: string, skipHistory?: boolean) => void;
    collaboratorCursors: CollaboratorCursorInfo[];
    viewport: { x: number; y: number; zoom: number };
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
    onCanvasClick?: () => void;
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    onAddElement: (element: CanvasElement, skipHistory?: boolean) => void;
    penColor?: string;
    penWidth?: number;
    canvasBgColor?: string;
    canvasGridStyle?: "dots" | "lines" | "none";
    canvasRef: React.RefObject<HTMLDivElement | null>;
    startPan: (e: React.MouseEvent) => void;
    movePan: (e: React.MouseEvent) => void;
    endPan: () => void;
    isPanning: boolean;
    screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
    pushHistory: (type: "add" | "remove" | "update", before: CanvasElement[], after: CanvasElement[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({
    elements,
    selectedIds,
    onSelect,
    onUpdateElement,
    onDeleteElement,
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
    canvasRef,
    startPan,
    movePan,
    endPan,
    isPanning,
    screenToCanvas,
    pushHistory,
}) => {
    const [editingElementId, setEditingElementId] = useState<string | null>(null);

    const handleElementDoubleClick = (e: React.MouseEvent, id: string) => {
        if (activeTool === "select") {
            e.stopPropagation();
            setEditingElementId(id);
        }
    };

    // Sync viewport ref to avoid re-binding wheel event listener on every render
    const viewportRef = useRef(viewport);
    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    // Non-passive native event listener to allow scroll-to-zoom and gesture panning
    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvasEl.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const v = viewportRef.current;

            // Pan horizontally if scrolling horizontally (trackpads)
            if (e.deltaX !== 0 && !e.ctrlKey && !e.metaKey) {
                setViewport((current) => ({
                    ...current,
                    x: current.x - e.deltaX,
                    y: current.y - e.deltaY,
                }));
                return;
            }

            // Zoom directly on vertical scroll or pinch
            const zoomStep = e.ctrlKey || e.metaKey ? 0.05 : 0.03;
            const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
            const newZoom = Math.min(
                Math.max(v.zoom + delta, 0.1),
                5
            );
            const scale = newZoom / v.zoom;

            setViewport({
                x: mouseX - (mouseX - v.x) * scale,
                y: mouseY - (mouseY - v.y) * scale,
                zoom: newZoom,
            });
        };

        canvasEl.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            canvasEl.removeEventListener("wheel", onWheel);
        };
    }, [canvasRef, setViewport]);

    // Handle element dragging
    const draggingRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
    const initialPointsRef = useRef<{ x: number; y: number }[] | null>(null);
    
    // Handle element resizing
    const resizingRef = useRef<{
        id: string;
        handle: "tl" | "tr" | "bl" | "br";
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        initialWidth: number;
        initialHeight: number;
    } | null>(null);
    
    // Tracking state for drawing & connections
    const firstConnectElementIdRef = useRef<string | null>(null);
    const isDrawingRef = useRef(false);
    const drawingLineIdRef = useRef<string | null>(null);
    const drawingPointsRef = useRef<{ x: number; y: number }[]>([]);

    // Baselines for undo/redo consolidation
    const penStartElementsRef = useRef<CanvasElement[] | null>(null);
    const dragStartElementsRef = useRef<CanvasElement[] | null>(null);
    const eraseStartElementsRef = useRef<CanvasElement[] | null>(null);
    const isErasingRef = useRef(false);

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        if (e.button === 0 && (activeTool === "select" || activeTool === "connector" || activeTool === "eraser")) {
            e.stopPropagation();
        }

        if (activeTool === "eraser" && e.button === 0) {
            eraseStartElementsRef.current = [...elements];
            onDeleteElement(id, true);
            isErasingRef.current = true;
            return;
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

            dragStartElementsRef.current = [...elements];

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

    const handleResizeStart = (e: React.MouseEvent, el: CanvasElement, handle: "tl" | "tr" | "bl" | "br") => {
        e.stopPropagation();
        e.preventDefault();
        dragStartElementsRef.current = [...elements];
        resizingRef.current = {
            id: el.id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialX: el.x,
            initialY: el.y,
            initialWidth: el.width,
            initialHeight: el.height,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            movePan(e);
            return;
        }

        if (activeTool === "eraser" && isErasingRef.current) {
            const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
            for (const domEl of elementsAtPoint) {
                const targetDom = domEl.closest("[data-element-id]");
                if (targetDom) {
                    const elId = targetDom.getAttribute("data-element-id");
                    if (elId) {
                        onDeleteElement(elId, true);
                    }
                }
            }
            return;
        }

        if (resizingRef.current) {
            const { id, handle, startX, startY, initialX, initialY, initialWidth, initialHeight } = resizingRef.current;
            const dx = (e.clientX - startX) / viewport.zoom;
            const dy = (e.clientY - startY) / viewport.zoom;

            let newX = initialX;
            let newY = initialY;
            let newWidth = initialWidth;
            let newHeight = initialHeight;

            const minSize = 30; // Minimum size for elements

            if (handle === "br") {
                newWidth = Math.max(initialWidth + dx, minSize);
                newHeight = Math.max(initialHeight + dy, minSize);
            } else if (handle === "bl") {
                const maxDx = initialWidth - minSize;
                const actualDx = Math.min(dx, maxDx);
                newX = initialX + actualDx;
                newWidth = initialWidth - actualDx;
                newHeight = Math.max(initialHeight + dy, minSize);
            } else if (handle === "tr") {
                const maxDy = initialHeight - minSize;
                const actualDy = Math.min(dy, maxDy);
                newY = initialY + actualDy;
                newWidth = Math.max(initialWidth + dx, minSize);
                newHeight = initialHeight - actualDy;
            } else if (handle === "tl") {
                const maxDx = initialWidth - minSize;
                const actualDx = Math.min(dx, maxDx);
                const maxDy = initialHeight - minSize;
                const actualDy = Math.min(dy, maxDy);
                newX = initialX + actualDx;
                newY = initialY + actualDy;
                newWidth = initialWidth - actualDx;
                newHeight = initialHeight - actualDy;
            }

            onUpdateElement(id, {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
            }, true);
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
                    }, true);
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
                }, true);
            } else {
                onUpdateElement(id, {
                    x: initialX + dx,
                    y: initialY + dy
                }, true);
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
            if (penStartElementsRef.current) {
                pushHistory("add", penStartElementsRef.current, elements);
                penStartElementsRef.current = null;
            }
        }

        if (activeTool === "eraser" && isErasingRef.current) {
            isErasingRef.current = false;
            if (eraseStartElementsRef.current) {
                if (JSON.stringify(eraseStartElementsRef.current) !== JSON.stringify(elements)) {
                    pushHistory("remove", eraseStartElementsRef.current, elements);
                }
                eraseStartElementsRef.current = null;
            }
        }

        if ((draggingRef.current || resizingRef.current) && dragStartElementsRef.current) {
            if (JSON.stringify(dragStartElementsRef.current) !== JSON.stringify(elements)) {
                pushHistory("update", dragStartElementsRef.current, elements);
            }
            dragStartElementsRef.current = null;
        }

        draggingRef.current = null;
        initialPointsRef.current = null;
        resizingRef.current = null;
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey) || e.button === 2) {
             startPan(e);
             return;
        }

        if (e.button === 0) {
            const coords = screenToCanvas(e.clientX, e.clientY);

            if (activeTool === "eraser") {
                isErasingRef.current = true;
                eraseStartElementsRef.current = [...elements];
                return;
            }

            if (activeTool === "pen") {
                isDrawingRef.current = true;
                penStartElementsRef.current = [...elements];
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

                onAddElement(newLine, true);
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
                        data-element-id={el.id}
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
                        data-element-id={el.id}
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
                        data-element-id={el.id}
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
            ref={canvasRef}
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

                {/* Bounding box selection handles */}
                {(() => {
                    if (selectedIds.length !== 1) return null;
                    const selectedId = selectedIds[0];
                    const selectedEl = elements.find((el) => el.id === selectedId);
                    if (!selectedEl || ["line", "arrow", "connector"].includes(selectedEl.type)) return null;

                    return (
                        <div
                            className="canvas-selection-bbox"
                            style={{
                                position: "absolute",
                                left: selectedEl.x,
                                top: selectedEl.y,
                                width: selectedEl.width,
                                height: selectedEl.height,
                                zIndex: selectedEl.zIndex + 1,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                className="canvas-resize-handle canvas-resize-handle--tl"
                                style={{ pointerEvents: "auto" }}
                                onMouseDown={(e) => handleResizeStart(e, selectedEl, "tl")}
                            />
                            <div
                                className="canvas-resize-handle canvas-resize-handle--tr"
                                style={{ pointerEvents: "auto" }}
                                onMouseDown={(e) => handleResizeStart(e, selectedEl, "tr")}
                            />
                            <div
                                className="canvas-resize-handle canvas-resize-handle--bl"
                                style={{ pointerEvents: "auto" }}
                                onMouseDown={(e) => handleResizeStart(e, selectedEl, "bl")}
                            />
                            <div
                                className="canvas-resize-handle canvas-resize-handle--br"
                                style={{ pointerEvents: "auto" }}
                                onMouseDown={(e) => handleResizeStart(e, selectedEl, "br")}
                            />
                        </div>
                    );
                })()}

                {/* Collaborator Cursors */}
                {collaboratorCursors.map((cursor) => (
                    <CollaboratorCursor key={cursor.userId} cursor={cursor} />
                ))}
            </div>
        </div>
    );
};

export default Canvas;
