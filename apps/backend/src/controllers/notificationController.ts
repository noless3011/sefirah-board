import type { Request, Response, NextFunction } from "express";
import {
    GetNotificationsQuerySchema,
    GetNotificationsResponseSchema,
    MarkNotificationReadPayloadSchema,
    MarkAllNotificationsReadResponseSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import {
    parseBody,
    parseQuery,
    getAuthenticatedUserId,
    getParam,
} from "../utils/controllerUtils.js";
import { toNotificationResponse } from "../utils/notification.js";

/**
 * GET /api/v1/notifications
 */
export const getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const parsed = parseQuery(GetNotificationsQuerySchema, req.query);
        const page = parsed.page ?? 1;
        const limit = parsed.limit ?? 20;

        let isRead: boolean | undefined = undefined;
        if (req.query.isRead === "true" || req.query.isRead === "1" || req.query.isRead === true) {
            isRead = true;
        } else if (req.query.isRead === "false" || req.query.isRead === "0" || req.query.isRead === false) {
            isRead = false;
        }

        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (isRead !== undefined) {
            where.isRead = isRead;
        }

        const [total, notificationsRaw] = await Promise.all([
            db.notification.count({ where }),
            db.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        const data = notificationsRaw.map(toNotificationResponse);

        res.status(200).json(
            GetNotificationsResponseSchema.parse({
                data,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const unreadCount = await db.notification.count({
            where: { userId, isRead: false },
        });

        res.status(200).json({ unreadCount });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/notifications/:notificationId
 */
export const markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const notificationId = getParam(req, "notificationId");
        const { isRead } = parseBody(MarkNotificationReadPayloadSchema, req.body);

        const notif = await db.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notif) {
            throw new AppError("Notification not found", 404);
        }

        const updated = await db.notification.update({
            where: { id: notificationId },
            data: { isRead },
        });

        res.status(200).json(toNotificationResponse(updated));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/notifications/mark-all-read
 */
export const markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const { count } = await db.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.status(200).json(
            MarkAllNotificationsReadResponseSchema.parse({
                updatedCount: count,
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/notifications/:notificationId
 */
export const deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const notificationId = getParam(req, "notificationId");

        const notif = await db.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notif) {
            throw new AppError("Notification not found", 404);
        }

        await db.notification.delete({
            where: { id: notificationId },
        });

        res.status(204).end();
    } catch (error) {
        next(error);
    }
};
