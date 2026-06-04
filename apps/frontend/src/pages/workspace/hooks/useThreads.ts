import { useState, useEffect, useCallback } from "react";
import type { Thread } from "@sefirah/shared";
import { boardApi } from "../../../api/board.api";

export function useThreads(boardId: string) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadThreads = useCallback(() => {
        setLoading(true);
        boardApi
            .getThreads(boardId)
            .then((res) => {
                if (res.data) {
                    setThreads(res.data || []);
                }
            })
            .catch((err) => {
                setError("Failed to load comment threads");
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [boardId]);

    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    const createThread = useCallback(async (targetElementId: string | null, message: string) => {
        try {
            const res = await boardApi.createThread(boardId, { targetElementId, message });
            if (res.data) {
                setThreads((prev) => [...prev, res.data]);
                return res.data;
            }
        } catch (err) {
            console.error("Failed to create thread", err);
            throw err;
        }
    }, [boardId]);

    const replyToThread = useCallback(async (threadId: string, message: string) => {
        try {
            const res = await boardApi.replyToThread(boardId, threadId, message);
            if (res.data) {
                setThreads((prev) =>
                    prev.map((thread) => (thread.id === threadId ? res.data : thread)),
                );
                return res.data;
            }
        } catch (err) {
            console.error("Failed to reply to thread", err);
            throw err;
        }
    }, [boardId]);

    const resolveThread = useCallback(async (threadId: string) => {
        try {
            const res = await boardApi.resolveThread(boardId, threadId);
            if (res.data) {
                setThreads((prev) =>
                    prev.map((thread) => (thread.id === threadId ? res.data : thread)),
                );
                return res.data;
            }
        } catch (err) {
            console.error("Failed to resolve thread", err);
            throw err;
        }
    }, [boardId]);

    return {
        threads,
        setThreads,
        loading,
        error,
        createThread,
        replyToThread,
        resolveThread,
        refresh: loadThreads,
    };
}
