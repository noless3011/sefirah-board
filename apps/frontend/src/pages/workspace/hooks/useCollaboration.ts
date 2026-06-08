import { useState, useEffect, useCallback, useRef } from "react";
import type { CanvasElement } from "@sefirah/shared";
import type {
    CollaboratorCursorInfo,
    OnlineCollaborator,
} from "../types/canvas.types";
import { useSocket } from "../../../socket/SocketProvider";

// Colors assigned to collaborators
const CURSOR_COLORS = [
    "#4285f4",
    "#f5a623",
    "#34a853",
    "#ea4335",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#3498db",
];

export function useCollaboration(
    boardId: string,
    onElementCreated: (element: CanvasElement) => void,
    onElementUpdated: (id: string, changes: Partial<CanvasElement>) => void,
    onElementDeleted: (id: string) => void
) {
    const socket = useSocket();
    const [cursors, setCursors] = useState<CollaboratorCursorInfo[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineCollaborator[]>([]);
    const colorMap = useRef<Map<string, string>>(new Map());
    const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getColor = useCallback((userId: string) => {
        if (!colorMap.current.has(userId)) {
            const idx = colorMap.current.size % CURSOR_COLORS.length;
            colorMap.current.set(userId, CURSOR_COLORS[idx]);
        }
        return colorMap.current.get(userId)!;
    }, []);

    // Stabilize callbacks using refs to avoid useEffect triggers on state changes
    const onElementCreatedRef = useRef(onElementCreated);
    const onElementUpdatedRef = useRef(onElementUpdated);
    const onElementDeletedRef = useRef(onElementDeleted);
    const getColorRef = useRef(getColor);

    useEffect(() => {
        onElementCreatedRef.current = onElementCreated;
        onElementUpdatedRef.current = onElementUpdated;
        onElementDeletedRef.current = onElementDeleted;
        getColorRef.current = getColor;
    });

    // Join the board room
    useEffect(() => {
        const joinRoom = () => {
            socket.emit("join-room", { boardId });
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on("connect", joinRoom);

        const handleUserJoined = (data: {
            user: { userId: string; fullName: string; avatarUrl?: string };
        }) => {
            setOnlineUsers((prev) => {
                if (prev.some((u) => u.userId === data.user.userId))
                    return prev;
                return [...prev, data.user];
            });
        };

        const handleUserLeft = (data: { userId: string }) => {
            setOnlineUsers((prev) =>
                prev.filter((u) => u.userId !== data.userId)
            );
            setCursors((prev) =>
                prev.filter((c) => c.userId !== data.userId)
            );
        };

        const handleCursorMoved = (data: {
            userId: string;
            userName: string;
            x: number;
            y: number;
        }) => {
            setCursors((prev) => {
                const existing = prev.find((c) => c.userId === data.userId);
                const cursor: CollaboratorCursorInfo = {
                    userId: data.userId,
                    userName: data.userName,
                    color: getColorRef.current(data.userId),
                    x: data.x,
                    y: data.y,
                };
                if (existing) {
                    return prev.map((c) =>
                        c.userId === data.userId ? cursor : c
                    );
                }
                return [...prev, cursor];
            });
        };

        const handleElementCreated = (data: { element: CanvasElement }) => {
            onElementCreatedRef.current(data.element);
        };

        const handleElementUpdated = (data: {
            id: string;
            changes: Partial<CanvasElement>;
        }) => {
            onElementUpdatedRef.current(data.id, data.changes);
        };

        const handleElementDeleted = (data: { id: string }) => {
            onElementDeletedRef.current(data.id);
        };

        socket.on("user-joined", handleUserJoined);
        socket.on("user-left", handleUserLeft);
        socket.on("cursor-moved", handleCursorMoved);
        socket.on("element-created", handleElementCreated);
        socket.on("element-updated", handleElementUpdated);
        socket.on("element-deleted", handleElementDeleted);

        return () => {
            socket.off("connect", joinRoom);
            socket.off("user-joined", handleUserJoined);
            socket.off("user-left", handleUserLeft);
            socket.off("cursor-moved", handleCursorMoved);
            socket.off("element-created", handleElementCreated);
            socket.off("element-updated", handleElementUpdated);
            socket.off("element-deleted", handleElementDeleted);
            socket.emit("leave-room", { boardId });
        };
    }, [socket, boardId]);

    const emitCursorMove = useCallback(
        (x: number, y: number) => {
            // Throttle at ~50ms
            if (throttleTimer.current) return;
            throttleTimer.current = setTimeout(() => {
                throttleTimer.current = null;
            }, 50);
            socket.emit("cursor-move", { x, y });
        },
        [socket]
    );

    const emitElementCreate = useCallback(
        (element: CanvasElement) => {
            socket.emit("element-create", { element });
        },
        [socket]
    );

    const emitElementUpdate = useCallback(
        (id: string, changes: Partial<CanvasElement>) => {
            socket.emit("element-update", { id, changes });
        },
        [socket]
    );

    const emitElementDelete = useCallback(
        (id: string) => {
            socket.emit("element-delete", { id });
        },
        [socket]
    );

    return {
        cursors,
        onlineUsers,
        emitCursorMove,
        emitElementCreate,
        emitElementUpdate,
        emitElementDelete,
    };
}
