import { useState, useCallback, useEffect, useRef } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type { ToolType } from "../types/canvas.types";
import { canvasApi } from "../../../api/board.api";
import { useCanvasHistory } from "./useCanvasHistory";

export function useCanvasElements(
    boardId: string,
    onUndoRedo?: (from: CanvasElement[], to: CanvasElement[]) => void
) {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTool, setActiveTool] = useState<ToolType>("select");
    const [loading, setLoading] = useState(true);
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elementsRef = useRef(elements);

    const { canUndo, canRedo, undo, redo, pushHistory } = useCanvasHistory(
        elements,
        setElements,
        onUndoRedo
    );

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    // Load elements on mount
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        canvasApi
            .getElements(boardId)
            .then((res) => {
                if (!cancelled) {
                    setElements(res.elements);
                }
            })
            .catch((err) => {
                console.error("Failed to load canvas elements:", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [boardId]);

    // Debounced save whenever elements change
    useEffect(() => {
        if (loading) return; // Don't save before initial elements load completes!

        // Clear any existing timer
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
        }

        // Set a new timer to save after 1000ms of inactivity
        autoSaveTimer.current = setTimeout(() => {
            canvasApi
                .saveSnapshot(boardId, elements)
                .catch((err) =>
                    console.error("Auto-save failed:", err)
                );
        }, 1000);

        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
        };
    }, [elements, boardId, loading]);

    const addElement = useCallback(
        (element: CanvasElement, skipHistory = false) => {
            const before = [...elementsRef.current];
            setElements((prev) => [...prev, element]);
            if (!skipHistory) {
                pushHistory("add", before, [...before, element]);
            }
        },
        [pushHistory]
    );

    const updateElement = useCallback(
        (id: string, changes: Partial<CanvasElement>, skipHistory = false) => {
            const before = [...elementsRef.current];
            setElements((prev) =>
                prev.map((el) =>
                    el.id === id ? ({ ...el, ...changes } as CanvasElement) : el
                )
            );
            const after = before.map((el) =>
                el.id === id ? ({ ...el, ...changes } as CanvasElement) : el
            );
            if (!skipHistory) {
                pushHistory("update", before, after);
            }
        },
        [pushHistory]
    );

    const deleteElement = useCallback(
        (id: string) => {
            const before = [...elementsRef.current];
            setElements((prev) => prev.filter((el) => el.id !== id));
            pushHistory(
                "remove",
                before,
                before.filter((el) => el.id !== id)
            );
            setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        },
        [pushHistory]
    );

    const selectElement = useCallback(
        (id: string | null, addToSelection = false) => {
            if (id === null) {
                setSelectedIds([]);
                return;
            }
            if (addToSelection) {
                setSelectedIds((prev) =>
                    prev.includes(id)
                        ? prev.filter((sid) => sid !== id)
                        : [...prev, id]
                );
            } else {
                setSelectedIds([id]);
            }
        },
        []
    );

    const selectedElements = elements.filter((el) =>
        selectedIds.includes(el.id)
    );

    return {
        elements,
        setElements,
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
    };
}
