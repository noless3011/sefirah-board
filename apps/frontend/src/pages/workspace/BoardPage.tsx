import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { CanvasElementAppearance, Thread, CanvasElement, Board } from "@sefirah/shared";


// Components
import TopToolbar from "./components/TopToolbar";
import ShareModal from "./components/ShareModal";
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

    const socket = useSocket();
    
    // Custom Hooks
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
    } = useCanvasElements(boardId!);

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

    // We instantiate useCanvas here so we can pass its state/methods down
    const dummyRef = useRef<HTMLDivElement>(null); // Passed to useCanvas, but actual ref is inside Canvas component
    const { viewport, setViewport, zoomIn, zoomOut } = useCanvas(dummyRef);

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
            .catch(err => console.error("Failed to fetch board metadata:", err));

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

    const handleAddElementDirect = (newElement: CanvasElement) => {
        addElement(newElement);
        emitElementCreate(newElement);
    };

    // Global keydown handler to delete elements
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.getAttribute("contenteditable") === "true") {
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
    }, [selectedIds, deleteElement, emitElementDelete]);

    const handleMouseMove = (e: React.MouseEvent) => {
        emitCursorMove(e.clientX, e.clientY);
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
                onExport={() => boardApi.exportBoard(boardId!, "png").then(() => alert(`Export started! Download URL will be available shortly.`))}
                onShare={() => setIsShareModalOpen(true)}
            />

            <LeftToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onHistoryClick={() => alert("History panel not fully implemented")}
                onSettingsClick={() => alert("Settings panel not fully implemented")}
            />

            <div className="board-page__center">
                <Canvas
                    elements={elements}
                    selectedIds={selectedIds}
                    onSelect={selectElement}
                    onUpdateElement={(id, changes) => {
                        updateElement(id, changes);
                        emitElementUpdate(id, changes);
                    }}
                    collaboratorCursors={cursors}
                    viewport={viewport}
                    setViewport={setViewport}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onAddElement={handleAddElementDirect}
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
        </div>
    );
};

export default BoardPage;
