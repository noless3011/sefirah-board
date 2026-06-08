import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { boardApi } from "../../api/board.api";
import type { Board } from "@sefirah/shared";

// =============================================================================
// COLOR AND STRING FORMATTING UTILITIES
// =============================================================================
const getAvatarColor = (name: string) => {
    const colors = [
        "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
        "bg-gradient-to-br from-pink-500 to-rose-600 text-white",
        "bg-gradient-to-br from-blue-500 to-teal-600 text-white",
        "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
        "bg-gradient-to-br from-yellow-500 to-orange-600 text-white",
        "bg-gradient-to-br from-red-500 to-pink-600 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
};

// =============================================================================
// MOCK DATA FALLBACK
// =============================================================================
const MOCK_BOARDS: Board[] = [
    {
        id: "mock-1",
        title: "YOLO/VAE Architecture",
        thumbnailUrl: null,
        type: "shared",
        status: "active",
        badge: "active-project",
        visibilityIcon: "shared",
        ownerId: "user-1",
        templateId: null,
        sharedBy: { userId: "user-2", fullName: "Sarah Jenkins", avatarUrl: null },
        collaborators: [
            { userId: "user-2", fullName: "Sarah Jenkins", avatarUrl: null },
            { userId: "user-3", fullName: "Alex Rivera", avatarUrl: null },
            { userId: "user-4", fullName: "Maria Chen", avatarUrl: null }
        ],
        extraCollaboratorsCount: 2,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "mock-2",
        title: "Game Loop Design",
        thumbnailUrl: null,
        type: "personal",
        status: "active",
        badge: "review-required",
        visibilityIcon: "private",
        ownerId: "me",
        templateId: null,
        sharedBy: null,
        collaborators: [
            { userId: "me", fullName: "You", avatarUrl: null },
            { userId: "user-5", fullName: "Thomas Muller", avatarUrl: null }
        ],
        extraCollaboratorsCount: 0,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "mock-3",
        title: "Tarot Club Meeting",
        thumbnailUrl: null,
        type: "shared",
        status: "active",
        badge: null,
        visibilityIcon: "public",
        ownerId: "user-6",
        templateId: null,
        sharedBy: { userId: "user-6", fullName: "Elena Rostova", avatarUrl: null },
        collaborators: [
            { userId: "user-6", fullName: "Elena Rostova", avatarUrl: null },
            { userId: "user-7", fullName: "David Kim", avatarUrl: null },
            { userId: "user-8", fullName: "Jessica Taylor", avatarUrl: null }
        ],
        extraCollaboratorsCount: 8,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "mock-4",
        title: "Neon UI Iteration",
        thumbnailUrl: null,
        type: "personal",
        status: "active",
        badge: "active-project",
        visibilityIcon: "private",
        ownerId: "me",
        templateId: null,
        sharedBy: null,
        collaborators: [
            { userId: "me", fullName: "You", avatarUrl: null }
        ],
        extraCollaboratorsCount: 0,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Stylized Workspace / Canvas Thumbnail representation */
const BoardThumbnail: React.FC<{ title: string; thumbnailUrl: string | null }> = ({ title, thumbnailUrl }) => {
    if (thumbnailUrl) {
        return (
            <div className="w-full h-40 bg-slate-100 overflow-hidden rounded-t-2xl relative border-b border-slate-100">
                <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
        );
    }

    return (
        <div className="w-full h-40 bg-[#F8FAFC] relative overflow-hidden rounded-t-2xl border-b border-slate-100 flex items-center justify-center group-hover:bg-[#F1F5F9] transition-colors duration-200">
            {/* Dot grid pattern */}
            <div className="absolute inset-0 opacity-[0.4]" style={{
                backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '16px 16px'
            }} />
            
            {/* Stylized Canvas Shapes */}
            <div className="absolute flex gap-3 rotate-3 transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6 select-none pointer-events-none">
                {/* Yellow sticky card */}
                <div className="w-14 h-14 bg-yellow-100/90 shadow-sm border border-yellow-200 rounded p-1 flex flex-col justify-between">
                    <div className="h-1 w-8 bg-yellow-300 rounded" />
                    <div className="h-1 w-6 bg-yellow-300 rounded" />
                    <div className="h-1 w-4 bg-yellow-300 rounded" />
                </div>
                {/* Purple card */}
                <div className="w-16 h-12 bg-purple-100/90 shadow-sm border border-purple-200 rounded p-1 flex flex-col justify-between -mt-2">
                    <div className="h-1 w-10 bg-purple-300 rounded" />
                    <div className="h-1.5 w-4 bg-purple-400 rounded-sm self-end" />
                </div>
                {/* Blue circle icon */}
                <div className="w-12 h-12 bg-blue-50/90 shadow-sm border border-blue-200 rounded-full p-2 flex items-center justify-center mt-3 -ml-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

// Modals
const RenameModal: React.FC<{
    board: Board;
    onClose: () => void;
    onSave: (title: string) => void;
}> = ({ board, onClose, onSave }) => {
    const [title, setTitle] = useState(board.title);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Rename Board</h3>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Board Title"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition mb-6 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && title.trim()) {
                            onSave(title.trim());
                        } else if (e.key === "Escape") {
                            onClose();
                        }
                    }}
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-sm cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => title.trim() && onSave(title.trim())}
                        disabled={!title.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm disabled:opacity-50 cursor-pointer"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const VisibilityModal: React.FC<{
    board: Board;
    onClose: () => void;
    onSave: (visibility: "private" | "shared" | "public") => void;
}> = ({ board, onClose, onSave }) => {
    const [vis, setVis] = useState(board.visibilityIcon);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Change Board Visibility</h3>
                <div className="flex flex-col gap-3 mb-6">
                    {([
                        { id: "private", name: "Private", desc: "Only you can view and edit", icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        )},
                        { id: "shared", name: "Shared", desc: "Collaborators with access can view/edit", icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )},
                        { id: "public", name: "Public", desc: "Anyone with the link can view", icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        )}
                    ] as const).map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVis(opt.id)}
                            className={`flex items-start gap-4 p-3 rounded-xl border text-left transition cursor-pointer ${
                                vis === opt.id 
                                    ? "border-blue-500 bg-blue-50/45 text-blue-900" 
                                    : "border-slate-100 hover:border-slate-200 text-slate-700"
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${vis === opt.id ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400"}`}>
                                {opt.icon}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{opt.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-sm cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(vis)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm cursor-pointer"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const BadgeModal: React.FC<{
    board: Board;
    onClose: () => void;
    onSave: (badge: "active-project" | "review-required" | "archived" | null) => void;
}> = ({ board, onClose, onSave }) => {
    const [selectedBadge, setSelectedBadge] = useState<"active-project" | "review-required" | "archived" | null>(board.badge);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Change Board Badge</h3>
                <div className="flex flex-col gap-2.5 mb-6">
                    {([
                        { id: "active-project", name: "Active Project", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200/50" },
                        { id: "review-required", name: "Review Required", colorClass: "bg-amber-50 text-amber-700 border-amber-200/50" },
                        { id: "archived", name: "Archived", colorClass: "bg-slate-100 text-slate-600 border-slate-200/50" },
                        { id: null, name: "None (Clear Badge)", colorClass: "bg-white text-slate-400 border-slate-200" }
                    ] as const).map((opt) => (
                        <button
                            key={String(opt.id)}
                            type="button"
                            onClick={() => setSelectedBadge(opt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                                selectedBadge === opt.id 
                                    ? "border-blue-500 bg-blue-50/45 text-blue-900 font-semibold" 
                                    : "border-slate-100 hover:border-slate-200 text-slate-700"
                            }`}
                        >
                            <span className="text-sm">{opt.name}</span>
                            {opt.id && (
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${opt.colorClass}`}>
                                    {opt.id === "active-project" ? "Active Project" : opt.id === "review-required" ? "Review Required" : "Archived"}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-sm cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedBadge)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm cursor-pointer"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// BOARD CARD COMPONENT (WITH 3D PARALLAX TILT & SHADOW EFFECTS)
// =============================================================================
interface BoardCardProps {
    board: Board;
    navigate: (url: string) => void;
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
    onRename: (board: Board) => void;
    onVisibility: (board: Board) => void;
    onBadge: (board: Board) => void;
    onDelete: (id: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({
    board,
    navigate,
    activeMenuId,
    setActiveMenuId,
    onRename,
    onVisibility,
    onBadge,
    onDelete
}) => {
    const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
        transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Tilt coefficient (max 4deg for subtle, sleek movement)
        const rotateX = ((centerY - y) / centerY) * 4;
        const rotateY = ((x - centerX) / centerX) * 4;
        
        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`,
            transformStyle: 'preserve-3d',
            boxShadow: '0 40px 50px -10px rgba(0, 0, 0, 0.20), 0 20px 20px -10px rgba(0, 0, 0, 0.08)', // deeper shadow on hover
            transition: 'transform 0.08s ease-out, box-shadow 0.2s ease',
            zIndex: 10
        });
    };

    const handleMouseLeave = () => {
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.08)', // restore permanent shadow
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
        });
    };

    return (
        <div 
            onClick={() => navigate(`/board/${board.id}`)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...tiltStyle,
                zIndex: activeMenuId === board.id ? 50 : tiltStyle.zIndex
            }}
            className="bg-white border border-slate-100 rounded-2xl flex flex-col cursor-pointer group relative transform-gpu"
        >
            {/* Card Header Badge Overlay */}
            {board.badge && (
                <div 
                    className="absolute top-3 left-3 z-10 pointer-events-none transform-gpu transition-transform duration-200 group-hover:translate-z-[25px]"
                    style={{ transform: 'translateZ(25px)' }}
                >
                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full border shadow-sm ${
                        board.badge === "active-project" 
                            ? "bg-emerald-50/95 text-emerald-700 border-emerald-200/50" 
                            : board.badge === "review-required"
                            ? "bg-amber-50/95 text-amber-700 border-amber-200/50"
                            : "bg-slate-100/95 text-slate-600 border-slate-200/50"
                    }`}>
                        {board.badge === "active-project" ? "ACTIVE PROJECT" : board.badge === "review-required" ? "REVIEW REQUIRED" : "ARCHIVED"}
                    </span>
                </div>
            )}

            {/* Thumbnail */}
            <div 
                className="transform-gpu transition-transform duration-200 group-hover:translate-z-[10px]"
                style={{ transform: 'translateZ(10px)' }}
            >
                <BoardThumbnail title={board.title} thumbnailUrl={board.thumbnailUrl} />
            </div>

            {/* Bottom Info Details Section */}
            <div 
                className="p-4 flex flex-col justify-between flex-1 transform-gpu transition-transform duration-200 group-hover:translate-z-[20px]"
                style={{ transform: 'translateZ(20px)' }}
            >
                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate text-base md:text-lg" title={board.title}>
                            {board.title}
                        </h3>
                        
                        {/* Dropdown Options Button */}
                        <div className="relative flex-shrink-0">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === board.id ? null : board.id);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>

                            {/* Dropped popup list */}
                            {activeMenuId === board.id && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                    <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-150 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onRename(board); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                            Rename
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onVisibility(board); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                            Visibility...
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onBadge(board); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                            Change Badge...
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onDelete(board.id); }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/70 transition cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Last updated {timeAgo(board.updatedAt)}</p>
                </div>

                {/* Bottom Row Collaborators & Visibility */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-50">
                    {/* Collaborators Overlapping Bubbles */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                        {board.collaborators.slice(0, 3).map((col) => (
                            <div 
                                key={col.userId} 
                                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white select-none ${getAvatarColor(col.fullName)}`}
                                title={col.fullName}
                            >
                                {col.avatarUrl ? (
                                    <img src={col.avatarUrl} alt={col.fullName} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    getInitials(col.fullName)
                                )}
                            </div>
                        ))}
                        {board.extraCollaboratorsCount > 0 && (
                            <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold ring-2 ring-white select-none" title={`${board.extraCollaboratorsCount} more collaborators`}>
                                +{board.extraCollaboratorsCount}
                            </div>
                        )}
                    </div>

                    {/* Visibility Icon Status */}
                    <div className="flex items-center justify-center" title={`Visibility: ${board.visibilityIcon}`}>
                        {board.visibilityIcon === "private" && (
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        )}
                        {board.visibilityIcon === "shared" && (
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                        {board.visibilityIcon === "public" && (
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    const [boards, setBoards] = useState<Board[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usingMockData, setUsingMockData] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Modal Control State
    const [modal, setModal] = useState<{
        type: "rename" | "visibility" | "badge" | null;
        board: Board | null;
    }>({ type: null, board: null });

    const loadBoards = async () => {
        setIsLoading(true);
        try {
            const res = await boardApi.getBoards({ search: searchQuery });
            if (res.data && res.data.length > 0) {
                setBoards(res.data);
                setUsingMockData(false);
            } else {
                // Backend call succeeded but returned 0 results. Use mocks filtered by search.
                const filteredMocks = MOCK_BOARDS.filter(b => 
                    !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setBoards(filteredMocks);
                setUsingMockData(true);
            }
        } catch (error) {
            console.warn("API error: falling back to mock data.", error);
            const filteredMocks = MOCK_BOARDS.filter(b => 
                !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setBoards(filteredMocks);
            setUsingMockData(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBoards();
    }, [searchQuery]);

    const handleCreateBoard = async () => {
        setIsCreating(true);
        try {
            if (usingMockData) {
                // Mock-only creation for interactive demonstration
                const newId = `mock-created-${Date.now()}`;
                const newBoard: Board = {
                    id: newId,
                    title: "Untitled Board",
                    thumbnailUrl: null,
                    type: "personal",
                    status: "active",
                    badge: null,
                    visibilityIcon: "private",
                    ownerId: "me",
                    templateId: null,
                    sharedBy: null,
                    collaborators: [{ userId: "me", fullName: "You", avatarUrl: null }],
                    extraCollaboratorsCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setBoards(prev => [newBoard, ...prev]);
                navigate(`/board/${newId}`);
            } else {
                const board = await boardApi.createBoard({ title: "Untitled Board" });
                navigate(`/board/${board.id}`);
            }
        } catch (error) {
            console.error("Failed to create board", error);
            alert("Failed to create board. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this board?")) return;
        try {
            if (usingMockData || id.startsWith("mock-")) {
                setBoards(prev => prev.filter(b => b.id !== id));
            } else {
                await boardApi.deleteBoard(id);
                loadBoards();
            }
        } catch (err) {
            console.error("Failed to delete board:", err);
            alert("Failed to delete board.");
        }
    };

    const handleRenameSave = async (newTitle: string) => {
        if (!modal.board) return;
        try {
            if (usingMockData || modal.board.id.startsWith("mock-")) {
                setBoards(prev => prev.map(b => b.id === modal.board!.id ? { ...b, title: newTitle, updatedAt: new Date().toISOString() } : b));
            } else {
                await boardApi.updateBoard(modal.board.id, { title: newTitle });
                loadBoards();
            }
        } catch (err) {
            console.error("Failed to rename board:", err);
        } finally {
            setModal({ type: null, board: null });
        }
    };

    const handleVisibilitySave = async (newVis: "private" | "shared" | "public") => {
        if (!modal.board) return;
        try {
            if (usingMockData || modal.board.id.startsWith("mock-")) {
                setBoards(prev => prev.map(b => b.id === modal.board!.id ? { ...b, visibilityIcon: newVis, updatedAt: new Date().toISOString() } : b));
            } else {
                await boardApi.updateBoard(modal.board.id, { visibilityIcon: newVis });
                loadBoards();
            }
        } catch (err) {
            console.error("Failed to change visibility:", err);
        } finally {
            setModal({ type: null, board: null });
        }
    };

    const handleBadgeSave = async (newBadge: "active-project" | "review-required" | "archived" | null) => {
        if (!modal.board) return;
        try {
            if (usingMockData || modal.board.id.startsWith("mock-")) {
                setBoards(prev => prev.map(b => b.id === modal.board!.id ? { ...b, badge: newBadge, updatedAt: new Date().toISOString() } : b));
            } else {
                await boardApi.updateBoard(modal.board.id, { badge: newBadge });
                loadBoards();
            }
        } catch (err) {
            console.error("Failed to update badge:", err);
        } finally {
            setModal({ type: null, board: null });
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50/45 p-6 md:p-8 lg:p-10">
            {/* ─── HERO SECTION ─── */}
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />
                
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                        Creative Canvas
                    </h1>
                    <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                        Your digital atelier for collaborative thought. Turn abstract ideas into visual systems with the suite of precision tools.
                    </p>
                </div>
                
                <div className="relative z-10 flex-shrink-0">
                    <button
                        onClick={handleCreateBoard}
                        disabled={isCreating}
                        className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isCreating ? (
                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span>Create New Board</span>
                    </button>
                </div>
            </div>

            {/* ─── MY SEFIRAH BOARDS GRID HEADER ─── */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">My Sefirah Boards</h2>
                    {usingMockData && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-full select-none" title="Showing locally populated mock data because workspace board database is empty or server is offline. Real modifications are simulated in memory.">
                            Demo Mode
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            viewMode === "grid" 
                                ? "bg-slate-100 border-slate-200/60 text-slate-800" 
                                : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                        title="Grid View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            viewMode === "list" 
                                ? "bg-slate-100 border-slate-200/60 text-slate-800" 
                                : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                        title="List View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ─── BOARDS GRID / LIST CONTAINER ─── */}
            {isLoading ? (
                /* Skeleton Loader */
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse" : "flex flex-col gap-3 animate-pulse"}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        viewMode === "grid" ? (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl h-64 flex flex-col overflow-hidden">
                                <div className="h-40 bg-slate-100" />
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="h-5 bg-slate-100 rounded w-16" />
                                        <div className="h-4 bg-slate-100 rounded-full w-4" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={i} className="bg-white border border-slate-100 rounded-xl h-16 flex items-center justify-between p-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-9 bg-slate-100 rounded" />
                                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                                </div>
                                <div className="w-24 h-4 bg-slate-100 rounded" />
                            </div>
                        )
                    ))}
                </div>
            ) : boards.length === 0 ? (
                /* Empty Search State */
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                    <span className="text-4xl mb-4">🔍</span>
                    <h3 className="font-bold text-slate-800 text-lg">No boards found</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">No boards match your search query "{searchQuery}". Try searching for something else or create a new board.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid view mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {boards.map((board) => (
                        <BoardCard
                            key={board.id}
                            board={board}
                            navigate={navigate}
                            activeMenuId={activeMenuId}
                            setActiveMenuId={setActiveMenuId}
                            onRename={(b) => setModal({ type: "rename", board: b })}
                            onVisibility={(b) => setModal({ type: "visibility", board: b })}
                            onBadge={(b) => setModal({ type: "badge", board: b })}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                /* List view mode */
                <div className="flex flex-col gap-3">
                    {boards.map((board) => (
                        <div 
                            key={board.id} 
                            className={`flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow duration-200 cursor-pointer group relative ${activeMenuId === board.id ? 'z-20' : 'z-0'}`}
                            onClick={() => navigate(`/board/${board.id}`)}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Tiny thumbnail mockup */}
                                <div className="w-12 h-9 rounded bg-[#F8FAFC] border border-slate-100 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                                    {board.thumbnailUrl ? (
                                        <img src={board.thumbnailUrl} alt={board.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 opacity-[0.4]" style={{
                                            backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
                                            backgroundSize: '8px 8px'
                                        }} />
                                    )}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate text-base">{board.title}</span>
                                        {board.badge && (
                                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border select-none ${
                                                board.badge === "active-project" 
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
                                                    : board.badge === "review-required"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                                    : "bg-slate-100 text-slate-600 border-slate-200/50"
                                            }`}>
                                                {board.badge === "active-project" ? "ACTIVE PROJECT" : board.badge === "review-required" ? "REVIEW REQUIRED" : "ARCHIVED"}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Last updated {timeAgo(board.updatedAt)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 ml-4">
                                {/* Collaborators overlapping list */}
                                <div className="flex -space-x-1.5 overflow-hidden">
                                    {board.collaborators.slice(0, 3).map((col) => (
                                        <div 
                                            key={col.userId} 
                                            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white select-none ${getAvatarColor(col.fullName)}`}
                                            title={col.fullName}
                                        >
                                            {col.avatarUrl ? (
                                                <img src={col.avatarUrl} alt={col.fullName} className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                getInitials(col.fullName)
                                            )}
                                        </div>
                                    ))}
                                    {board.extraCollaboratorsCount > 0 && (
                                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold ring-2 ring-white select-none">
                                            +{board.extraCollaboratorsCount}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Visibility Icon status */}
                                <div className="w-8 flex justify-center" title={`Visibility: ${board.visibilityIcon}`}>
                                    {board.visibilityIcon === "private" && (
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    )}
                                    {board.visibilityIcon === "shared" && (
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    )}
                                    {board.visibilityIcon === "public" && (
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    )}
                                </div>
                                
                                {/* Formatted Date */}
                                <span className="text-xs text-slate-400 w-24 hidden md:inline text-right select-none">
                                    {new Date(board.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                
                                {/* Row actions button */}
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === board.id ? null : board.id);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                    
                                    {activeMenuId === board.id && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-150 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setModal({ type: "rename", board }); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Rename
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setModal({ type: "visibility", board }); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Visibility...
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setModal({ type: "badge", board }); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Change Badge...
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); handleDelete(board.id); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/70 transition cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── MODALS RENDERING ─── */}
            {modal.type === "rename" && modal.board && (
                <RenameModal 
                    board={modal.board} 
                    onClose={() => setModal({ type: null, board: null })} 
                    onSave={handleRenameSave}
                />
            )}
            {modal.type === "visibility" && modal.board && (
                <VisibilityModal 
                    board={modal.board} 
                    onClose={() => setModal({ type: null, board: null })} 
                    onSave={handleVisibilitySave}
                />
            )}
            {modal.type === "badge" && modal.board && (
                <BadgeModal 
                    board={modal.board} 
                    onClose={() => setModal({ type: null, board: null })} 
                    onSave={handleBadgeSave}
                />
            )}
        </div>
    );
};

export default DashboardPage;
