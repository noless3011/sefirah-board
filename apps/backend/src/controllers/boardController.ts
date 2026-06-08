import type { Request, Response, NextFunction } from "express";
import {
    BoardSchema,
    GetBoardsQuerySchema,
    GetBoardsResponseSchema,
    CreateBoardPayloadSchema,
    UpdateBoardPayloadSchema,
    UploadBoardThumbnailResponseSchema,
    ExportBoardPayloadSchema,
    ExportBoardResponseSchema,
} from "@sefirah/shared";
import { randomUUID } from "crypto";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notification.js";
import {
    parseBody,
    parseQuery,
    getAuthenticatedUserId,
    getParam,
} from "../utils/controllerUtils.js";

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Maps Prisma generated enum keys to the kebab-case strings expected by the shared models.
 */
const mapBoardBadge = (badge: string | null): any => {
    if (!badge) return null;
    // Prisma enum keys: active_project, review_required, archived
    // Shared schema: active-project, review-required, archived
    return badge.replace("_", "-");
};

// =============================================================================
// CONTROLLER ACTIONS
// =============================================================================

/**
 * GET /api/v1/boards
 */
export const listBoards = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const {
            type,
            search,
            page = 1,
            limit = 20,
        } = parseQuery(GetBoardsQuerySchema, req.query);

        const skip = (page - 1) * limit;

        let where: any = {};
        if (type === "personal") {
            where.ownerId = userId;
        } else if (type === "shared") {
            where.ownerId = { not: userId };
            where.collaborators = { some: { userId } };
        } else {
            where.OR = [
                { ownerId: userId },
                { collaborators: { some: { userId } } },
            ];
        }

        if (search) {
            where.title = { contains: search, mode: "insensitive" };
        }

        const [total, boardsRaw] = await Promise.all([
            db.board.count({ where }),
            db.board.findMany({
                where,
                include: {
                    owner: true,
                    sharedBy: true,
                    collaborators: {
                        include: { user: true },
                        take: 5,
                    },
                    _count: {
                        select: { collaborators: true },
                    },
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        const boards = boardsRaw as any[];

        const data = boards.map((board) => {
            const isOwner = board.ownerId === userId;
            return BoardSchema.parse({
                id: board.id,
                title: board.title,
                thumbnailUrl: board.thumbnailUrl,
                type: isOwner ? "personal" : "shared",
                status: board.status,
                badge: mapBoardBadge(board.badge),
                visibilityIcon: board.visibilityIcon,
                ownerId: board.ownerId,
                templateId: board.templateId,
                sharedBy: board.sharedBy
                    ? {
                          userId: board.sharedBy.id,
                          fullName: board.sharedBy.fullName,
                          avatarUrl: board.sharedBy.avatarUrl,
                      }
                    : null,
                collaborators: board.collaborators.map((c: any) => ({
                    userId: c.user.id,
                    fullName: c.user.fullName,
                    avatarUrl: c.user.avatarUrl,
                })),
                extraCollaboratorsCount: Math.max(
                    0,
                    board._count.collaborators - board.collaborators.length,
                ),
                createdAt: board.createdAt.toISOString(),
                updatedAt: board.updatedAt.toISOString(),
            });
        });

        res.status(200).json(
            GetBoardsResponseSchema.parse({
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
 * POST /api/v1/boards
 */
export const createBoard = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { title, templateId } = parseBody(
            CreateBoardPayloadSchema,
            req.body,
        );

        let templateElements: any[] = [];
        if (templateId) {
            const template = await db.template.findUnique({
                where: { id: templateId }
            });
            if (template && template.elements) {
                templateElements = typeof template.elements === "string"
                    ? JSON.parse(template.elements)
                    : (template.elements as any[]);
            }
        }

        const board = (await db.board.create({
            data: {
                title,
                ownerId: userId,
                templateId: templateId || null,
            },
            include: {
                owner: true,
                collaborators: {
                    include: { user: true },
                },
                _count: {
                    select: { collaborators: true },
                },
            },
        })) as any;

        if (templateElements.length > 0) {
            const idMap: { [oldId: string]: string } = {};
            const elementsWithNewIds = templateElements.map((el: any) => {
                const oldId = el.id || el.tempId || Math.random().toString();
                const newId = randomUUID();
                idMap[oldId] = newId;
                return {
                    ...el,
                    id: newId,
                    oldId,
                };
            });

            for (const el of elementsWithNewIds) {
                const mappedStartElementId = el.startElementId ? (idMap[el.startElementId] || el.startElementId) : null;
                const mappedEndElementId = el.endElementId ? (idMap[el.endElementId] || el.endElementId) : null;

                let type = el.type;
                if (type === "sticky-note" || type === "sticky_note") type = "sticky_note";
                else if (type === "service-card" || type === "service_card") type = "service_card";
                else if (type === "database-card" || type === "database_card") type = "database_card";

                await db.element.create({
                    data: {
                        id: el.id,
                        boardId: board.id,
                        type,
                        x: el.x || 0,
                        y: el.y || 0,
                        width: el.width || 100,
                        height: el.height || 100,
                        rotation: el.rotation ?? 0,
                        zIndex: el.zIndex ?? 0,
                        isLocked: el.isLocked ?? false,
                        appearance: el.appearance ?? {},
                        createdBy: userId,
                        content: el.content || null,
                        badge: el.badge || null,
                        title: el.title || null,
                        description: el.description || null,
                        src: el.src || null,
                        altText: el.altText || null,
                        label: el.label || null,
                        childElementIds: el.childElementIds || null,
                        startElementId: mappedStartElementId,
                        endElementId: mappedEndElementId,
                        points: el.points || null,
                        strokeDash: el.strokeDash ?? null,
                    }
                });
            }
        }

        res.status(201).json(
            BoardSchema.parse({
                id: board.id,
                title: board.title,
                thumbnailUrl: board.thumbnailUrl,
                type: "personal",
                status: board.status,
                badge: mapBoardBadge(board.badge),
                visibilityIcon: board.visibilityIcon,
                ownerId: board.ownerId,
                templateId: board.templateId,
                sharedBy: null,
                collaborators: [],
                extraCollaboratorsCount: 0,
                createdAt: board.createdAt.toISOString(),
                updatedAt: board.updatedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/boards/:boardId
 */
export const getBoard = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        const boardRaw = await db.board.findUnique({
            where: { id: boardId },
            include: {
                owner: true,
                sharedBy: true,
                collaborators: {
                    include: { user: true },
                    take: 5,
                },
                _count: {
                    select: { collaborators: true },
                },
            },
        });

        if (!boardRaw) {
            throw new AppError("Board not found", 404);
        }

        const board = boardRaw as any;

        // Check if user has access (owner or collaborator)
        const isOwner = board.ownerId === userId;
        const isCollaborator = await db.collaborator.findFirst({
            where: { boardId, userId },
        });

        if (!isOwner && !isCollaborator) {
            throw new AppError("Forbidden", 403);
        }

        res.status(200).json(
            BoardSchema.parse({
                id: board.id,
                title: board.title,
                thumbnailUrl: board.thumbnailUrl,
                type: isOwner ? "personal" : "shared",
                status: board.status,
                badge: mapBoardBadge(board.badge),
                visibilityIcon: board.visibilityIcon,
                ownerId: board.ownerId,
                templateId: board.templateId,
                sharedBy: board.sharedBy
                    ? {
                          userId: board.sharedBy.id,
                          fullName: board.sharedBy.fullName,
                          avatarUrl: board.sharedBy.avatarUrl,
                      }
                    : null,
                collaborators: board.collaborators.map((c: any) => ({
                    userId: c.user.id,
                    fullName: c.user.fullName,
                    avatarUrl: c.user.avatarUrl,
                })),
                extraCollaboratorsCount: Math.max(
                    0,
                    board._count.collaborators - board.collaborators.length,
                ),
                createdAt: board.createdAt.toISOString(),
                updatedAt: board.updatedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/boards/:boardId
 */
export const updateBoard = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const payload = parseBody(UpdateBoardPayloadSchema, req.body);

        const boardBase = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!boardBase) {
            throw new AppError("Board not found", 404);
        }

        if (boardBase.ownerId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        const updateData: any = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.isArchived !== undefined)
            updateData.status = payload.isArchived ? "archived" : "active";
        if (payload.badge !== undefined) {
            updateData.badge = payload.badge
                ? payload.badge.replace("-", "_")
                : null;
        }
        if (payload.visibilityIcon !== undefined)
            updateData.visibilityIcon = payload.visibilityIcon;

        const isRenamed = payload.title !== undefined && payload.title !== boardBase.title;
        const isArchiveChanged = payload.isArchived !== undefined && (payload.isArchived ? "archived" : "active") !== boardBase.status;
        const mappedBadge = payload.badge ? payload.badge.replace("-", "_") : null;
        const isBadgeChanged = payload.badge !== undefined && mappedBadge !== boardBase.badge;

        const updatedBoard = (await db.board.update({
            where: { id: boardId },
            data: updateData,
            include: {
                owner: true,
                sharedBy: true,
                collaborators: {
                    include: { user: true },
                    take: 5,
                },
                _count: {
                    select: { collaborators: true },
                },
            },
        })) as any;

        if (isRenamed || isArchiveChanged || isBadgeChanged) {
            const collaborators = await db.collaborator.findMany({
                where: { boardId },
            });
            const owner = await db.user.findUnique({ where: { id: userId } });
            const ownerName = owner ? owner.fullName : "The owner";
            let actionMsg = "";
            if (isRenamed) {
                actionMsg = `renamed the board to "${payload.title}"`;
            } else if (isArchiveChanged) {
                actionMsg = payload.isArchived ? `archived the board` : `unarchived the board`;
            } else if (isBadgeChanged) {
                actionMsg = `updated the badge of the board`;
            }

            const message = `${ownerName} ${actionMsg} "${boardBase.title}".`;

            await Promise.all(
                collaborators.map((collab) =>
                    createNotification({
                        userId: collab.userId,
                        type: "board-update",
                        message,
                        boardId,
                    })
                )
            );
        }

        res.status(200).json(
            BoardSchema.parse({
                id: updatedBoard.id,
                title: updatedBoard.title,
                thumbnailUrl: updatedBoard.thumbnailUrl,
                type: "personal",
                status: updatedBoard.status,
                badge: mapBoardBadge(updatedBoard.badge),
                visibilityIcon: updatedBoard.visibilityIcon,
                ownerId: updatedBoard.ownerId,
                templateId: updatedBoard.templateId,
                sharedBy: updatedBoard.sharedBy
                    ? {
                          userId: updatedBoard.sharedBy.id,
                          fullName: updatedBoard.sharedBy.fullName,
                          avatarUrl: updatedBoard.sharedBy.avatarUrl,
                      }
                    : null,
                collaborators: updatedBoard.collaborators.map((c: any) => ({
                    userId: c.user.id,
                    fullName: c.user.fullName,
                    avatarUrl: c.user.avatarUrl,
                })),
                extraCollaboratorsCount: Math.max(
                    0,
                    updatedBoard._count.collaborators -
                        updatedBoard.collaborators.length,
                ),
                createdAt: updatedBoard.createdAt.toISOString(),
                updatedAt: updatedBoard.updatedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/boards/:boardId
 */
export const deleteBoard = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        if (board.ownerId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        await db.board.delete({
            where: { id: boardId },
        });

        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/thumbnail
 */
export const uploadThumbnail = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        const board = await db.board.findUnique({ where: { id: boardId } });
        if (!board) throw new AppError("Board not found", 404);

        const isOwner = board.ownerId === userId;
        const isCollaborator = await db.collaborator.findFirst({
            where: { boardId, userId },
        });
        if (!isOwner && !isCollaborator) throw new AppError("Forbidden", 403);

        const thumbnailUrl = `https://placehold.co/600x400?text=${encodeURIComponent(board.title)}`;

        await db.board.update({
            where: { id: boardId },
            data: { thumbnailUrl },
        });

        res.status(200).json(
            UploadBoardThumbnailResponseSchema.parse({ thumbnailUrl }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/export
 */
export const exportBoard = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const { format } = parseBody(ExportBoardPayloadSchema, req.body);

        const board = await db.board.findUnique({ where: { id: boardId } });
        if (!board) throw new AppError("Board not found", 404);

        const isOwner = board.ownerId === userId;
        const isCollaborator = await db.collaborator.findFirst({
            where: { boardId, userId },
        });
        if (!isOwner && !isCollaborator) throw new AppError("Forbidden", 403);

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const downloadUrl = `https://example.com/exports/${boardId}.${format}`;

        await db.exportJob.create({
            data: {
                boardId,
                requestedById: userId,
                format,
                status: "completed",
                downloadUrl,
                expiresAt,
            },
        });

        res.status(202).json(
            ExportBoardResponseSchema.parse({
                downloadUrl,
                expiresAt: expiresAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};
