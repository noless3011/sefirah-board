import { Server, Socket, Namespace } from "socket.io";
import jwt from "jsonwebtoken";
import {
    JoinRoomPayloadSchema,
    CursorMovePayloadSchema,
    ElementCreatePayloadSchema,
    ElementUpdatePayloadSchema,
    ElementDeletePayloadSchema,
} from "@sefirah/shared";
import { logger } from "../utils/logger.js";
import db from "../utils/db.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthenticatedUser {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
}

/** Extend Socket to carry authenticated user data set during middleware. */
interface AuthenticatedSocket extends Socket {
    data: {
        user: AuthenticatedUser;
    };
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let workspaceNamespace: Namespace | null = null;

// In-memory tracking: socketId → boardId
const socketBoards = new Map<string, string>();

// ---------------------------------------------------------------------------
// Public helpers (used by notification utility and other server-side code)
// ---------------------------------------------------------------------------

/**
 * Push a notification payload to a specific user's personal Socket.IO room.
 * Called from `src/utils/notification.ts` when creating notifications.
 */
export function sendNotificationToUser(userId: string, notification: unknown) {
    if (workspaceNamespace) {
        workspaceNamespace
            .to(`user:${userId}`)
            .emit("notification", notification);
    }
}

/**
 * Broadcast an event and payload to all clients in a specific board room.
 */
export function broadcastToBoard(boardId: string, event: string, payload: unknown) {
    if (workspaceNamespace) {
        workspaceNamespace.to(boardId).emit(event, payload);
    }
}

// ---------------------------------------------------------------------------
// JWT authentication middleware for Socket.IO
// ---------------------------------------------------------------------------

async function authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void,
) {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "secret",
        ) as jwt.JwtPayload;

        const userId = decoded?.userId;

        if (!userId || typeof userId !== "string") {
            return next(
                new Error("Authentication error: Invalid token payload"),
            );
        }

        // Look up user from database for accurate name/avatar
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, fullName: true, avatarUrl: true },
        });

        if (!user) {
            return next(
                new Error("Authentication error: User not found"),
            );
        }

        // Attach user info to socket.data for use in event handlers
        (socket as AuthenticatedSocket).data = {
            user: {
                userId: user.id,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
            },
        };

        return next();
    } catch (err) {
        // jwt.verify throws on invalid/expired tokens
        if (err instanceof Error && err.message.startsWith("Authentication")) {
            return next(err);
        }
        return next(new Error("Authentication error: Invalid token"));
    }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export default function setupWorkspaceSockets(io: Server) {
    workspaceNamespace = io.of("/workspace");

    // Apply authentication middleware before any connection is accepted
    workspaceNamespace.use(authenticateSocket);

    workspaceNamespace.on("connection", (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const { user } = socket.data;

        logger.info(
            `[Socket.io] Client connected: ${socket.id} (user: ${user.userId})`,
        );

        // Join the user's personal room for targeted notification delivery
        socket.join(`user:${user.userId}`);

        // =====================================================================
        // A. Room Management
        // =====================================================================

        socket.on("join-room", (payload: unknown) => {
            const result = JoinRoomPayloadSchema.safeParse(payload);
            if (!result.success) {
                logger.warn(
                    `[Socket.io] Invalid join-room payload from ${socket.id}: ${result.error.message}`,
                );
                return;
            }

            const { boardId } = result.data;

            // Leave previous board room if any
            const previousBoard = socketBoards.get(socket.id);
            if (previousBoard && previousBoard !== boardId) {
                socket.leave(previousBoard);
                socket.to(previousBoard).emit("user-left", {
                    userId: user.userId,
                });
                logger.info(
                    `[Socket.io] ${socket.id} left board room: ${previousBoard}`,
                );
            }

            socket.join(boardId);
            socketBoards.set(socket.id, boardId);

            // Broadcast user-joined to everyone else in the room
            socket.to(boardId).emit("user-joined", {
                user: {
                    userId: user.userId,
                    fullName: user.fullName,
                    avatarUrl: user.avatarUrl,
                },
            });

            logger.info(
                `[Socket.io] ${socket.id} joined board room: ${boardId}`,
            );
        });

        socket.on("leave-room", (payload: unknown) => {
            const result = JoinRoomPayloadSchema.safeParse(payload);
            if (!result.success) return;

            const { boardId } = result.data;

            socket.leave(boardId);
            socket.to(boardId).emit("user-left", { userId: user.userId });
            socketBoards.delete(socket.id);

            logger.info(
                `[Socket.io] ${socket.id} left board room: ${boardId}`,
            );
        });

        // =====================================================================
        // B. Cursor Sync
        // =====================================================================

        socket.on("cursor-move", (payload: unknown) => {
            const boardId = socketBoards.get(socket.id);
            if (!boardId) return;

            const result = CursorMovePayloadSchema.safeParse(payload);
            if (!result.success) return;

            socket.to(boardId).emit("cursor-moved", {
                userId: user.userId,
                userName: user.fullName,
                x: result.data.x,
                y: result.data.y,
            });
        });

        // =====================================================================
        // C. Canvas Element Sync
        // =====================================================================

        socket.on("element-create", (payload: unknown) => {
            const boardId = socketBoards.get(socket.id);
            if (!boardId) return;

            const result = ElementCreatePayloadSchema.safeParse(payload);
            if (!result.success) {
                logger.warn(
                    `[Socket.io] Invalid element-create payload from ${socket.id}`,
                );
                return;
            }

            socket
                .to(boardId)
                .emit("element-created", { element: result.data.element });
        });

        socket.on("element-update", (payload: unknown) => {
            const boardId = socketBoards.get(socket.id);
            if (!boardId) return;

            const result = ElementUpdatePayloadSchema.safeParse(payload);
            if (!result.success) {
                logger.warn(
                    `[Socket.io] Invalid element-update payload from ${socket.id}`,
                );
                return;
            }

            socket.to(boardId).emit("element-updated", {
                id: result.data.id,
                changes: result.data.changes,
            });
        });

        socket.on("element-delete", (payload: unknown) => {
            const boardId = socketBoards.get(socket.id);
            if (!boardId) return;

            const result = ElementDeletePayloadSchema.safeParse(payload);
            if (!result.success) {
                logger.warn(
                    `[Socket.io] Invalid element-delete payload from ${socket.id}`,
                );
                return;
            }

            socket.to(boardId).emit("element-deleted", { id: result.data.id });
        });

        // =====================================================================
        // Disconnect Handling
        // =====================================================================

        socket.on("disconnect", () => {
            const boardId = socketBoards.get(socket.id);

            if (boardId) {
                socket.to(boardId).emit("user-left", {
                    userId: user.userId,
                });
            }

            socketBoards.delete(socket.id);

            logger.info(
                `[Socket.io] Client disconnected: ${socket.id} (user: ${user.userId})`,
            );
        });
    });
}
