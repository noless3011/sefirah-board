import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { CanvasElementAppearance, Thread } from "@sefirah/shared";


// Components
import TopToolbar from "./components/TopToolbar";
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

import "./BoardPage.css";

const BoardPage: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();


    const [boardTitle, setBoardTitle] = useState("Loading...");
    const [activeTab, setActiveTab] = useState<"properties" | "chat">("properties");
    const [threads, setThreads] = useState<Thread[]>([]);
    
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
        emitElementUpdate
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
            .then(res => setBoardTitle(res.title))
            .catch(err => console.error("Failed to fetch board metadata:", err));

        threadApi.getThreads(boardId)
            .then(res => setThreads(res))
            .catch(err => console.error("Failed to fetch threads:", err));
    }, [boardId, navigate]);

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
                onShare={() => alert("Share dialog would open here")}
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
                />
            </div>

            <div className="board-page__right">
                <RightPanel
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedElement={selectedElement}
                    onAppearanceChange={handleAppearanceChange}
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
        </div>
    );
};

export default BoardPage;
