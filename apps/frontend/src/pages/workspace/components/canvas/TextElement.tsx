import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./TextElement.css";

interface TextElementProps {
    element: CanvasElement & { type: "text" };
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    isEditing: boolean;
    onEditComplete: (content: string) => void;
}

const TextElement: React.FC<TextElementProps> = ({
    element,
    isSelected,
    onMouseDown,
    isEditing,
    onEditComplete,
}) => {
    return (
        <div
            className={`text-element ${isSelected ? "text-element--selected" : ""}`}
            style={{
                color: element.appearance.fillColor || "#1a1a2e",
                fontSize: element.appearance.fontSize || 16,
                fontFamily: element.appearance.fontFamily || "inherit",
                fontWeight: element.appearance.fontWeight || "normal",
                fontStyle: element.appearance.italic ? "italic" : "normal",
                textDecoration: element.appearance.underline ? "underline" : "none",
                border: element.appearance.dashed ? `1.5px dashed ${element.appearance.fillColor || "#1a1a2e"}` : "1.5px solid transparent",
                textAlign: element.appearance.textAlign || "left",
                cursor: isEditing ? "text" : "grab",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
            }}
            onMouseDown={isEditing ? undefined : onMouseDown}
        >
            {isEditing ? (
                <textarea
                    className="text-element__textarea-input"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: element.appearance.fillColor || "#1a1a2e",
                        resize: "none",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        fontStyle: "inherit",
                        textDecoration: "inherit",
                        textAlign: "inherit",
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
                element.content
            )}
        </div>
    );
};

export default TextElement;
