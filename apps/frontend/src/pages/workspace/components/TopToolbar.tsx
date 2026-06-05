import React, { useState, useRef, useEffect, useCallback } from "react";
import "./TopToolbar.css";

interface TopToolbarProps {
  boardTitle: string;
  onTitleChange: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  collaborators: Array<{
    userId: string;
    fullName: string;
    avatarUrl?: string;
  }>;
  onExport: () => void;
  onShare: () => void;
}

const AVATAR_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc05",
  "#34a853",
  "#ff6d01",
  "#46bdc6",
  "#7b61ff",
];

const MAX_VISIBLE_AVATARS = 3;

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  boardTitle,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  collaborators,
  onExport,
  onShare,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(boardTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftTitle(boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const commitTitle = useCallback(() => {
    setIsEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== boardTitle) {
      onTitleChange(trimmed);
    } else {
      setDraftTitle(boardTitle);
    }
  }, [draftTitle, boardTitle, onTitleChange]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitTitle();
      } else if (e.key === "Escape") {
        setDraftTitle(boardTitle);
        setIsEditingTitle(false);
      }
    },
    [commitTitle, boardTitle]
  );

  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount = Math.max(0, collaborators.length - MAX_VISIBLE_AVATARS);

  return (
    <div className="top-toolbar">
      {/* Board title */}
      <div className="top-toolbar__title-section">
        <svg
          className="top-toolbar__title-icon"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm-1 12.41L5.29 10.7a1 1 0 0 1 1.42-1.42L9 11.59l4.29-4.3a1 1 0 1 1 1.42 1.42L9 14.41z"
            fill="currentColor"
          />
        </svg>

        {isEditingTitle ? (
          <input
            ref={inputRef}
            className="top-toolbar__title-input"
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <span
            className="top-toolbar__title"
            onClick={() => setIsEditingTitle(true)}
          >
            {boardTitle}
          </span>
        )}
      </div>

      <div className="top-toolbar__divider" />

      {/* Undo / Redo */}
      <div className="top-toolbar__history">
        <button
          className="top-toolbar__history-btn"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo"
          title="Undo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          className="top-toolbar__history-btn"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo"
          title="Redo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </button>
      </div>

      <div className="top-toolbar__divider" />

      {/* Collaborator avatars */}
      {collaborators.length > 0 && (
        <>
          <div className="top-toolbar__avatars">
            {extraCount > 0 && (
              <div
                className="top-toolbar__avatar top-toolbar__avatar--extra"
                title={`${extraCount} more collaborator${extraCount > 1 ? "s" : ""}`}
              >
                +{extraCount}
              </div>
            )}
            {visibleCollaborators
              .slice()
              .reverse()
              .map((collab) => (
                <div
                  key={collab.userId}
                  className="top-toolbar__avatar"
                  style={{
                    background: collab.avatarUrl
                      ? "transparent"
                      : getAvatarColor(collab.userId),
                  }}
                  title={collab.fullName}
                >
                  {collab.avatarUrl ? (
                    <img src={collab.avatarUrl} alt={collab.fullName} />
                  ) : (
                    getInitials(collab.fullName)
                  )}
                </div>
              ))}
          </div>
          <div className="top-toolbar__divider" />
        </>
      )}

      {/* Action buttons */}
      <div className="top-toolbar__actions">
        <button
          className="top-toolbar__btn top-toolbar__btn--export"
          onClick={onExport}
        >
          Export
        </button>
        <button
          className="top-toolbar__btn top-toolbar__btn--share"
          onClick={onShare}
        >
          Share
        </button>
      </div>
    </div>
  );
};

export default TopToolbar;
