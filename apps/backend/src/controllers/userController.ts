import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import {
    UserSchema,
    UserPreferencesSchema,
    UpdateProfilePayloadSchema,
    UpdatePasswordPayloadSchema,
    UpdatePreferencesPayloadSchema,
    DeactivateAccountPayloadSchema,
    ResetPasswordResponseSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import { parseBody, getAuthenticatedUserId } from "../utils/controllerUtils.js";

const coerceUserPreferences = (value: unknown) => {
    const parsed = UserPreferencesSchema.safeParse(value);
    if (parsed.success) {
        return parsed.data;
    }

    // Defensive fallback in case legacy data in DB is malformed.
    return UserPreferencesSchema.parse({
        emailNotifications: true,
        cursorVisibility: true,
    });
};

const toUserResponse = (user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    preferences: unknown;
    createdAt: Date;
    updatedAt: Date;
}) =>
    UserSchema.parse({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferences: coerceUserPreferences(user.preferences),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    });

export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                preferences: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        res.status(200).json(toUserResponse(user));
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const payload = parseBody(UpdateProfilePayloadSchema, req.body);

        const data: {
            fullName?: string;
            avatarUrl?: string | null;
        } = {};

        if (payload.fullName !== undefined) {
            const normalizedName = payload.fullName.trim();
            if (!normalizedName) {
                throw new AppError("Validation failed", 400, {
                    fullName: ["Full name is required"],
                });
            }
            data.fullName = normalizedName;
        }

        if (payload.avatarUrl !== undefined) {
            data.avatarUrl = payload.avatarUrl;
        }

        if (Object.keys(data).length === 0) {
            throw new AppError("Validation failed", 400, {
                body: ["At least one field must be provided"],
            });
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                preferences: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json(toUserResponse(updatedUser));
    } catch (error) {
        next(error);
    }
};

export const updateMyPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { currentPassword, newPassword } = parseBody(
            UpdatePasswordPayloadSchema,
            req.body,
        );

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.password) {
            throw new AppError(
                "Password change is unavailable for OAuth-only accounts",
                400,
            );
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        );
        if (!isCurrentPasswordValid) {
            throw new AppError("Current password is incorrect", 401);
        }

        if (currentPassword === newPassword) {
            throw new AppError(
                "New password must be different from current password",
                400,
            );
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await db.$transaction([
            db.user.update({
                where: { id: userId },
                data: {
                    password: newPasswordHash,
                },
            }),
            db.refreshToken.deleteMany({
                where: { userId },
            }),
        ]);

        res.status(200).json(
            ResetPasswordResponseSchema.parse({
                message: "Password updated successfully",
            }),
        );
    } catch (error) {
        next(error);
    }
};

export const updateMyPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const payload = parseBody(UpdatePreferencesPayloadSchema, req.body);

        if (Object.keys(payload).length === 0) {
            throw new AppError("Validation failed", 400, {
                body: ["At least one field must be provided"],
            });
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                preferences: true,
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const currentPreferences = coerceUserPreferences(user.preferences);
        const nextPreferences = UserPreferencesSchema.parse({
            ...currentPreferences,
            ...payload,
        });

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                preferences: nextPreferences,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                preferences: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json(toUserResponse(updatedUser));
    } catch (error) {
        next(error);
    }
};

export const deactivateMyAccount = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { password } = parseBody(
            DeactivateAccountPayloadSchema,
            req.body,
        );

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.password) {
            throw new AppError(
                "Password confirmation is unavailable for OAuth-only accounts",
                400,
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Password is incorrect", 401);
        }

        await db.$transaction([
            db.board.deleteMany({
                where: { ownerId: userId },
            }),
            db.user.delete({
                where: { id: userId },
            }),
        ]);

        res.status(200).json(
            ResetPasswordResponseSchema.parse({
                message: "Account deleted successfully",
            }),
        );
    } catch (error) {
        next(error);
    }
};
