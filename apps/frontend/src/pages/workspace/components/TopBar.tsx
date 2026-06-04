import React from "react";

interface Collaborator {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
}

interface TopBarProps {
    boardTitle: string;
    collaborators: Collaborator[];
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onShare: () => void;
    onBack: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    boardTitle,
    collaborators,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onShare,
    onBack,
}) => {
    // Get initials helper
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    // Limit visible collaborators to 3 in the stack
    const maxVisibleCollaborators = 3;
    const visibleCollaborators = collaborators.slice(0, maxVisibleCollaborators);
    const extraCount = collaborators.length > maxVisibleCollaborators ? collaborators.length - maxVisibleCollaborators : 0;

    return (
        <div className="w-full h-14 bg-white border-b border-slate-150 px-4 flex items-center justify-between select-none">
            {/* Left section: Back + Logo + Title + Undo/Redo */}
            <div className="flex items-center gap-3">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Back to Dashboard"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                {/* Sefirah Logo Icon (Blue) */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tighter">
                        S
                    </div>
                    <span className="font-semibold text-slate-800 text-sm max-w-[200px] truncate" title={boardTitle}>
                        {boardTitle}
                    </span>
                </div>

                {/* Vertical Divider */}
                <div className="h-4 w-[1px] bg-slate-200 mx-2" />

                {/* Undo / Redo buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            canUndo
                                ? "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                                : "text-slate-300 pointer-events-none"
                        }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            canRedo
                                ? "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                                : "text-slate-300 pointer-events-none"
                        }`}
                        title="Redo (Ctrl+Y)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Right section: Collaborator Stack + Export + Share */}
            <div className="flex items-center gap-4">
                {/* Overlapping Collaborators Avatar Stack */}
                <div className="flex items-center -space-x-2">
                    {visibleCollaborators.map((user, idx) => (
                        <div
                            key={user.userId}
                            className="w-7 h-7 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 overflow-hidden shadow-sm"
                            style={{ zIndex: 10 - idx }}
                            title={user.fullName}
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getInitials(user.fullName)
                            )}
                        </div>
                    ))}
                    {extraCount > 0 && (
                        <div
                            className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm z-0"
                            title={`${extraCount} more collaborators`}
                        >
                            +{extraCount}
                        </div>
                    )}
                </div>

                {/* Export Button */}
                <button
                    onClick={onExport}
                    className="px-3.5 py-1.5 border border-slate-250 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export
                </button>

                {/* Share Button (Blue Filled) */}
                <button
                    onClick={onShare}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l.907.453m-.907-.453a2.25 2.25 0 011.625-1.317M15.75 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM15.75 16.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                    </svg>
                    Share
                </button>
            </div>
        </div>
    );
};
export default TopBar;
