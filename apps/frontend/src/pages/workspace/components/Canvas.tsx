import React, { useRef, useEffect } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type { CollaboratorCursorInfo } from "../types/canvas.types";
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
}

const Canvas: React.FC<CanvasProps> = ({
    elements,
    selectedIds,
    onSelect,
    onUpdateElement,
    collaboratorCursors,
    viewport,
    setViewport,
    onCanvasClick
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { handleWheel, startPan, movePan, endPan, isPanning } = useCanvas(containerRef);

    // Sync viewport state to hook's state
    useEffect(() => {
        setViewport(viewport);
    }, [viewport, setViewport]);

    // Handle element dragging
    const draggingRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
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
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            movePan(e);
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
        draggingRef.current = null;
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey) || e.button === 2) {
             startPan(e);
        } else {
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
