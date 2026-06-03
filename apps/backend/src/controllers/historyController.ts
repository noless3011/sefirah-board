import type { Request, Response, NextFunction } from "express";
import {
    GetBoardHistoryQuerySchema,
    GetBoardHistoryResponseSchema,
    GetBoardRevisionDetailResponseSchema,
    RestoreBoardRevisionPayloadSchema,
    RestoreBoardRevisionResponseSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import {
    getAuthenticatedUserId,
    getParam,
    parseQuery,
    parseBody,
} from "../utils/controllerUtils.js";
import { mapCanvasElementToDbElement } from "./canvasController.js";

// Helper to parse JSON fields safely
const parseJsonField = (field: any) => {
    if (!field) return field;
    return typeof field === "string" ? JSON.parse(field) : field;
};

/**
 * GET /api/v1/boards/:boardId/history
 * List recent revision snapshots for this board.
 */
export const listRevisions = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        // Parse query parameters
        const { limit } = parseQuery(GetBoardHistoryQuerySchema, req.query);

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

        // Fetch revisions
        const revisions = await db.boardRevision.findMany({
            where: { boardId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const mappedRevisions = revisions.map((rev) => ({
            id: rev.id,
            boardId: rev.boardId,
            authorId: rev.authorId,
            authorName: rev.authorName,
            elementCount: rev.elementCount,
            description: rev.description,
            createdAt: rev.createdAt.toISOString(),
        }));

        res.status(200).json(GetBoardHistoryResponseSchema.parse(mappedRevisions));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/boards/:boardId/history/:revisionId
 * Fetch the full canvas state for a specific revision.
 */
export const getRevisionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const revisionId = getParam(req, "revisionId");

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

        // Verify revision exists and belongs to this board
        const revision = await db.boardRevision.findUnique({
            where: { id: revisionId },
        });

        if (!revision || revision.boardId !== boardId) {
            throw new AppError("Revision not found", 404);
        }

        const rawElements = parseJsonField(revision.elements) || [];
        const elements = rawElements.map((el: any) => ({
            ...el,
            createdBy: el.createdBy || null,
            createdAt: el.createdAt ? new Date(el.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: el.updatedAt ? new Date(el.updatedAt).toISOString() : new Date().toISOString(),
        }));

        res.status(200).json(
            GetBoardRevisionDetailResponseSchema.parse({
                id: revision.id,
                boardId: revision.boardId,
                authorId: revision.authorId,
                authorName: revision.authorName,
                elementCount: revision.elementCount,
                description: revision.description,
                createdAt: revision.createdAt.toISOString(),
                elements,
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/history/restore
 * Restore the board to a past revision.
 */
export const restoreRevision = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");

        // Parse body payload
        const { revisionId } = parseBody(
            RestoreBoardRevisionPayloadSchema,
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

        // Verify revision exists and belongs to this board
        const revision = await db.boardRevision.findUnique({
            where: { id: revisionId },
        });

        if (!revision || revision.boardId !== boardId) {
            throw new AppError("Revision not found", 404);
        }

        // Get restorer user details to get fullName
        const restorer = await db.user.findUnique({
            where: { id: userId },
        });

        const authorName = restorer?.fullName || "Unknown";
        const rawElements = parseJsonField(revision.elements) || [];
        const elementsToRestore = rawElements.map((el: any) => ({
            ...el,
            createdBy: el.createdBy || null,
            createdAt: el.createdAt ? new Date(el.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: el.updatedAt ? new Date(el.updatedAt).toISOString() : new Date().toISOString(),
        }));

        let newRevision: any;

        // Perform atomic restore in transaction
        await db.$transaction(async (tx) => {
            // Delete all current elements on the board
            await tx.element.deleteMany({
                where: { boardId },
            });

            // Re-create the elements from the revision
            for (const el of elementsToRestore) {
                const dbData = mapCanvasElementToDbElement(el, boardId);
                await tx.element.create({
                    data: dbData,
                });
            }

            // Create a new BoardRevision record for the restore action
            newRevision = await tx.boardRevision.create({
                data: {
                    boardId,
                    authorId: userId,
                    authorName,
                    description: `Restored from revision ${revisionId}`,
                    elementCount: elementsToRestore.length,
                    elements: elementsToRestore,
                },
            });

            // Update the board's updatedAt timestamp
            await tx.board.update({
                where: { id: boardId },
                data: { updatedAt: new Date() },
            });
        });

        res.status(200).json(
            RestoreBoardRevisionResponseSchema.parse({
                revision: {
                    id: newRevision.id,
                    boardId: newRevision.boardId,
                    authorId: newRevision.authorId,
                    authorName: newRevision.authorName,
                    elementCount: newRevision.elementCount,
                    description: newRevision.description,
                    createdAt: newRevision.createdAt.toISOString(),
                },
                elements: elementsToRestore,
            }),
        );
    } catch (error) {
        next(error);
    }
};
