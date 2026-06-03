import type { Request, Response, NextFunction } from "express";
import {
    CollaboratorSchema,
    GetCollaboratorsResponseSchema,
    InviteCollaboratorPayloadSchema,
    GenerateInviteLinkPayloadSchema,
    GenerateInviteLinkResponseSchema,
    UpdateCollaboratorRolePayloadSchema,
    UpdateCollaboratorResponseSchema,
    RemoveCollaboratorResponseSchema,
    RedeemInvitePayloadSchema,
    RedeemInviteResponseSchema,
    BoardSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notification.js";
import {
    parseBody,
    getAuthenticatedUserId,
    getParam,
    normalizeEmail,
} from "../utils/controllerUtils.js";
import { randomBytes } from "node:crypto";

/**
 * Maps Prisma generated enum keys to the kebab-case strings expected by the shared models.
 */
const mapBoardBadge = (badge: string | null): any => {
    if (!badge) return null;
    return badge.replace("_", "-");
};

/**
 * GET /api/v1/boards/:boardId/collaborators
 * List all members with access to this board.
 */
export const listCollaborators = async (
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

        // Must be owner or collaborator to see the list
        const isOwner = board.ownerId === userId;
        const isCollaborator = await db.collaborator.findFirst({
            where: { boardId, userId },
        });

        if (!isOwner && !isCollaborator) {
            throw new AppError("Forbidden", 403);
        }

        const collaboratorsRaw = await db.collaborator.findMany({
            where: { boardId },
            include: { user: true },
            orderBy: { joinedAt: "asc" },
        });

        const data = collaboratorsRaw.map((c) =>
            CollaboratorSchema.parse({
                userId: c.user.id,
                fullName: c.user.fullName,
                email: c.user.email,
                avatarUrl: c.user.avatarUrl,
                role: c.role,
                joinedAt: c.joinedAt.toISOString(),
            }),
        );

        res.status(200).json(GetCollaboratorsResponseSchema.parse(data));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/collaborators/invite
 * Invite a collaborator by email.
 */
export const inviteCollaborator = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const { email, role } = parseBody(InviteCollaboratorPayloadSchema, req.body);

        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Only the owner can invite collaborators
        if (board.ownerId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        const normalized = normalizeEmail(email);
        const userToInvite = await db.user.findUnique({
            where: { email: normalized },
        });

        if (!userToInvite) {
            throw new AppError("User with this email not found", 404);
        }

        if (userToInvite.id === board.ownerId) {
            throw new AppError("Cannot invite the owner of the board", 400);
        }

        const existingCollaborator = await db.collaborator.findUnique({
            where: {
                userId_boardId: {
                    userId: userToInvite.id,
                    boardId,
                },
            },
        });

        if (existingCollaborator) {
            throw new AppError("User is already a collaborator", 400);
        }

        const collaborator = await db.collaborator.create({
            data: {
                userId: userToInvite.id,
                boardId,
                role,
            },
            include: { user: true },
        });

        // Create a notification for the invited user
        const inviter = await db.user.findUnique({ where: { id: userId } });
        const inviterName = inviter ? inviter.fullName : "Someone";

        await createNotification({
            userId: userToInvite.id,
            type: "invite",
            message: `${inviterName} invited you to collaborate on "${board.title}".`,
            boardId,
        });

        res.status(201).json(
            CollaboratorSchema.parse({
                userId: collaborator.user.id,
                fullName: collaborator.user.fullName,
                email: collaborator.user.email,
                avatarUrl: collaborator.user.avatarUrl,
                role: collaborator.role,
                joinedAt: collaborator.joinedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/boards/:boardId/collaborators/link
 * Generate a shareable invite link/code.
 */
export const generateInviteLink = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const { role, expiresInHours } = parseBody(
            GenerateInviteLinkPayloadSchema,
            req.body,
        );

        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Only the owner can generate invite links
        if (board.ownerId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        const inviteCode = randomBytes(16).toString("hex");
        const hours = expiresInHours || 72;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        await db.inviteLink.create({
            data: {
                boardId,
                createdById: userId,
                role,
                inviteCode,
                expiresAt,
            },
        });

        const clientUrl = process.env.CLIENT_URL || "http://localhost:4000";
        const inviteUrl = `${clientUrl}/invites/redeem?code=${inviteCode}`;

        res.status(200).json(
            GenerateInviteLinkResponseSchema.parse({
                inviteCode,
                inviteUrl,
                expiresAt: expiresAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/boards/:boardId/collaborators/:userId
 * Change a collaborator's role.
 */
export const updateCollaboratorRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const collaboratorUserId = getParam(req, "userId");
        const { role } = parseBody(UpdateCollaboratorRolePayloadSchema, req.body);

        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Only the owner can change roles
        if (board.ownerId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        const existingCollaborator = await db.collaborator.findUnique({
            where: {
                userId_boardId: {
                    userId: collaboratorUserId,
                    boardId,
                },
            },
            include: { user: true },
        });

        if (!existingCollaborator) {
            throw new AppError("Collaborator not found", 404);
        }

        const updatedCollaborator = await db.collaborator.update({
            where: {
                userId_boardId: {
                    userId: collaboratorUserId,
                    boardId,
                },
            },
            data: { role },
            include: { user: true },
        });

        res.status(200).json(
            UpdateCollaboratorResponseSchema.parse({
                userId: updatedCollaborator.user.id,
                fullName: updatedCollaborator.user.fullName,
                email: updatedCollaborator.user.email,
                avatarUrl: updatedCollaborator.user.avatarUrl,
                role: updatedCollaborator.role,
                joinedAt: updatedCollaborator.joinedAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/boards/:boardId/collaborators/:userId
 * Revoke a collaborator's access.
 */
export const removeCollaborator = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const requestingUserId = getAuthenticatedUserId(req);
        const boardId = getParam(req, "boardId");
        const collaboratorUserId = getParam(req, "userId");

        const board = await db.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new AppError("Board not found", 404);
        }

        // Only the owner or the collaborator themselves can remove the collaborator
        if (board.ownerId !== requestingUserId && collaboratorUserId !== requestingUserId) {
            throw new AppError("Forbidden", 403);
        }

        const existingCollaborator = await db.collaborator.findUnique({
            where: {
                userId_boardId: {
                    userId: collaboratorUserId,
                    boardId,
                },
            },
        });

        if (!existingCollaborator) {
            throw new AppError("Collaborator not found", 404);
        }

        await db.collaborator.delete({
            where: {
                userId_boardId: {
                    userId: collaboratorUserId,
                    boardId,
                },
            },
        });

        res.status(200).json(
            RemoveCollaboratorResponseSchema.parse({
                message: "Collaborator removed successfully",
            }),
        );
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/invites/redeem
 * Join a shared board using a code.
 */
export const redeemInvite = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { inviteCode } = parseBody(RedeemInvitePayloadSchema, req.body);

        const inviteLink = await db.inviteLink.findUnique({
            where: { inviteCode },
            include: {
                board: {
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
                },
            },
        });

        if (!inviteLink) {
            throw new AppError("Invite code not found", 404);
        }

        if (inviteLink.expiresAt < new Date()) {
            throw new AppError("Invite link has expired", 400);
        }

        const board = inviteLink.board as any;

        if (board.ownerId === userId) {
            throw new AppError("You are already the owner of this board", 400);
        }

        let collaborator = await db.collaborator.findUnique({
            where: {
                userId_boardId: {
                    userId,
                    boardId: inviteLink.boardId,
                },
            },
        });

        if (!collaborator) {
            collaborator = await db.collaborator.create({
                data: {
                    userId,
                    boardId: inviteLink.boardId,
                    role: inviteLink.role,
                },
            });

            // Mark invite link as redeemed
            await db.inviteLink.update({
                where: { id: inviteLink.id },
                data: {
                    redeemedAt: new Date(),
                    redeemedById: userId,
                },
            });

            // Create notification for board owner
            const joiner = await db.user.findUnique({ where: { id: userId } });
            const joinerName = joiner ? joiner.fullName : "Someone";
            await createNotification({
                userId: board.ownerId,
                type: "invite",
                message: `${joinerName} joined your board "${board.title}" using an invite link.`,
                boardId: board.id,
            });
        }

        const isOwner = board.ownerId === userId;
        const sharedBy = board.sharedBy || board.owner;

        res.status(200).json(
            RedeemInviteResponseSchema.parse({
                board: BoardSchema.parse({
                    id: board.id,
                    title: board.title,
                    thumbnailUrl: board.thumbnailUrl,
                    type: isOwner ? "personal" : "shared",
                    status: board.status,
                    badge: mapBoardBadge(board.badge),
                    visibilityIcon: board.visibilityIcon,
                    ownerId: board.ownerId,
                    templateId: board.templateId,
                    sharedBy: sharedBy
                        ? {
                              userId: sharedBy.id,
                              fullName: sharedBy.fullName,
                              avatarUrl: sharedBy.avatarUrl,
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
                role: collaborator.role,
            }),
        );
    } catch (error) {
        next(error);
    }
};
