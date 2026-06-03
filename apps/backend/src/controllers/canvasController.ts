import type { Request, Response, NextFunction } from "express";
import {
    GetCanvasElementsResponseSchema,
    SaveCanvasSnapshotPayloadSchema,
    CanvasElementSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import {
    parseBody,
    getAuthenticatedUserId,
    getParam,
} from "../utils/controllerUtils.js";

// Helper to parse JSON fields safely
const parseJsonField = (field: any) => {
    if (!field) return field;
    return typeof field === "string" ? JSON.parse(field) : field;
};

// Maps Prisma database element to shared CanvasElement typescript structure
export const mapDbElementToCanvasElement = (el: any): any => {
    const base = {
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        zIndex: el.zIndex,
        isLocked: el.isLocked,
        appearance: parseJsonField(el.appearance),
        createdBy: el.createdBy || null,
        createdAt: el.createdAt.toISOString(),
        updatedAt: el.updatedAt.toISOString(),
    };

    // Map Prisma enum type back to kebab-case strings
    let type = el.type;
    if (type === "sticky_note") type = "sticky-note";
    else if (type === "service_card") type = "service-card";
    else if (type === "database_card") type = "database-card";

    switch (type) {
        case "text":
        case "sticky-note":
            return {
                ...base,
                type,
                content: el.content ?? "",
            };
        case "service-card":
        case "database-card":
            return {
                ...base,
                type,
                badge: el.badge ?? "",
                title: el.title ?? "",
                description: el.description ?? "",
            };
        case "line":
        case "arrow":
        case "connector":
            return {
                ...base,
                type,
                startElementId: el.startElementId || undefined,
                endElementId: el.endElementId || undefined,
                points: parseJsonField(el.points) || [],
                strokeDash: el.strokeDash ?? undefined,
            };
        case "image":
            return {
                ...base,
                type,
                src: el.src ?? "",
                altText: el.altText || undefined,
            };
        case "frame":
            return {
                ...base,
                type,
                label: el.label || undefined,
                childElementIds: parseJsonField(el.childElementIds) || [],
            };
        case "rectangle":
        case "ellipse":
        case "diamond":
        case "triangle":
            return {
                ...base,
                type,
            };
        default:
            throw new Error(`Unknown element type: ${type}`);
    }
};

// Maps shared CanvasElement typescript structure back to database schema structure
export const mapCanvasElementToDbElement = (el: any, boardId: string): any => {
    // Map type back to Prisma enum keys
    let type = el.type;
    if (type === "sticky-note") type = "sticky_note";
    else if (type === "service-card") type = "service_card";
    else if (type === "database-card") type = "database_card";

    const dbEl: any = {
        id: el.id,
        boardId,
        type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation ?? 0,
        zIndex: el.zIndex ?? 0,
        isLocked: el.isLocked ?? false,
        appearance: el.appearance ?? {},
        createdBy: el.createdBy || null,
        createdAt: el.createdAt ? new Date(el.createdAt) : new Date(),
        updatedAt: el.updatedAt ? new Date(el.updatedAt) : new Date(),
        content: null,
        badge: null,
        title: null,
        description: null,
        src: null,
        altText: null,
        label: null,
        childElementIds: null,
        startElementId: null,
        endElementId: null,
        points: null,
        strokeDash: null,
    };

    switch (el.type) {
        case "text":
        case "sticky-note":
            dbEl.content = el.content;
            break;
        case "service-card":
        case "database-card":
            dbEl.badge = el.badge;
            dbEl.title = el.title;
            dbEl.description = el.description;
            break;
        case "line":
        case "arrow":
        case "connector":
            dbEl.startElementId = el.startElementId || null;
            dbEl.endElementId = el.endElementId || null;
            dbEl.points = el.points || [];
            dbEl.strokeDash = el.strokeDash ?? null;
            break;
        case "image":
            dbEl.src = el.src;
            dbEl.altText = el.altText || null;
            break;
        case "frame":
            dbEl.label = el.label || null;
            dbEl.childElementIds = el.childElementIds || [];
            break;
    }

    return dbEl;
};

/**
 * GET /api/v1/boards/:boardId/canvas/elements
 * Load all canvas elements when a user first opens a board.
 */
export const getCanvasElements = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        // Verify board exists
        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Verify access (owner or collaborator)
        const isOwner = board.ownerId === userId;
        const collaborator = await db.collaborator.findFirst({
            where: { boardId, userId },
        });

        if (!isOwner && !collaborator) {
            throw new AppError("Forbidden", 403);
        }

        // Fetch all elements for the board ordered by zIndex
        const dbElements = await db.element.findMany({
            where: { boardId },
            orderBy: { zIndex: "asc" },
        });

        const elements = dbElements.map(mapDbElementToCanvasElement);

        res.status(200).json(
            GetCanvasElementsResponseSchema.parse({
                boardId,
                elements,
                lastSavedAt: board.updatedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/boards/:boardId/canvas/snapshot
 * Overwrite the entire canvas state (auto-save fallback).
 */
export const saveCanvasSnapshot = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        // Validate payload elements array
        const { elements: incomingElements } = parseBody(
            SaveCanvasSnapshotPayloadSchema,
            req.body,
        );

        // Verify board exists
        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Verify write access (owner or collaborator with editor role)
        const isOwner = board.ownerId === userId;
        let hasWriteAccess = isOwner;
        if (!isOwner) {
            const collaborator = await db.collaborator.findFirst({
                where: { boardId, userId },
            });
            if (collaborator && collaborator.role === "editor") {
                hasWriteAccess = true;
            }
        }

        if (!hasWriteAccess) {
            throw new AppError("Forbidden", 403);
        }

        // Sync elements inside transaction
        await db.$transaction(async (tx) => {
            // Find all existing elements on this board
            const existingElements = await tx.element.findMany({
                where: { boardId },
                select: { id: true },
            });

            const incomingIds = new Set(incomingElements.map((el) => el.id));
            const existingIds = new Set(existingElements.map((el) => el.id));

            // 1. Delete elements that are not in incomingElements
            const idsToDelete = existingElements
                .filter((el) => !incomingIds.has(el.id))
                .map((el) => el.id);

            if (idsToDelete.length > 0) {
                await tx.element.deleteMany({
                    where: {
                        id: { in: idsToDelete },
                    },
                });
            }

            // 2. Insert or update the elements
            for (const el of incomingElements) {
                const dbData = mapCanvasElementToDbElement(el, boardId);
                if (existingIds.has(el.id)) {
                    await tx.element.update({
                        where: { id: el.id },
                        data: dbData,
                    });
                } else {
                    await tx.element.create({
                        data: dbData,
                    });
                }
            }

            // 3. Update the board's updatedAt timestamp
            await tx.board.update({
                where: { id: boardId },
                data: { updatedAt: new Date() },
            });
        });

        res.status(200).json({
            message: "Canvas snapshot saved successfully",
        });
    } catch (error) {
        next(error);
    }
};
