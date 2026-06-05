import React from "react";
import type { CollaboratorCursorInfo } from "../../types/canvas.types";
import "./CollaboratorCursor.css";

interface CollaboratorCursorProps {
    cursor: CollaboratorCursorInfo;
}

const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({ cursor }) => {
    return (
        <div
            className="collaborator-cursor"
            style={{
                left: cursor.x,
                top: cursor.y,
                transition: "left 0.1s linear, top 0.1s linear",
            }}
        >
            {/* Cursor arrow */}
            <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                className="collaborator-cursor__arrow"
            >
                <path
                    d="M1 1L7 18L9.5 10.5L16 8.5L1 1Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>
            {/* Name label */}
            <div
                className="collaborator-cursor__label"
                style={{ backgroundColor: cursor.color }}
            >
                {cursor.userName}
            </div>
        </div>
    );
};

export default CollaboratorCursor;
