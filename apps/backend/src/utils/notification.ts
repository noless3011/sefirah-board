import db from "./db.js";
import { sendNotificationToUser } from "../sockets/workspace.js";
import { NotificationSchema } from "@sefirah/shared";

const mapNotificationType = (type: string): "invite" | "comment" | "mention" | "board-update" => {
    if (type === "board_update") return "board-update";
    return type as any;
};

export const toNotificationResponse = (notif: {
    id: string;
    type: string;
    message: string;
    boardId: string | null;
    isRead: boolean;
    createdAt: Date;
}) => {
    return NotificationSchema.parse({
        id: notif.id,
        type: mapNotificationType(notif.type),
        message: notif.message,
        boardId: notif.boardId,
        isRead: notif.isRead,
        createdAt: notif.createdAt.toISOString(),
    });
};

export async function createNotification(params: {
    userId: string;
    type: "invite" | "comment" | "mention" | "board-update";
    message: string;
    boardId?: string | null;
}) {
    const dbType = params.type === "board-update" ? "board_update" : params.type;
    const notif = await db.notification.create({
        data: {
            userId: params.userId,
            type: dbType as any,
            message: params.message,
            boardId: params.boardId || null,
        },
    });

    const parsedNotif = toNotificationResponse(notif);

    // Push via WebSocket to user's personal channel/room
    sendNotificationToUser(params.userId, parsedNotif);

    return notif;
}
