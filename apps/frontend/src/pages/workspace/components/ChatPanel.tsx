import React, { useState, useRef, useEffect } from "react";
import type { Thread } from "@sefirah/shared";
import "./ChatPanel.css";

interface ChatPanelProps {
    threads: Thread[];
    boardId: string;
    onSendMessage: (message: string, targetElementId?: string) => void;
    onReply: (threadId: string, message: string) => void;
}

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
};

const getAvatarColor = (name: string) => {
    const colors = ["#4285f4", "#ea4335", "#f5a623", "#34a853", "#9b59b6", "#1abc9c"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
};

const ChatPanel: React.FC<ChatPanelProps> = ({
    threads,
    onSendMessage,
    onReply,
}) => {
    const [newMessage, setNewMessage] = useState("");
    const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [threads]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage("");
    };

    const handleReply = (threadId: string) => {
        const reply = replyMessages[threadId];
        if (!reply?.trim()) return;
        onReply(threadId, reply);
        setReplyMessages({ ...replyMessages, [threadId]: "" });
    };

    const handleKeyDown = (e: React.KeyboardEvent, threadId?: string) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (threadId) {
                handleReply(threadId);
            } else {
                handleSend();
            }
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-panel__messages">
                {threads.length === 0 ? (
                    <div className="chat-panel__empty">
                        <p>No messages yet. Start a conversation!</p>
                    </div>
                ) : (
                    threads.map((thread) => (
                        <div key={thread.id} className="chat-panel__thread">
                            <div className="chat-message">
                                <div
                                    className="chat-message__avatar"
                                    style={{
                                        backgroundColor: getAvatarColor(thread.authorName),
                                    }}
                                >
                                    {getInitials(thread.authorName)}
                                </div>
                                <div className="chat-message__content">
                                    <div className="chat-message__header">
                                        <span className="chat-message__author">{thread.authorName}</span>
                                        <span className="chat-message__time">{formatTime(thread.createdAt)}</span>
                                    </div>
                                    <div className="chat-message__text">{thread.message}</div>
                                </div>
                            </div>
                            
                            {(thread.replies || []).map((reply) => (
                                <div key={reply.id} className="chat-message chat-message--reply">
                                    <div
                                        className="chat-message__avatar chat-message__avatar--small"
                                        style={{
                                            backgroundColor: getAvatarColor(reply.authorName),
                                        }}
                                    >
                                        {getInitials(reply.authorName)}
                                    </div>
                                    <div className="chat-message__content">
                                        <div className="chat-message__header">
                                            <span className="chat-message__author">{reply.authorName}</span>
                                            <span className="chat-message__time">{formatTime(reply.createdAt)}</span>
                                        </div>
                                        <div className="chat-message__text">{reply.message}</div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="chat-panel__reply-input">
                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    value={replyMessages[thread.id] || ""}
                                    onChange={(e) => setReplyMessages({ ...replyMessages, [thread.id]: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, thread.id)}
                                />
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-panel__input-area">
                <input
                    type="text"
                    className="chat-panel__input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="chat-panel__send-btn"
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
