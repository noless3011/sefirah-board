import axiosClient from "./axiosClient";
import type {
    Board,
    CanvasElement,
    Thread,
    Collaborator,
    ExportBoardResponse,
    GetCanvasElementsResponse,
} from "@sefirah/shared";

const BOARDS_URL = "/boards";

export const boardApi = {
    getBoard: (boardId: string) => {
        return axiosClient.get<Board>(`${BOARDS_URL}/${boardId}`);
    },

    getCanvasElements: (boardId: string) => {
        return axiosClient.get<GetCanvasElementsResponse>(
            `${BOARDS_URL}/${boardId}/canvas/elements`,
        );
    },

    saveCanvasSnapshot: (boardId: string, elements: CanvasElement[]) => {
        return axiosClient.put<{ message?: string }>(
            `${BOARDS_URL}/${boardId}/canvas/snapshot`,
            { elements },
        );
    },

    getThreads: (boardId: string) => {
        return axiosClient.get<Thread[]>(`${BOARDS_URL}/${boardId}/threads`);
    },

    createThread: (
        boardId: string,
        data: { targetElementId: string | null; message: string },
    ) => {
        return axiosClient.post<Thread>(
            `${BOARDS_URL}/${boardId}/threads`,
            data,
        );
    },

    replyToThread: (boardId: string, threadId: string, message: string) => {
        return axiosClient.post<Thread>(
            `${BOARDS_URL}/${boardId}/threads/${threadId}/reply`,
            { message },
        );
    },

    resolveThread: (boardId: string, threadId: string) => {
        return axiosClient.patch<Thread>(
            `${BOARDS_URL}/${boardId}/threads/${threadId}`,
            { status: "resolved" },
        );
    },

    getCollaborators: (boardId: string) => {
        return axiosClient.get<Collaborator[]>(
            `${BOARDS_URL}/${boardId}/collaborators`,
        );
    },

    exportBoard: (boardId: string, format: "png" | "pdf" | "svg") => {
        return axiosClient.post<ExportBoardResponse>(
            `${BOARDS_URL}/${boardId}/export`,
            { format },
        );
    },
};
