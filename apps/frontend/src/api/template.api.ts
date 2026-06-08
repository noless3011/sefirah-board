import axiosClient from "./axiosClient";
import type { GetTemplatesResponse, GetTemplateResponse } from "@sefirah/shared";

export const templateApi = {
    listTemplates: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
        axiosClient
            .get<GetTemplatesResponse>("/templates", { params })
            .then((r) => r.data),

    getTemplate: (templateId: string) =>
        axiosClient
            .get<GetTemplateResponse>(`/templates/${templateId}`)
            .then((r) => r.data),
};
