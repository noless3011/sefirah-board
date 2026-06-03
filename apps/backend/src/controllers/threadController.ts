import type { Request, Response, NextFunction } from "express";
import {
    ThreadSchema,
    ThreadReplySchema,
    CreateThreadPayloadSchema,
    ReplyToThreadPayloadSchema,
    UpdateThreadPayloadSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notification.js";
import {
    parseBody,
    getAuthenticatedUserId,
    getParam,
} from "../utils/controllerUtils.js";

// Helper to check board access
async function checkBoardAccess(userId: string, boardId: string) {
    const board = await db.board.findUnique({
        where: { id: boardId },
    });
    if (!board) {
        throw new AppError("Board not found", 404);
    }
    const isOwner = board.ownerId === userId;
    const collaborator = await db.collaborator.findFirst({
        where: { boardId, userId },
    });
    if (!isOwner && !collaborator) {
        throw new AppError("Forbidden", 403);
    }
    return board;
}

const serializeReply = (reply: any) => {
    let avatarUrl: string | null = null;
    if (reply.authorAvatarUrl) {
        try {
            new URL(reply.authorAvatarUrl);
            avatarUrl = reply.authorAvatarUrl;
        } catch {
            avatarUrl = null;
        }
    }

    return {
        id: reply.id,
        threadId: reply.threadId,
        authorId: reply.authorId,
        authorName: reply.authorName,
        authorAvatarUrl: avatarUrl,
        message: reply.message,
        createdAt: reply.createdAt.toISOString(),
    };
};

const serializeThread = (thread: any) => {
    let avatarUrl: string | null = null;
    if (thread.authorAvatarUrl) {
        try {
            new URL(thread.authorAvatarUrl);
            avatarUrl = thread.authorAvatarUrl;
        } catch {
            avatarUrl = null;
        }
    }

    return {
        id: thread.id,
        boardId: thread.boardId,
        targetElementId: thread.targetElementId,
        authorId: thread.authorId,
        authorName: thread.authorName,
        authorAvatarUrl: avatarUrl,
        message: thread.message,
        status: thread.status,
        replies: (thread.replies || []).map(serializeReply),
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
    };
};

/**
 * GET /api/v1/boards/:boardId/threads
 */
export const listThreads = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        await checkBoardAccess(userId, boardId);

        const threads = await db.thread.findMany({
            where: { boardId },
            include: {
                replies: {
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json(threads.map(serializeThread));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/threads
 */
export const createThread = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        const board = await checkBoardAccess(userId, boardId);

        const payload = parseBody(CreateThreadPayloadSchema, req.body);

        // Verify element exists on this board
        const element = await db.element.findFirst({
            where: { id: payload.targetElementId, boardId },
        });
        if (!element) {
            throw new AppError("Target element not found on this board", 404);
        }

        // Fetch author info
        const author = await db.user.findUnique({
            where: { id: userId },
        });
        if (!author) {
            throw new AppError("Unauthorized", 401);
        }

        // Create thread
        const thread = await db.thread.create({
            data: {
                boardId,
                targetElementId: payload.targetElementId,
                authorId: userId,
                authorName: author.fullName,
                authorAvatarUrl: author.avatarUrl,
                message: payload.message,
                status: "open",
            },
            include: {
                replies: true,
            },
        });

        // Trigger notifications for all other collaborators + owner
        const collaborators = await db.collaborator.findMany({
            where: { boardId },
            include: { user: true },
        });

        const recipientIds = new Set<string>();
        if (board.ownerId !== userId) {
            recipientIds.add(board.ownerId);
        }
        for (const collab of collaborators) {
            if (collab.userId !== userId) {
                recipientIds.add(collab.userId);
            }
        }

        const recipients = await db.user.findMany({
            where: { id: { in: Array.from(recipientIds) } },
        });

        const notificationPromises = recipients.map(async (recipient) => {
            const isMentioned = payload.message.includes(`@${recipient.fullName}`);
            const type = isMentioned ? "mention" : "comment";
            const msg = isMentioned
                ? `${author.fullName} mentioned you on "${board.title}".`
                : `${author.fullName} created a new comment thread on "${board.title}".`;

            await createNotification({
                userId: recipient.id,
                type,
                message: msg,
                boardId,
            });
        });

        await Promise.all(notificationPromises);

        res.status(201).json(serializeThread(thread));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/threads/:threadId/reply
 */
export const replyToThread = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const threadId = getParam(req, "threadId");

        const board = await checkBoardAccess(userId, boardId);

        // Verify thread exists and belongs to this board
        const thread = await db.thread.findFirst({
            where: { id: threadId, boardId },
        });
        if (!thread) {
            throw new AppError("Thread not found", 404);
        }

        const payload = parseBody(ReplyToThreadPayloadSchema, req.body);

        // Fetch author info
        const author = await db.user.findUnique({
            where: { id: userId },
        });
        if (!author) {
            throw new AppError("Unauthorized", 401);
        }

        // Create reply
        const reply = await db.threadReply.create({
            data: {
                threadId,
                authorId: userId,
                authorName: author.fullName,
                authorAvatarUrl: author.avatarUrl,
                message: payload.message,
            },
        });

        // Trigger notifications for mentions in reply message
        const collaborators = await db.collaborator.findMany({
            where: { boardId },
            include: { user: true },
        });

        const recipientIds = new Set<string>();
        if (board.ownerId !== userId) {
            recipientIds.add(board.ownerId);
        }
        for (const collab of collaborators) {
            if (collab.userId !== userId) {
                recipientIds.add(collab.userId);
            }
        }

        const recipients = await db.user.findMany({
            where: { id: { in: Array.from(recipientIds) } },
        });

        const notificationPromises = recipients
            .filter((recipient) => payload.message.includes(`@${recipient.fullName}`))
            .map(async (recipient) => {
                await createNotification({
                    userId: recipient.id,
                    type: "mention",
                    message: `${author.fullName} mentioned you on "${board.title}".`,
                    boardId,
                });
            });

        await Promise.all(notificationPromises);

        res.status(201).json(serializeReply(reply));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/boards/:boardId/threads/:threadId
 */
export const updateThread = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const threadId = getParam(req, "threadId");

        await checkBoardAccess(userId, boardId);

        // Verify thread exists and belongs to this board
        const thread = await db.thread.findFirst({
            where: { id: threadId, boardId },
        });
        if (!thread) {
            throw new AppError("Thread not found", 404);
        }

        const payload = parseBody(UpdateThreadPayloadSchema, req.body);

        // Update status to resolved
        const updatedThread = await db.thread.update({
            where: { id: threadId },
            data: {
                status: payload.status,
            },
            include: {
                replies: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        res.status(200).json(serializeThread(updatedThread));
    } catch (error) {
        next(error);
    }
};
