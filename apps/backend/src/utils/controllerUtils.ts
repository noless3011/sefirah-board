import type { Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { ZodType } from "zod";
import { AppError } from "./AppError.js";

export const parseBody = <T>(schema: ZodType<T>, payload: unknown): T => {
    const result = schema.safeParse(payload);
    if (result.success) {
        return result.data;
    }

    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
        const field = issue.path.length > 0 ? issue.path.join(".") : "body";
        if (!details[field]) {
            details[field] = [];
        }
        details[field].push(issue.message);
    }

    throw new AppError("Validation failed", 400, details);
};

export const parseQuery = <T>(schema: ZodType<T>, payload: unknown): T => {
    const result = schema.safeParse(payload);
    if (result.success) {
        return result.data;
    }

    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
        const field = issue.path.length > 0 ? issue.path.join(".") : "query";
        if (!details[field]) {
            details[field] = [];
        }
        details[field].push(issue.message);
    }

    throw new AppError("Validation failed", 400, details);
};

export const parseBearerToken = (
    authorizationHeader: string | undefined,
): string => {
    if (!authorizationHeader) {
        throw new AppError("Unauthorized", 401);
    }

    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new AppError("Unauthorized", 401);
    }

    return token;
};

export const extractUserIdFromJwt = (
    decoded: string | JwtPayload,
): string | null => {
    if (typeof decoded === "string") {
        return null;
    }

    const userId = decoded.userId;
    return typeof userId === "string" && userId.length > 0 ? userId : null;
};

export const getAuthenticatedUserId = (req: Request): string => {
    const authorizationHeader = req.headers.authorization;
    const token = parseBearerToken(authorizationHeader);

    let decoded: string | JwtPayload;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch {
        throw new AppError("Unauthorized", 401);
    }

    const userId = extractUserIdFromJwt(decoded);
    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    return userId;
};

export const getParam = (req: Request, name: string): string => {
    const val = req.params[name];
    if (typeof val !== "string" || !val) {
        throw new AppError(`Missing or invalid parameter: ${name}`, 400);
    }
    return val;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
