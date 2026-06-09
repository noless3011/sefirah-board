import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { CanvasElementAppearance, Thread, CanvasElement, Board } from "@sefirah/shared";


// Components
import TopToolbar from "./components/TopToolbar";
import ShareModal from "./components/ShareModal";
import SettingsModal from "./components/SettingsModal";
import LeftToolbar from "./components/LeftToolbar";
import RightPanel from "./components/RightPanel";
import ChatPanel from "./components/ChatPanel";
import Canvas from "./components/Canvas";
import ZoomControls from "./components/ZoomControls";
import Minimap from "./components/Minimap";

// Hooks & Types
import { useCanvasElements } from "./hooks/useCanvasElements";
import { useCollaboration } from "./hooks/useCollaboration";
import { useCanvas } from "./hooks/useCanvas";
import { boardApi, threadApi } from "../../api/board.api";
import { useSocket } from "../../socket/SocketProvider";

import "./BoardPage.css";

const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();


    const [board, setBoard] = useState<Board | null>(null);
    const [boardTitle, setBoardTitle] = useState("Loading...");
    const [activeTab, setActiveTab] = useState<"properties" | "chat">("properties");
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [penColor, setPenColor] = useState("#4285f4");
    const [penWidth, setPenWidth] = useState(3);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [canvasBgColor, setCanvasBgColor] = useState(() => {
        return localStorage.getItem("sefirah-canvas-bg-color") || "#f8f9fa";
    });
    const [canvasGridStyle, setCanvasGridStyle] = useState<"dots" | "lines" | "none">(() => {
        return (localStorage.getItem("sefirah-canvas-grid-style") as "dots" | "lines" | "none") || "dots";
    });

    useEffect(() => {
        localStorage.setItem("sefirah-canvas-bg-color", canvasBgColor);
    }, [canvasBgColor]);

    useEffect(() => {
        localStorage.setItem("sefirah-canvas-grid-style", canvasGridStyle);
    }, [canvasGridStyle]);

    const socket = useSocket();
    
    // Custom Hooks
    const syncHandlersRef = useRef<{
        emitElementCreate?: (element: CanvasElement) => void;
        emitElementUpdate?: (id: string, changes: Partial<CanvasElement>) => void;
        emitElementDelete?: (id: string) => void;
    }>({});

    const {
        elements,
        selectedIds,
        selectedElements,
        activeTool,
        setActiveTool,
        loading,
        addElement,
        updateElement,
        deleteElement,
        selectElement,
        canUndo,
        canRedo,
        undo,
        redo,
        pushHistory,
    } = useCanvasElements(boardId!, (from, to) => {
        const { emitElementCreate, emitElementUpdate, emitElementDelete } = syncHandlersRef.current;
        if (!emitElementCreate || !emitElementUpdate || !emitElementDelete) return;

        // 1. Deleted: in from but not in to
        const toIds = new Set(to.map(el => el.id));
        from.forEach(el => {
            if (!toIds.has(el.id)) {
                emitElementDelete(el.id);
            }
        });

        // 2. Created: in to but not in from
        const fromIds = new Set(from.map(el => el.id));
        to.forEach(el => {
            if (!fromIds.has(el.id)) {
                emitElementCreate(el);
            }
        });

        // 3. Updated: in both, but properties are different
        const fromMap = new Map(from.map(el => [el.id, el]));
        to.forEach(el => {
            const beforeEl = fromMap.get(el.id);
            if (beforeEl) {
                if (JSON.stringify(beforeEl) !== JSON.stringify(el)) {
                    emitElementUpdate(el.id, el);
                }
            }
        });
    });

    const {
        cursors,
        onlineUsers,
        emitCursorMove,
        emitElementCreate,
        emitElementUpdate,
        emitElementDelete
    } = useCollaboration(
        boardId!,
        addElement,
        updateElement,
        deleteElement
    );

    // Sync handlers to ref for useCanvasElements' onUndoRedo callback
    useEffect(() => {
        syncHandlersRef.current = {
            emitElementCreate,
            emitElementUpdate,
            emitElementDelete
        };
    }, [emitElementCreate, emitElementUpdate, emitElementDelete]);

    // We instantiate useCanvas here so we can pass its state/methods down
    const {
        viewport,
        setViewport,
        zoomIn,
        zoomOut,
        startPan,
        movePan,
        endPan,
        isPanning,
        screenToCanvas,
        canvasRef,
    } = useCanvas();

    // Initial load for board and threads
    useEffect(() => {
        if (!boardId) {
            navigate("/dashboard");
            return;
        }

        boardApi.getBoard(boardId)
            .then(res => {
                setBoard(res);
                setBoardTitle(res.title);
            })
            .catch(err => {
                console.error("Failed to fetch board metadata:", err);
                navigate("/dashboard");
            });

        threadApi.getThreads(boardId)
            .then(res => setThreads(res))
            .catch(err => console.error("Failed to fetch threads:", err));
    }, [boardId, navigate]);

    // Listen to real-time thread socket events
    useEffect(() => {
        if (!socket) return;

        const handleThreadCreated = (data: { thread: Thread }) => {
            setThreads((prev) => {
                if (prev.some((t) => t.id === data.thread.id)) return prev;
                return [...prev, data.thread];
            });
        };

        const handleReplyCreated = (data: { threadId: string; reply: any }) => {
            setThreads((prev) =>
                prev.map((t) =>
                    t.id === data.threadId
                        ? { ...t, replies: [...(t.replies || []), data.reply] }
                        : t
                )
            );
        };

        const handleThreadUpdated = (data: { thread: Thread }) => {
            setThreads((prev) =>
                prev.map((t) => (t.id === data.thread.id ? data.thread : t))
            );
        };

        socket.on("thread-created", handleThreadCreated);
        socket.on("reply-created", handleReplyCreated);
        socket.on("thread-updated", handleThreadUpdated);

        return () => {
            socket.off("thread-created", handleThreadCreated);
            socket.off("reply-created", handleReplyCreated);
            socket.off("thread-updated", handleThreadUpdated);
        };
    }, [socket]);

    const handleTitleChange = async (newTitle: string) => {
        setBoardTitle(newTitle);
        try {
            await boardApi.updateBoard(boardId!, { title: newTitle });
        } catch (err) {
            console.error("Failed to update board title", err);
        }
    };

    const handleAppearanceChange = (changes: Partial<CanvasElementAppearance>) => {
        selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el) {
                const newAppearance = { ...el.appearance, ...changes };
                updateElement(id, { appearance: newAppearance });
                emitElementUpdate(id, { appearance: newAppearance });
            }
        });
    };

    const handleSendMessage = async (message: string, targetElementId?: string) => {
        try {
            const target = targetElementId || selectedIds[0];
            const newThread = await threadApi.createThread(boardId!, {
                targetElementId: target || undefined,
                message
            });
            setThreads(prev => [...prev, newThread]);
        } catch (err) {
            console.error("Failed to create thread", err);
        }
    };

    const handleReply = async (threadId: string, message: string) => {
        try {
            const newReply = await threadApi.replyToThread(boardId!, threadId, { message });
            setThreads(prev =>
                prev.map(t =>
                    t.id === threadId
                        ? { ...t, replies: [...(t.replies || []), newReply] }
                        : t
                )
            );
        } catch (err) {
            console.error("Failed to reply", err);
        }
    };

    const handleElementChange = (changes: Partial<CanvasElement>) => {
        selectedIds.forEach(id => {
            updateElement(id, changes);
            emitElementUpdate(id, changes);
        });
    };

    const handleAddElementDirect = (newElement: CanvasElement, skipHistory?: boolean) => {
        addElement(newElement, skipHistory);
        emitElementCreate(newElement);
    };

    const handleExport = () => {
        if (elements.length === 0) {
            alert("No elements on the canvas to export.");
            return;
        }

        // Bounding box calculations
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        elements.forEach((el) => {
            if (["line", "arrow", "connector"].includes(el.type)) {
                const anyEl = el as any;
                let pts: { x: number; y: number }[] = [];
                if (anyEl.points && anyEl.points.length > 0) {
                    pts = [...anyEl.points];
                }
                
                // Add start/end elements centers for lines/connectors
                if (anyEl.startElementId) {
                    const startEl = elements.find((n) => n.id === anyEl.startElementId);
                    if (startEl) {
                        pts.push({ x: startEl.x + startEl.width / 2, y: startEl.y + startEl.height / 2 });
                    }
                }
                if (anyEl.endElementId) {
                    const endEl = elements.find((n) => n.id === anyEl.endElementId);
                    if (endEl) {
                        pts.push({ x: endEl.x + endEl.width / 2, y: endEl.y + endEl.height / 2 });
                    }
                }

                pts.forEach((p) => {
                    minX = Math.min(minX, p.x);
                    maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y);
                    maxY = Math.max(maxY, p.y);
                });
            } else {
                minX = Math.min(minX, el.x);
                maxX = Math.max(maxX, el.x + el.width);
                minY = Math.min(minY, el.y);
                maxY = Math.max(maxY, el.y + el.height);
            }
        });

        // 200px padding
        const padding = 200;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;

        // Create Canvas element
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, width, height);

        // Grid Style
        const isDarkBg = (color: string) => {
            const hex = color.replace("#", "");
            if (hex.length === 3 || hex.length === 6) {
                const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
                const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
                const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
                return (r * 299 + g * 587 + b * 114) / 1000 < 128;
            }
            return false;
        };

        const gridColor = isDarkBg(canvasBgColor) ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
        
        if (canvasGridStyle === "dots") {
            // Draw grid dots
            ctx.fillStyle = gridColor;
            const startGridX = Math.floor(minX / 20) * 20;
            const startGridY = Math.floor(minY / 20) * 20;
            for (let x = startGridX; x <= maxX; x += 20) {
                for (let y = startGridY; y <= maxY; y += 20) {
                    ctx.beginPath();
                    ctx.arc(x - minX, y - minY, 1.5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        } else if (canvasGridStyle === "lines") {
            // Draw grid lines
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            const startGridX = Math.floor(minX / 20) * 20;
            const startGridY = Math.floor(minY / 20) * 20;
            
            // Vertical lines
            for (let x = startGridX; x <= maxX; x += 20) {
                ctx.beginPath();
                ctx.moveTo(x - minX, 0);
                ctx.lineTo(x - minX, height);
                ctx.stroke();
            }
            // Horizontal lines
            for (let y = startGridY; y <= maxY; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y - minY);
                ctx.lineTo(width, y - minY);
                ctx.stroke();
            }
        }

        // Translate to match relative coordinates
        ctx.translate(-minX, -minY);

        // Sorting by zIndex
        const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

        // Draw Helper Functions
        const drawRoundedRect = (c: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, radius: number) => {
            c.beginPath();
            c.moveTo(rx + radius, ry);
            c.lineTo(rx + rw - radius, ry);
            c.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
            c.lineTo(rx + rw, ry + rh - radius);
            c.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
            c.lineTo(rx + radius, ry + rh);
            c.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
            c.lineTo(rx, ry + radius);
            c.quadraticCurveTo(rx, ry, rx + radius, ry);
            c.closePath();
        };

        const drawWrappedText = (c: CanvasRenderingContext2D, text: string, tx: number, ty: number, maxWidth: number, lineHeight: number, maxLines?: number, underline?: boolean) => {
            const words = text.split(" ");
            let line = "";
            const lines: string[] = [];

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + " ";
                const metrics = c.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + " ";
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            const finalLines = maxLines ? lines.slice(0, maxLines) : lines;
            finalLines.forEach((l, i) => {
                const trimmed = l.trim();
                const y = ty + i * lineHeight;
                c.fillText(trimmed, tx, y);
                if (underline) {
                    const metrics = c.measureText(trimmed);
                    const width = metrics.width;
                    let startX = tx;
                    if (c.textAlign === "center") {
                        startX = tx - width / 2;
                    } else if (c.textAlign === "right") {
                        startX = tx - width;
                    }
                    c.save();
                    c.strokeStyle = c.fillStyle;
                    c.lineWidth = 1.5;
                    c.beginPath();
                    c.moveTo(startX, y + lineHeight * 0.85);
                    c.lineTo(startX + width, y + lineHeight * 0.85);
                    c.stroke();
                    c.restore();
                }
            });
        };

        const BADGE_COLORS: Record<string, string> = {
            SERVICE: "#4285f4",
            DATABASE: "#8B6914",
            API: "#34a853",
            CACHE: "#ea4335",
            QUEUE: "#9b59b6",
        };

        // Draw Elements
        sortedElements.forEach((el) => {
            ctx.save();
            
            if (["line", "arrow", "connector"].includes(el.type)) {
                const anyEl = el as any;
                let pts: { x: number; y: number }[] = [];
                if (anyEl.points && anyEl.points.length > 0) {
                    pts = [...anyEl.points];
                }
                if (anyEl.startElementId) {
                    const startEl = elements.find((n) => n.id === anyEl.startElementId);
                    if (startEl) {
                        pts[0] = { x: startEl.x + startEl.width / 2, y: startEl.y + startEl.height / 2 };
                    }
                }
                if (anyEl.endElementId) {
                    const endEl = elements.find((n) => n.id === anyEl.endElementId);
                    if (endEl) {
                        pts[pts.length - 1] = { x: endEl.x + endEl.width / 2, y: endEl.y + endEl.height / 2 };
                    }
                }

                if (pts.length < 2) {
                    ctx.restore();
                    return;
                }

                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x, pts[i].y);
                }

                const strokeColor = el.appearance?.strokeColor || "#4285f4";
                const strokeWidth = el.appearance?.strokeWidth ?? 2;

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                if ((el as any).strokeDash) {
                    ctx.setLineDash([8, 6]);
                } else {
                    ctx.setLineDash([]);
                }
                ctx.stroke();

                if (el.type === "arrow") {
                    const fromPt = pts[pts.length - 2];
                    const toPt = pts[pts.length - 1];
                    const angle = Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x);
                    const size = strokeWidth * 4;
                    ctx.fillStyle = strokeColor;
                    ctx.beginPath();
                    ctx.moveTo(toPt.x, toPt.y);
                    ctx.lineTo(toPt.x - size * Math.cos(angle - Math.PI / 6), toPt.y - size * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(toPt.x - size * Math.cos(angle + Math.PI / 6), toPt.y - size * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (el.type === "sticky-note") {
                const fillColor = el.appearance?.fillColor || "#ffeb3b";
                
                // Shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 4;
                ctx.fillStyle = fillColor;
                ctx.fillRect(el.x, el.y, el.width, el.height);
                ctx.shadowColor = "transparent";

                // Text
                ctx.fillStyle = "#1e293b";
                ctx.font = "normal 14px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                const size = el.appearance?.fontSize || 14;
                const family = el.appearance?.fontFamily || "sans-serif";
                ctx.font = `normal ${size}px ${family}`;
                
                drawWrappedText(ctx, (el as any).content || "", el.x + el.width / 2, el.y + el.height / 2, el.width - 20, size * 1.25);
            } else if (el.type === "text") {
                const color = el.appearance?.fillColor || "#1a1a2e";
                const size = el.appearance?.fontSize || 16;
                const weight = el.appearance?.fontWeight || "normal";
                const fontStyle = el.appearance?.italic ? "italic" : "normal";
                const family = el.appearance?.fontFamily || "sans-serif";
                
                ctx.fillStyle = color;
                ctx.font = `${fontStyle} ${weight} ${size}px ${family}`;
                ctx.textAlign = (el.appearance?.textAlign || "left") as CanvasTextAlign;
                ctx.textBaseline = "top";

                if (el.appearance?.dashed) {
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 4]);
                    ctx.strokeRect(el.x, el.y, el.width, el.height);
                    ctx.restore();
                }

                const textX = ctx.textAlign === "center" 
                    ? el.x + el.width / 2 
                    : ctx.textAlign === "right" 
                        ? el.x + el.width - 8 
                        : el.x + 8;
                drawWrappedText(ctx, (el as any).content || "", textX, el.y + 4, el.width - 16, size * 1.25, undefined, el.appearance?.underline);
            } else if (["service-card", "database-card"].includes(el.type)) {
                const card = el as any;
                const badgeColor = BADGE_COLORS[card.badge?.toUpperCase()] || el.appearance?.strokeColor || "#4285f4";

                // Shadow & Card Background
                ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
                ctx.shadowBlur = 12;
                ctx.shadowOffsetY = 6;
                ctx.fillStyle = el.appearance?.fillColor || "#ffffff";
                drawRoundedRect(ctx, el.x, el.y, el.width, el.height, 10);
                ctx.fill();
                ctx.shadowColor = "transparent";

                // Draw left colored border
                ctx.save();
                ctx.fillStyle = badgeColor;
                ctx.beginPath();
                const radius = 10;
                const borderW = el.appearance?.strokeWidth ?? 4;
                ctx.arc(el.x + radius, el.y + radius, radius, Math.PI, 1.5 * Math.PI);
                ctx.lineTo(el.x + borderW, el.y);
                ctx.lineTo(el.x + borderW, el.y + el.height);
                ctx.lineTo(el.x + radius, el.y + el.height);
                ctx.arc(el.x + radius, el.y + el.height - radius, radius, 0.5 * Math.PI, Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Draw Badge Text
                ctx.fillStyle = badgeColor;
                ctx.font = "bold 9px sans-serif";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(card.badge || "SERVICE", el.x + 16, el.y + 16);

                // Draw Title
                ctx.fillStyle = "#0f172a";
                ctx.font = "bold 13px sans-serif";
                ctx.fillText(card.title || "New Service", el.x + 16, el.y + 36);

                // Draw Description
                ctx.fillStyle = "#64748b";
                ctx.font = "normal 11px sans-serif";
                drawWrappedText(ctx, card.description || "", el.x + 16, el.y + 56, el.width - 32, 16, 3);
            }

            ctx.restore();
        });

        // Trigger Download
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${boardTitle.replace(/\s+/g, "_") || "board"}_export.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Client-side export failed, falling back", err);
            alert("Export failed on client side.");
        }
    };

    // Global keydown handler to delete elements and handle undo/redo shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.getAttribute("contenteditable") === "true") {
                return;
            }

            // Undo: Ctrl + Z or Cmd + Z
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo: Ctrl + Y, Cmd + Y, or Ctrl + Shift + Z / Cmd + Shift + Z
            if (
                ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
            ) {
                e.preventDefault();
                redo();
                return;
            }

            if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
                selectedIds.forEach(id => {
                    deleteElement(id);
                    emitElementDelete(id);
                });
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [selectedIds, deleteElement, emitElementDelete, undo, redo]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = screenToCanvas(e.clientX, e.clientY);
        emitCursorMove(coords.x, coords.y);
    };

    if (loading) {
        return <div className="board-page__loading">Loading Canvas...</div>;
    }

    const selectedElement = selectedElements.length > 0 ? selectedElements[0] : null;

    return (
        <div className="board-page" onMouseMove={handleMouseMove}>
            <TopToolbar
                boardTitle={boardTitle}
                onTitleChange={handleTitleChange}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                collaborators={onlineUsers}
                onExport={handleExport}
                onShare={() => setIsShareModalOpen(true)}
            />

            <LeftToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onSettingsClick={() => setIsSettingsModalOpen(true)}
            />

            <div className="board-page__center">
                <Canvas
                    elements={elements}
                    selectedIds={selectedIds}
                    onSelect={selectElement}
                    onUpdateElement={(id, changes, skipHistory) => {
                        updateElement(id, changes, skipHistory);
                        emitElementUpdate(id, changes);
                    }}
                    collaboratorCursors={cursors}
                    viewport={viewport}
                    setViewport={setViewport}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onAddElement={handleAddElementDirect}
                    penColor={penColor}
                    penWidth={penWidth}
                    canvasBgColor={canvasBgColor}
                    canvasGridStyle={canvasGridStyle}
                    canvasRef={canvasRef}
                    startPan={startPan}
                    movePan={movePan}
                    endPan={endPan}
                    isPanning={isPanning}
                    screenToCanvas={screenToCanvas}
                    pushHistory={pushHistory}
                />
            </div>

            <div className="board-page__right">
                <RightPanel
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedElement={selectedElement}
                    onAppearanceChange={handleAppearanceChange}
                    onElementChange={handleElementChange}
                    threads={threads}
                    onThreadClick={(id) => console.log("Thread clicked", id)}
                    chatContent={
                        <ChatPanel
                            threads={threads}
                            boardId={boardId!}
                            onSendMessage={handleSendMessage}
                            onReply={handleReply}
                        />
                    }
                    minimapContent={
                        <Minimap
                            elements={elements}
                            viewport={viewport}
                            onViewportChange={(x, y) => setViewport({ ...viewport, x, y })}
                        />
                    }
                    activeTool={activeTool}
                    penColor={penColor}
                    onPenColorChange={setPenColor}
                    penWidth={penWidth}
                    onPenWidthChange={setPenWidth}
                />
            </div>

            <div className="board-page__zoom">
                <ZoomControls
                    zoom={viewport.zoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                />
            </div>

            {isShareModalOpen && board && (
                <ShareModal
                    boardId={boardId!}
                    ownerId={board.ownerId}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}

            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    canvasBgColor={canvasBgColor}
                    onCanvasBgColorChange={setCanvasBgColor}
                    canvasGridStyle={canvasGridStyle}
                    onCanvasGridStyleChange={setCanvasGridStyle}
                />
            )}
        </div>
    );
};

export default BoardPage;
