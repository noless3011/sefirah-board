import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "@sefirah/shared";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import db from "../utils/db.js";

export function notFoundHandler(req: Request, res: Response) {
    const errorObj: ApiError = {
        success: false,
        statusCode: 404,
        error: "Not Found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
    };
    res.status(404).json(errorObj);
}

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    logger.error(err.message || "Internal Server Error", err);

    let statusCode = 500;
    let message = "Internal Server Error";
    let errorName = "ServerError";
    let details: Record<string, string[]> | undefined = undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorName = err.name === "Error" ? "AppError" : err.name;
        message = err.message;
        details = err.details;
    } else if (err.code === "P2003" && (err.message?.includes("ownerId") || JSON.stringify(err.meta)?.includes("ownerId"))) {
        // Handle database foreign key violation on ownerId due to deleted user / ghost token
        statusCode = 401;
        errorName = "Unauthorized";
        message = "Your user session is invalid. Please log in again.";
    } else if (err.status) {
        statusCode = err.status;
        message = err.message;
        errorName = err.name;
    }

    const errorResponse: ApiError = {
        success: false,
        statusCode,
        error: errorName,
        message,
    };

    if (details) {
        errorResponse.details = details;
    }

    res.status(statusCode).json(errorResponse);
}
