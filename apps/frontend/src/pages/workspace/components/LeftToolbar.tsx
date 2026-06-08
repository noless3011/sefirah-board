import React from "react";
import type { ToolType } from "../types/canvas.types";
import "./LeftToolbar.css";

interface LeftToolbarProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onSettingsClick: () => void;
}

interface ToolButtonConfig {
    type: ToolType;
    label: string;
    icon: React.ReactNode;
}

const toolButtons: ToolButtonConfig[] = [
    {
        type: "select",
        label: "Select",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="M13 13l6 6" />
            </svg>
        ),
    },
    {
        type: "pen",
        label: "Pen",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
            </svg>
        ),
    },
    {
        type: "shape",
        label: "Shape",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
        ),
    },
    {
        type: "sticky",
        label: "Sticky Note",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
                <path d="M15 3v4a2 2 0 0 0 2 2h4" />
            </svg>
        ),
    },
    {
        type: "text",
        label: "Text",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
        ),
    },
    {
        type: "connector",
        label: "Connector",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="19" r="3" />
                <circle cx="19" cy="5" r="3" />
                <path d="M5 16V9a4 4 0 0 1 4-4h6" />
            </svg>
        ),
    },
];

const LeftToolbar: React.FC<LeftToolbarProps> = ({
    activeTool,
    onToolChange,
    onSettingsClick,
}) => {
    return (
        <div className="left-toolbar">
            <div className="left-toolbar__tools">
                {toolButtons.map((tool) => (
                    <button
                        key={tool.type}
                        className={`left-toolbar__btn${activeTool === tool.type ? " left-toolbar__btn--active" : ""}`}
                        onClick={() => onToolChange(tool.type)}
                        aria-label={tool.label}
                    >
                        {tool.icon}
                        <span className="left-toolbar__tooltip">{tool.label}</span>
                    </button>
                ))}
            </div>

            <div className="left-toolbar__separator" />

            <div className="left-toolbar__utilities">
                <button
                    className="left-toolbar__btn"
                    onClick={onSettingsClick}
                    aria-label="Settings"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span className="left-toolbar__tooltip">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default LeftToolbar;
