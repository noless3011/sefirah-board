import { useEffect, useRef, useCallback } from "react";
import type { CanvasElement } from "@sefirah/shared";
import { useSocket } from "../../../socket/SocketProvider";

interface WorkspaceSocketCallbacks {
    onUserJoined: (user: { userId: string; fullName: string; avatarUrl: string | null }) => void;
    onUserLeft: (userId: string) => void;
    onCursorMoved: (data: { userId: string; userName: string; x: number; y: number }) => void;
    onElementCreated: (element: CanvasElement) => void;
    onElementUpdated: (id: string, changes: Record<string, unknown>) => void;
    onElementDeleted: (id: string) => void;
}

export function useWorkspaceSocket(boardId: string, callbacks: WorkspaceSocketCallbacks) {
    const socket = useSocket();
    const callbacksRef = useRef<WorkspaceSocketCallbacks>(callbacks);
    callbacksRef.current = callbacks;

    const lastCursorEmitRef = useRef<number>(0);

    useEffect(() => {
        if (!socket) return;

        // Join room on mount or when boardId changes
        socket.emit("join-room", { boardId });

        // Connect/disconnect logs
        const onConnect = () => {
            socket.emit("join-room", { boardId });
        };

        socket.on("connect", onConnect);

        // Subscribing to socket events
        socket.on("user-joined", (data: { user: { userId: string; fullName: string; avatarUrl: string | null } }) => {
            if (data && data.user) {
                callbacksRef.current.onUserJoined(data.user);
            }
        });

        socket.on("user-left", (data: { userId: string }) => {
            if (data && data.userId) {
                callbacksRef.current.onUserLeft(data.userId);
            }
        });

        socket.on("cursor-moved", (data: { userId: string; userName: string; x: number; y: number }) => {
            if (data) {
                callbacksRef.current.onCursorMoved(data);
            }
        });

        socket.on("element-created", (data: { element: CanvasElement }) => {
            if (data && data.element) {
                callbacksRef.current.onElementCreated(data.element);
            }
        });

        socket.on("element-updated", (data: { id: string; changes: Record<string, unknown> }) => {
            if (data && data.id && data.changes) {
                callbacksRef.current.onElementUpdated(data.id, data.changes);
            }
        });

        socket.on("element-deleted", (data: { id: string }) => {
            if (data && data.id) {
                callbacksRef.current.onElementDeleted(data.id);
            }
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("user-joined");
            socket.off("user-left");
            socket.off("cursor-moved");
            socket.off("element-created");
            socket.off("element-updated");
            socket.off("element-deleted");
        };
    }, [socket, boardId]);

    // Emit functions
    const emitCursorMove = useCallback((x: number, y: number) => {
        if (!socket || !socket.connected) return;

        const now = Date.now();
        if (now - lastCursorEmitRef.current > 50) {
            socket.emit("cursor-move", { x, y });
            lastCursorEmitRef.current = now;
        }
    }, [socket]);

    const emitElementCreate = useCallback((element: CanvasElement) => {
        if (!socket || !socket.connected) return;
        socket.emit("element-create", { element });
    }, [socket]);

    const emitElementUpdate = useCallback((id: string, changes: Record<string, unknown>) => {
        if (!socket || !socket.connected) return;
        socket.emit("element-update", { id, changes });
    }, [socket]);

    const emitElementDelete = useCallback((id: string) => {
        if (!socket || !socket.connected) return;
        socket.emit("element-delete", { id });
    }, [socket]);

    return {
        emitCursorMove,
        emitElementCreate,
        emitElementUpdate,
        emitElementDelete,
    };
}
