import React, { useState } from "react";
import type { Board } from "@sefirah/shared";

// =============================================================================
// COLOR AND STRING FORMATTING UTILITIES
// =============================================================================
export const getAvatarColor = (name: string) => {
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

export const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

export const timeAgo = (dateStr: string) => {
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
// SUB-COMPONENTS
// =============================================================================

/** Stylized Workspace / Canvas Thumbnail representation */
export const BoardThumbnail: React.FC<{ title: string; thumbnailUrl: string | null }> = ({ title, thumbnailUrl }) => {
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

// =============================================================================
// BOARD CARD COMPONENT (WITH 3D PARALLAX TILT & SHADOW EFFECTS)
// =============================================================================
export interface BoardCardProps {
    board: Board;
    navigate: (url: string) => void;
    activeMenuId?: string | null;
    setActiveMenuId?: (id: string | null) => void;
    onRename?: (board: Board) => void;
    onVisibility?: (board: Board) => void;
    onBadge?: (board: Board) => void;
    onDelete?: (id: string) => void;
    onLeave?: (board: Board) => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({
    board,
    navigate,
    activeMenuId = null,
    setActiveMenuId,
    onRename,
    onVisibility,
    onBadge,
    onDelete,
    onLeave
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
            boxShadow: '0 40px 50px -10px rgba(0, 0, 0, 0.20), 0 20px 20px -10px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.08s ease-out, box-shadow 0.2s ease',
            zIndex: 10
        });
    };

    const handleMouseLeave = () => {
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
        });
    };

    const hasOptions = (onRename || onVisibility || onBadge || onDelete || onLeave) && setActiveMenuId;

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
                        {hasOptions && (
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
                                            {onRename && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onRename(board); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Rename
                                                </button>
                                            )}
                                            {onVisibility && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onVisibility(board); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Visibility...
                                                </button>
                                            )}
                                            {onBadge && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onBadge(board); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    Change Badge...
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onDelete(board.id); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/70 transition cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            {onLeave && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); onLeave(board); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/70 transition cursor-pointer"
                                                >
                                                    Leave Board
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
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
