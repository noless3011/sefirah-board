import type { Request, Response, NextFunction } from "express";
import {
    TemplateSchema,
    GetTemplatesQuerySchema,
    GetTemplatesResponseSchema,
    GetTemplateResponseSchema,
} from "@sefirah/shared";
import db from "../utils/db.js";
import { AppError } from "../utils/AppError.js";
import {
    parseQuery,
    getAuthenticatedUserId,
    getParam,
} from "../utils/controllerUtils.js";

/**
 * GET /api/v1/templates
 * List available templates with optional filtering and pagination.
 */
export const listTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Authenticate user
        getAuthenticatedUserId(req);

        const {
            category,
            search,
            page = 1,
            limit = 20,
        } = parseQuery(GetTemplatesQuerySchema, req.query);

        const skip = (page - 1) * limit;

        const where: any = {};
        if (category) {
            // Map shared model category (with spaces) to Prisma enum keys (with underscores)
            where.category = category.replace(/ /g, "_");
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const [total, templatesRaw] = await Promise.all([
            db.template.count({ where }),
            db.template.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        const data = templatesRaw.map((template) =>
            TemplateSchema.parse({
                id: template.id,
                title: template.title,
                description: template.description,
                thumbnailUrl: template.thumbnailUrl,
                // Map Prisma enum key (with underscores) back to shared model category (with spaces)
                category: template.category.replace(/_/g, " "),
                createdAt: template.createdAt.toISOString(),
            }),
        );

        res.status(200).json(
            GetTemplatesResponseSchema.parse({
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
 * GET /api/v1/templates/:templateId
 * Fetch full metadata for a single template.
 */
export const getTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Authenticate user
        getAuthenticatedUserId(req);

        const templateId = getParam(req, "templateId");

        const template = await db.template.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError("Template not found", 404);
        }

        res.status(200).json(
            GetTemplateResponseSchema.parse({
                id: template.id,
                title: template.title,
                description: template.description,
                thumbnailUrl: template.thumbnailUrl,
                // Map Prisma enum key (with underscores) back to shared model category (with spaces)
                category: template.category.replace(/_/g, " "),
                createdAt: template.createdAt.toISOString(),
            }),
        );
    } catch (error) {
        next(error);
    }
};
