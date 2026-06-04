import { useState, useEffect, useRef, useCallback } from "react";
import type { CanvasElement } from "@sefirah/shared";
import { boardApi } from "../../../api/board.api";

interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export function useCanvasState(boardId: string) {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Undo/Redo Stacks
    const [history, setHistory] = useState<CanvasElement[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const isLocalChangeRef = useRef(false);
    const elementsRef = useRef<CanvasElement[]>([]);
    elementsRef.current = elements;

    // Load from API on mount
    useEffect(() => {
        let isMounted = true;
        boardApi
            .getCanvasElements(boardId)
            .then((res) => {
                if (isMounted && res.data) {
                    const loadedElements = res.data.elements || [];
                    setElements(loadedElements);
                    setHistory([loadedElements]);
                    setHistoryIndex(0);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError("Failed to load canvas elements");
                    console.error(err);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [boardId]);

    // Push to history helper
    const pushToHistory = useCallback((newElements: CanvasElement[]) => {
        setHistory((prev) => {
            const nextHistory = prev.slice(0, historyIndex + 1);
            return [...nextHistory, newElements];
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex]);

    const addElement = useCallback((element: CanvasElement, isRemote = false) => {
        setElements((prev) => {
            const updated = [...prev, element];
            if (!isRemote) {
                isLocalChangeRef.current = true;
                pushToHistory(updated);
            }
            return updated;
        });
    }, [pushToHistory]);

    const updateElement = useCallback((id: string, changes: Partial<CanvasElement>, isRemote = false) => {
        setElements((prev) => {
            const updated = prev.map((el) => {
                if (el.id === id) {
                    return {
                        ...el,
                        ...changes,
                        appearance: {
                            ...el.appearance,
                            ...(changes.appearance || {}),
                        },
                        updatedAt: new Date().toISOString(),
                    } as CanvasElement;
                }
                return el;
            });
            if (!isRemote) {
                isLocalChangeRef.current = true;
                pushToHistory(updated);
            }
            return updated;
        });
    }, [pushToHistory]);

    const deleteElement = useCallback((id: string, isRemote = false) => {
        setElements((prev) => {
            const updated = prev.filter((el) => el.id !== id);
            if (!isRemote) {
                isLocalChangeRef.current = true;
                pushToHistory(updated);
            }
            return updated;
        });
        setSelectedElementId((prev) => (prev === id ? null : prev));
    }, [pushToHistory]);

    // Undo / Redo Actions
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevElements = history[prevIndex];
            setElements(prevElements);
            setHistoryIndex(prevIndex);
            isLocalChangeRef.current = true;
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextElements = history[nextIndex];
            setElements(nextElements);
            setHistoryIndex(nextIndex);
            isLocalChangeRef.current = true;
        }
    }, [historyIndex, history]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Auto-save snapshot every 90 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (isLocalChangeRef.current) {
                boardApi
                    .saveCanvasSnapshot(boardId, elementsRef.current)
                    .then(() => {
                        isLocalChangeRef.current = false;
                    })
                    .catch((err) => {
                        console.error("Auto-save failed", err);
                    });
            }
        }, 90000);

        return () => clearInterval(interval);
    }, [boardId]);

    // Manual force save snapshot
    const forceSave = useCallback(() => {
        return boardApi
            .saveCanvasSnapshot(boardId, elementsRef.current)
            .then(() => {
                isLocalChangeRef.current = false;
            })
            .catch((err) => {
                console.error("Manual snapshot save failed", err);
            });
    }, [boardId]);

    return {
        elements,
        setElements,
        selectedElementId,
        setSelectedElementId,
        viewport,
        setViewport,
        addElement,
        updateElement,
        deleteElement,
        loading,
        error,
        undo,
        redo,
        canUndo,
        canRedo,
        forceSave,
    };
}
