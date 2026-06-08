import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasViewport } from "../types/canvas.types";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function useCanvas(canvasRef: React.RefObject<HTMLDivElement | null>) {
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
                Math.max(v.zoom + delta, MIN_ZOOM),
                MAX_ZOOM
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
    }, [canvasRef]);

    // Keep handleWheel as empty callback for compatibility
    const handleWheel = useCallback(() => {}, []);

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
                setViewport((v) => ({
                    ...v,
                    x: e.clientX - panStart.current!.x,
                    y: e.clientY - panStart.current!.y,
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
        handleWheel,
        startPan,
        movePan,
        endPan,
        screenToCanvas,
    };
}
