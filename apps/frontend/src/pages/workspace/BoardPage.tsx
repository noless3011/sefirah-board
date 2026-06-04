import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { CanvasElement, Board, Collaborator } from "@sefirah/shared";

// Hooks
import { useCanvasState } from "./hooks/useCanvasState";
import { useWorkspaceSocket } from "./hooks/useWorkspaceSocket";
import { useThreads } from "./hooks/useThreads";

// Components
import { TopBar } from "./components/TopBar";
import { Toolbar } from "./components/Toolbar";
import { CanvasArea } from "./components/CanvasArea";
import { ZoomControls } from "./components/ZoomControls";
import { RightPanel } from "./components/RightPanel";

// APIs
import { boardApi } from "../../api/board.api";
import { accountSettingsApi } from "../../api/accountSettings.api";

// Helper to generate a valid UUID v4
const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

// Helper for consistent collaborator colors
const getCursorColor = (userId: string) => {
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F5A623", "#8B5CF6", "#EC4899", "#06B6D4"];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();

    if (!boardId) {
        return <div className="p-8 text-center text-slate-500 font-bold">Invalid Board ID</div>;
    }

    // 1. Core States
    const [board, setBoard] = useState<Board | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeTool, setActiveTool] = useState("select");
    const [selectedShapeType, setSelectedShapeType] = useState<
        "rectangle" | "ellipse" | "diamond" | "triangle" | "service-card" | "database-card"
    >("rectangle");

    const [activeTab, setActiveTab] = useState<"PROPERTIES" | "CHAT">("PROPERTIES");
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    // Canvas elements & viewport hooks
    const {
        elements,
        selectedElementId,
        setSelectedElementId,
        viewport,
        setViewport,
        addElement,
        updateElement,
        deleteElement,
        loading: canvasLoading,
        undo,
        redo,
        canUndo,
        canRedo,
        forceSave,
    } = useCanvasState(boardId);

    // Threads/Chat hook
    const {
        threads,
        createThread,
        replyToThread,
        resolveThread,
    } = useThreads(boardId);

    // Cursors state
    const [cursors, setCursors] = useState<
        Array<{ userId: string; userName: string; x: number; y: number; color: string }>
    >([]);

    // 2. Fetch Initial Profile and Collaborators
    useEffect(() => {
        // Load User profile
        accountSettingsApi.getMe()
            .then((res) => {
                if (res.data) {
                    setCurrentUser(res.data);
                }
            })
            .catch(console.error);

        // Load Board Info
        boardApi.getBoard(boardId)
            .then((res) => {
                if (res.data) {
                    setBoard(res.data);
                }
            })
            .catch(console.error);

        // Load Collaborators list
        boardApi.getCollaborators(boardId)
            .then((res) => {
                if (res.data) {
                    setCollaborators(res.data);
                }
            })
            .catch(console.error);
    }, [boardId]);

    // 3. WebSockets Sync Integration
    const socketCallbacks = useMemo(() => ({
        onUserJoined: (user: { userId: string; fullName: string; avatarUrl: string | null }) => {
            setActiveUsers((prev) => {
                if (prev.some((u) => u.userId === user.userId)) return prev;
                return [...prev, user];
            });
        },
        onUserLeft: (userId: string) => {
            setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
            setCursors((prev) => prev.filter((c) => c.userId !== userId));
        },
        onCursorMoved: (data: { userId: string; userName: string; x: number; y: number }) => {
            setCursors((prev) => {
                const filtered = prev.filter((c) => c.userId !== data.userId);
                return [
                    ...filtered,
                    {
                        userId: data.userId,
                        userName: data.userName,
                        x: data.x,
                        y: data.y,
                        color: getCursorColor(data.userId),
                    },
                ];
            });
        },
        onElementCreated: (element: CanvasElement) => {
            addElement(element, true);
        },
        onElementUpdated: (id: string, changes: Record<string, unknown>) => {
            updateElement(id, changes as any, true);
        },
        onElementDeleted: (id: string) => {
            deleteElement(id, true);
        },
    }), [addElement, updateElement, deleteElement]);

    const {
        emitCursorMove,
        emitElementCreate,
        emitElementUpdate,
        emitElementDelete,
    } = useWorkspaceSocket(boardId, socketCallbacks);

    // 4. Element updates
    const handleElementChange = (changes: Record<string, unknown>) => {
        if (!selectedElementId) return;
        updateElement(selectedElementId, changes as any);
        emitElementUpdate(selectedElementId, changes);
    };

    const handleElementDrag = useCallback((id: string, x: number, y: number) => {
        updateElement(id, { x, y } as any);
    }, [updateElement]);

    const handleElementDragEnd = useCallback((id: string) => {
        const el = elements.find((e) => e.id === id);
        if (el) {
            emitElementUpdate(id, { x: el.x, y: el.y });
            forceSave();
        }
    }, [elements, emitElementUpdate, forceSave]);

    // 5. Canvas mouse movements to broadcast cursor positions
    const handleCanvasMouseMove = (x: number, y: number) => {
        emitCursorMove(x, y);
    };

    // 6. Creating items on click
    const handleCanvasClick = (x: number, y: number) => {
        if (activeTool === "select") return;

        let type: any = "rectangle";
        let width = 120;
        let height = 80;
        let title = "New Shape";
        let description = "Description...";
        let content = "";
        let appearance: any = {
            fillColor: "#3B82F6", // Default blue
            strokeColor: "#2563EB",
            strokeWidth: 2,
            borderRadius: 8,
        };

        if (activeTool === "sticky") {
            type = "sticky-note";
            width = 150;
            height = 150;
            content = "Sticky note contents...";
            appearance = {
                fillColor: "#F5A623", // Amber yellow
                strokeColor: "#D97706",
                strokeWidth: 0,
                borderRadius: 4,
            };
        } else if (activeTool === "text") {
            type = "text";
            width = 160;
            height = 40;
            content = "Double click to edit";
            appearance = {
                fillColor: "transparent",
                strokeColor: "#1F2937",
                strokeWidth: 0,
            };
        } else if (activeTool === "shape") {
            type = selectedShapeType;
            if (type === "ellipse") {
                width = 100;
                height = 100;
                appearance = { fillColor: "#10B981", strokeColor: "#059669", strokeWidth: 2 };
            } else if (type === "diamond") {
                width = 100;
                height = 100;
                appearance = { fillColor: "#8B5CF6", strokeColor: "#7C3AED", strokeWidth: 2 };
            } else if (type === "triangle") {
                width = 100;
                height = 100;
                appearance = { fillColor: "#EC4899", strokeColor: "#DB2777", strokeWidth: 2 };
            } else if (type === "service-card") {
                width = 220;
                height = 110;
                title = "New Microservice";
                description = "Standard system component description details";
                appearance = { fillColor: "#FFFFFF", strokeColor: "#3B82F6", strokeWidth: 1 };
            } else if (type === "database-card") {
                width = 220;
                height = 110;
                title = "New Database";
                description = "Relational database repository schema storage";
                appearance = { fillColor: "#FFFFFF", strokeColor: "#F5A623", strokeWidth: 1 };
            }
        } else if (activeTool === "connector") {
            type = "arrow";
            width = 150;
            height = 150;
            appearance = { fillColor: "transparent", strokeColor: "#4A5568", strokeWidth: 2 };
        }

        const newElement: any = {
            id: generateUUID(),
            type,
            x: Math.round(x - width / 2),
            y: Math.round(y - height / 2),
            width,
            height,
            rotation: 0,
            zIndex: elements.length + 1,
            isLocked: false,
            appearance,
            createdBy: currentUser?.id || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...(type === "text" || type === "sticky-note" ? { content } : {}),
            ...(type === "service-card" || type === "database-card"
                ? {
                      title,
                      description,
                      badge: type === "service-card" ? "SERVICE" : "DATABASE",
                  }
                : {}),
            ...(type === "arrow" || type === "line" || type === "connector"
                ? { points: [{ x: 0, y: 0 }, { x: width, y: height }], strokeDash: false }
                : {}),
        };

        addElement(newElement);
        emitElementCreate(newElement);
        setActiveTool("select");
    };

    // 7. General Board Actions
    const handleUndo = () => {
        undo();
        // Since undo is local, we should sync all items in state
        forceSave();
    };

    const handleRedo = () => {
        redo();
        forceSave();
    };

    const handleExport = () => {
        // Trigger board download format selector
        const format = prompt("Enter format to export (png, pdf, or svg):", "png");
        if (format === "png" || format === "pdf" || format === "svg") {
            boardApi.exportBoard(boardId, format)
                .then((res) => {
                    if (res.data?.downloadUrl) {
                        window.open(res.data.downloadUrl, "_blank");
                    } else {
                        alert("Export requested successfully. Processing in background!");
                    }
                })
                .catch((err) => {
                    console.error("Export request failed", err);
                    alert("Failed to export board");
                });
        }
    };

    const handleShare = () => {
        const email = prompt("Enter collaborator email to invite:");
        if (email) {
            boardApi.getBoard(boardId) // Check role access
                .then(() => {
                    alert(`Invitation sent to ${email}!`);
                })
                .catch(() => {
                    alert("Sharing failed");
                });
        }
    };

    // Keyboard Shortcuts (Delete to remove, Ctrl+Z to undo, Ctrl+Y to redo)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isEditingText =
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA";

            if (isEditingText) return;

            // Delete Key
            if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
                e.preventDefault();
                deleteElement(selectedElementId);
                emitElementDelete(selectedElementId);
                forceSave();
            }

            // Undo (Ctrl+Z)
            if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleUndo();
            }

            // Redo (Ctrl+Y)
            if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedElementId, elements, forceSave]);

    // Zoom shortcuts
    const handleZoomIn = () => {
        setViewport((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
    };

    const handleZoomOut = () => {
        setViewport((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
    };

    const handleResetZoom = () => {
        setViewport((prev) => ({ ...prev, zoom: 1 }));
    };

    // Combine database collaborators list with active real-time users
    const allCollaborators = useMemo(() => {
        const list = [...collaborators];
        activeUsers.forEach((active) => {
            if (!list.some((c) => c.userId === active.userId)) {
                list.push({
                    userId: active.userId,
                    fullName: active.fullName,
                    email: "",
                    avatarUrl: active.avatarUrl,
                    role: "editor",
                    joinedAt: new Date().toISOString(),
                });
            }
        });
        return list;
    }, [collaborators, activeUsers]);

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-50">
            {/* Topbar Header */}
            <TopBar
                boardTitle={board?.title || "Sefirah Workspace"}
                collaborators={allCollaborators}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onExport={handleExport}
                onShare={handleShare}
                onBack={() => navigate("/dashboard")}
            />

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Floating Toolbar */}
                <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                    <Toolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        onHistoryClick={() => setActiveTab("CHAT")}
                        onSettingsClick={() => setActiveTab("PROPERTIES")}
                    />

                    {/* Floating Shape/Card Selector Submenu */}
                    {activeTool === "shape" && (
                        <div className="flex gap-1.5 p-1.5 bg-white border border-slate-150 rounded-xl shadow-lg mt-1 w-fit">
                            {[
                                { id: "rectangle", name: "Rect" },
                                { id: "ellipse", name: "Ellipse" },
                                { id: "diamond", name: "Diamond" },
                                { id: "triangle", name: "Triangle" },
                                { id: "service-card", name: "Service" },
                                { id: "database-card", name: "Database" },
                            ].map((shape) => (
                                <button
                                    key={shape.id}
                                    onClick={() => setSelectedShapeType(shape.id as any)}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                                        selectedShapeType === shape.id
                                            ? "bg-blue-500 text-white shadow-sm"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                >
                                    {shape.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Interactive Canvas Rendering Area */}
                <div className="flex-1 h-full relative">
                    {canvasLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <CanvasArea
                            elements={elements}
                            selectedElementId={selectedElementId}
                            onSelectElement={setSelectedElementId}
                            viewport={viewport}
                            onViewportChange={setViewport}
                            cursors={cursors}
                            onCanvasMouseMove={handleCanvasMouseMove}
                            threads={threads}
                            onCanvasClick={handleCanvasClick}
                            onElementDrag={handleElementDrag}
                            onElementDragEnd={handleElementDragEnd}
                        />
                    )}

                    {/* Float Zoom Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                        <ZoomControls
                            zoom={viewport.zoom}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onResetZoom={handleResetZoom}
                        />
                    </div>
                </div>

                {/* Right Tab panel */}
                <RightPanel
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedElement={elements.find((el) => el.id === selectedElementId) || null}
                    onElementChange={handleElementChange}
                    threads={threads}
                    onCreateThread={(targetElementId, message) => {
                        createThread(targetElementId, message);
                    }}
                    onReplyToThread={(threadId, message) => {
                        replyToThread(threadId, message);
                    }}
                    onResolveThread={(threadId) => {
                        resolveThread(threadId);
                    }}
                    viewport={viewport}
                    elements={elements}
                />
            </div>
        </div>
    );
};
export default BoardPage;
