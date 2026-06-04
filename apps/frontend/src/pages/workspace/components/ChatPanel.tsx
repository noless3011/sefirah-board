import React, { useState } from "react";
import type { Thread } from "@sefirah/shared";

interface ChatPanelProps {
    threads: Thread[];
    onCreateThread: (targetElementId: string | null, message: string) => void;
    onReplyToThread: (threadId: string, message: string) => void;
    onResolveThread: (threadId: string) => void;
    selectedElementId: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    threads,
    onCreateThread,
    onReplyToThread,
    onResolveThread,
    selectedElementId,
}) => {
    const [newThreadText, setNewThreadText] = useState("");
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);

    // Get initials helper
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    // Filter to open threads only
    const openThreads = threads.filter((t) => t.status === "open");

    const handleCreateThread = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newThreadText.trim()) return;

        onCreateThread(selectedElementId, newThreadText);
        setNewThreadText("");
    };

    const handleSendReply = (threadId: string) => {
        const text = replyTexts[threadId];
        if (!text || !text.trim()) return;

        onReplyToThread(threadId, text);
        setReplyTexts((prev) => ({ ...prev, [threadId]: "" }));
    };

    return (
        <div className="h-full flex flex-col select-none">
            {/* Thread Cards Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Active Threads ({openThreads.length})
                </span>

                {openThreads.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <p className="text-xs text-slate-400 font-medium">No active threads</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {selectedElementId
                                ? "Write a message below to pin comments to the selected element"
                                : "Select an element to start a comment thread"}
                        </p>
                    </div>
                ) : (
                    openThreads.map((thread) => {
                        const showReplies = activeReplyThreadId === thread.id;
                        return (
                            <div
                                key={thread.id}
                                className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex flex-col gap-2.5 transition-shadow hover:shadow-sm"
                            >
                                {/* Thread Header: User info + Resolve button */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Avatar */}
                                        <div className="w-6.5 h-6.5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 overflow-hidden shadow-sm">
                                            {thread.authorAvatarUrl ? (
                                                <img
                                                    src={thread.authorAvatarUrl}
                                                    alt={thread.authorName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                getInitials(thread.authorName || "User")
                                            )}
                                        </div>
                                        {/* Name */}
                                        <span className="text-xs font-bold text-slate-800">
                                            {thread.authorName || "Anonymous"}
                                        </span>
                                    </div>

                                    {/* Resolve Button */}
                                    <button
                                        onClick={() => onResolveThread(thread.id)}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors cursor-pointer"
                                        title="Resolve Thread"
                                    >
                                        Resolve
                                    </button>
                                </div>

                                {/* Thread message content */}
                                <p className="text-xs text-slate-700 leading-normal pl-8">
                                    {thread.message}
                                </p>

                                {/* Replies Count Toggle */}
                                <div className="pl-8 flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setActiveReplyThreadId(showReplies ? null : thread.id)
                                        }
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                                    >
                                        {thread.replies && thread.replies.length > 0 ? (
                                            <>
                                                {showReplies ? "Hide" : "Show"} Replies (
                                                {thread.replies.length})
                                            </>
                                        ) : (
                                            <>Reply</>
                                        )}
                                    </button>
                                </div>

                                {/* Replies list */}
                                {showReplies && (
                                    <div className="pl-8 border-l border-slate-200 ml-3.5 flex flex-col gap-2 mt-1">
                                        {thread.replies &&
                                            thread.replies.map((reply) => (
                                                <div key={reply.id} className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-slate-700">
                                                            {reply.authorName}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400">
                                                            {new Date(
                                                                reply.createdAt,
                                                            ).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 leading-normal">
                                                        {reply.message}
                                                    </p>
                                                </div>
                                            ))}

                                        {/* Reply input field inside thread card */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <input
                                                type="text"
                                                className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                                                placeholder="Write reply..."
                                                value={replyTexts[thread.id] || ""}
                                                onChange={(e) =>
                                                    setReplyTexts((prev) => ({
                                                        ...prev,
                                                        [thread.id]: e.target.value,
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleSendReply(thread.id);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => handleSendReply(thread.id)}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer px-1.5 py-1"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Create Thread Input */}
            <form onSubmit={handleCreateThread} className="border-t border-slate-150 p-4 bg-slate-50">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">
                            {selectedElementId
                                ? "Pin thread to selected element"
                                : "General board comment"}
                        </span>
                        {selectedElementId && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                Pinned
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500 leading-relaxed font-medium"
                            placeholder="Type a new comment..."
                            value={newThreadText}
                            onChange={(e) => setNewThreadText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition-colors flex items-center justify-center"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default ChatPanel;
