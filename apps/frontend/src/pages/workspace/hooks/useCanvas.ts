import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasViewport } from "../types/canvas.types";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function useCanvas() {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [viewport, setViewport] = useState<CanvasViewport>({
        x: 0,
        y: 0,
        zoom: 0.85,
    });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef<{ x: number; y: number } | null>(null);
    const viewportRef = useRef(viewport);

    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    const zoomIn = useCallback(() => {
        setViewport((v) => ({
            ...v,
            zoom: Math.min(v.zoom + ZOOM_STEP, MAX_ZOOM),
        }));
    }, []);

    const zoomOut = useCallback(() => {
        setViewport((v) => ({
            ...v,
            zoom: Math.max(v.zoom - ZOOM_STEP, MIN_ZOOM),
        }));
    }, []);

    const setZoom = useCallback((zoom: number) => {
        setViewport((v) => ({
            ...v,
            zoom: Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM),
        }));
    }, []);





    const startPan = useCallback(
        (e: React.MouseEvent) => {
            if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
                e.preventDefault();
                setIsPanning(true);
                panStart.current = {
                    x: e.clientX - viewportRef.current.x,
                    y: e.clientY - viewportRef.current.y,
                };
            }
        },
        []
    );

    const movePan = useCallback(
        (e: React.MouseEvent) => {
            if (isPanning && panStart.current) {
                const startX = panStart.current.x;
                const startY = panStart.current.y;
                setViewport((v) => ({
                    ...v,
                    x: e.clientX - startX,
                    y: e.clientY - startY,
                }));
            }
        },
        [isPanning]
    );

    const endPan = useCallback(() => {
        setIsPanning(false);
        panStart.current = null;
    }, []);

    /** Convert screen coords to canvas coords */
    const screenToCanvas = useCallback(
        (screenX: number, screenY: number) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return { x: 0, y: 0 };
            const v = viewportRef.current;
            return {
                x: (screenX - rect.left - v.x) / v.zoom,
                y: (screenY - rect.top - v.y) / v.zoom,
            };
        },
        [canvasRef]
    );

    return {
        viewport,
        setViewport,
        isPanning,
        zoomIn,
        zoomOut,
        setZoom,
        startPan,
        movePan,
        endPan,
        screenToCanvas,
        canvasRef,
    };
}
