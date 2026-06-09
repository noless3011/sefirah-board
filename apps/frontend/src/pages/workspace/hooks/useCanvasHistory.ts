import { useState, useCallback, useRef } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type { HistoryEntry } from "../types/canvas.types";

const MAX_HISTORY = 100;

export function useCanvasHistory(
    _elements: CanvasElement[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
    onUndoRedo?: (from: CanvasElement[], to: CanvasElement[]) => void
) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedo = useRef(false);

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    const pushHistory = useCallback(
        (
            type: HistoryEntry["type"],
            before: CanvasElement[],
            after: CanvasElement[]
        ) => {
            if (isUndoRedo.current) return;

            setHistory((prev) => {
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push({
                    type,
                    elementsBefore: before,
                    elementsAfter: after,
                    timestamp: Date.now(),
                });
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.shift();
                    return newHistory;
                }
                return newHistory;
            });
            setHistoryIndex((i) => Math.min(i + 1, MAX_HISTORY - 1));
        },
        [historyIndex]
    );

    const undo = useCallback(() => {
        if (!canUndo) return;
        isUndoRedo.current = true;
        const entry = history[historyIndex];
        if (onUndoRedo) {
            onUndoRedo(entry.elementsAfter, entry.elementsBefore);
        }
        setElements(entry.elementsBefore);
        setHistoryIndex((i) => i - 1);
        requestAnimationFrame(() => {
            isUndoRedo.current = false;
        });
    }, [canUndo, history, historyIndex, setElements, onUndoRedo]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        isUndoRedo.current = true;
        const entry = history[historyIndex + 1];
        if (onUndoRedo) {
            onUndoRedo(entry.elementsBefore, entry.elementsAfter);
        }
        setElements(entry.elementsAfter);
        setHistoryIndex((i) => i + 1);
        requestAnimationFrame(() => {
            isUndoRedo.current = false;
        });
    }, [canRedo, history, historyIndex, setElements, onUndoRedo]);

    return { canUndo, canRedo, undo, redo, pushHistory };
}
