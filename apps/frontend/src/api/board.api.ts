import axiosClient from "./axiosClient";
import type {
    GetCanvasElementsResponse,
    Board,
    Thread,
    ThreadReply,
    BoardRevision,
    CanvasElement,
} from "@sefirah/shared";

export const boardApi = {
    /** GET /boards/:boardId — Fetch board metadata */
    getBoard: (boardId: string) =>
        axiosClient.get<Board>(`/boards/${boardId}`).then((r) => r.data),

    /** POST /boards — Create a new board */
    createBoard: (data: { title: string; templateId?: string }) =>
        axiosClient.post<Board>(`/boards`, data).then((r) => r.data),

    /** PATCH /boards/:boardId — Update board (title, etc.) */
    updateBoard: (boardId: string, data: Partial<Pick<Board, "title">>) =>
        axiosClient.patch<Board>(`/boards/${boardId}`, data).then((r) => r.data),

    /** POST /boards/:boardId/export — Export board canvas */
    exportBoard: (boardId: string, format: "png" | "pdf" | "svg") =>
        axiosClient
            .post<{ downloadUrl: string; expiresAt: string }>(
                `/boards/${boardId}/export`,
                { format }
            )
            .then((r) => r.data),
};

export const canvasApi = {
    /** GET /boards/:boardId/canvas/elements — Load all elements */
    getElements: (boardId: string) =>
        axiosClient
            .get<GetCanvasElementsResponse>(
                `/boards/${boardId}/canvas/elements`
            )
            .then((r) => r.data),

    /** PUT /boards/:boardId/canvas/snapshot — Auto-save all elements */
    saveSnapshot: (boardId: string, elements: CanvasElement[]) =>
        axiosClient
            .put(`/boards/${boardId}/canvas/snapshot`, { elements })
            .then((r) => r.data),
};

export const threadApi = {
    /** GET /boards/:boardId/threads — Fetch all threads */
    getThreads: (boardId: string) =>
        axiosClient
            .get<Thread[]>(`/boards/${boardId}/threads`)
            .then((r) => r.data),

    /** POST /boards/:boardId/threads — Create a new thread */
    createThread: (
        boardId: string,
        data: { targetElementId?: string; message: string }
    ) =>
        axiosClient
            .post<Thread>(`/boards/${boardId}/threads`, data)
            .then((r) => r.data),

    /** POST /boards/:boardId/threads/:threadId/reply — Reply to thread */
    replyToThread: (
        boardId: string,
        threadId: string,
        data: { message: string }
    ) =>
        axiosClient
            .post<ThreadReply>(`/boards/${boardId}/threads/${threadId}/reply`, data)
            .then((r) => r.data),

    /** PATCH /boards/:boardId/threads/:threadId — Resolve thread */
    resolveThread: (boardId: string, threadId: string) =>
        axiosClient
            .patch<Thread>(`/boards/${boardId}/threads/${threadId}`, {
                status: "resolved",
            })
            .then((r) => r.data),
};

export const historyApi = {
    /** GET /boards/:boardId/history — List revisions */
    getRevisions: (boardId: string, limit = 50) =>
        axiosClient
            .get<BoardRevision[]>(`/boards/${boardId}/history`, {
                params: { limit },
            })
            .then((r) => r.data),

    /** POST /boards/:boardId/history/restore — Restore to revision */
    restoreRevision: (boardId: string, revisionId: string) =>
        axiosClient
            .post(`/boards/${boardId}/history/restore`, { revisionId })
            .then((r) => r.data),
};

export const collaborationApi = {
    /** GET /boards/:boardId/collaborators — List all collaborators */
    getCollaborators: (boardId: string) =>
        axiosClient
            .get(`/boards/${boardId}/collaborators`)
            .then((r) => r.data),

    /** POST /boards/:boardId/collaborators/invite — Invite by email */
    inviteCollaborator: (
        boardId: string,
        data: { email: string; role: "viewer" | "editor" }
    ) =>
        axiosClient
            .post(`/boards/${boardId}/collaborators/invite`, data)
            .then((r) => r.data),

    /** POST /boards/:boardId/collaborators/link — Generate invite link */
    generateInviteLink: (
        boardId: string,
        data: { role: "viewer" | "editor"; expiresInHours?: number }
    ) =>
        axiosClient
            .post<{ inviteCode: string; inviteUrl: string; expiresAt: string }>(
                `/boards/${boardId}/collaborators/link`,
                data
            )
            .then((r) => r.data),

    /** PATCH /boards/:boardId/collaborators/:userId — Update role */
    updateCollaboratorRole: (
        boardId: string,
        userId: string,
        role: "viewer" | "editor"
    ) =>
        axiosClient
            .patch(`/boards/${boardId}/collaborators/${userId}`, { role })
            .then((r) => r.data),

    /** DELETE /boards/:boardId/collaborators/:userId — Revoke access */
    removeCollaborator: (boardId: string, userId: string) =>
        axiosClient
            .delete(`/boards/${boardId}/collaborators/${userId}`)
            .then((r) => r.data),
};
