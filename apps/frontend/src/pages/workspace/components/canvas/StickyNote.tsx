import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./StickyNote.css";

interface StickyNoteProps {
    element: CanvasElement & { type: "sticky-note" };
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    hasThread?: boolean;
    isEditing: boolean;
    onEditComplete: (content: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
    element,
    isSelected,
    onMouseDown,
    hasThread,
    isEditing,
    onEditComplete,
}) => {
    const bgColor = element.appearance.fillColor || "#f5a623";

    // Determine text color based on background brightness
    const isLightBg = isLightColor(bgColor);
    const textColor = isLightBg ? "#1a1a2e" : "#ffffff";

    return (
        <div
            className={`sticky-note ${isSelected ? "sticky-note--selected" : ""}`}
            style={{
                backgroundColor: bgColor,
                color: textColor,
                fontFamily:
                    element.appearance.fontFamily || "inherit",
                fontSize: element.appearance.fontSize || 14,
            }}
            onMouseDown={isEditing ? undefined : onMouseDown}
        >
            {hasThread && (
                <div className="sticky-note__comment-badge">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="white"
                    >
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                </div>
            )}
            {isEditing ? (
                <textarea
                    className="sticky-note__textarea-input"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: textColor,
                        resize: "none",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        padding: 0,
                        margin: 0,
                    }}
                    defaultValue={element.content}
                    onMouseDown={(e) => e.stopPropagation()}
                    onBlur={(e) => onEditComplete(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onEditComplete(e.currentTarget.value);
                        }
                    }}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                />
            ) : (
                <div className="sticky-note__content">{element.content}</div>
            )}
        </div>
    );
};

function isLightColor(hex: string): boolean {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
}

export default StickyNote;
