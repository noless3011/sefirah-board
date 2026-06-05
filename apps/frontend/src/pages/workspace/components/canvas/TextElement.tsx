import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./TextElement.css";

interface TextElementProps {
    element: CanvasElement & { type: "text" };
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
}

const TextElement: React.FC<TextElementProps> = ({
    element,
    isSelected,
    onMouseDown,
}) => {
    return (
        <div
            className={`text-element ${isSelected ? "text-element--selected" : ""}`}
            style={{
                color: element.appearance.fillColor || "#1a1a2e",
                fontSize: element.appearance.fontSize || 16,
                fontFamily: element.appearance.fontFamily || "inherit",
                fontWeight: element.appearance.fontWeight || "normal",
                textAlign: element.appearance.textAlign || "left",
            }}
            onMouseDown={onMouseDown}
        >
            {element.content}
        </div>
    );
};

export default TextElement;
