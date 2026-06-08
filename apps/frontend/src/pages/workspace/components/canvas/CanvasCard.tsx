import React from "react";
import type { CanvasElement } from "@sefirah/shared";
import "./CanvasCard.css";

interface CanvasCardProps {
    element: CanvasElement & { type: "service-card" | "database-card" };
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    isEditing: boolean;
    onEditComplete: (changes: { title?: string; description?: string }) => void;
}

const BADGE_COLORS: Record<string, string> = {
    SERVICE: "#4285f4",
    DATABASE: "#8B6914",
    API: "#34a853",
    CACHE: "#ea4335",
    QUEUE: "#9b59b6",
};

const CanvasCard: React.FC<CanvasCardProps> = ({
    element,
    isSelected,
    onMouseDown,
    isEditing,
    onEditComplete,
}) => {
    const badgeColor =
        BADGE_COLORS[element.badge?.toUpperCase()] ||
        element.appearance.strokeColor ||
        "#4285f4";

    const [title, setTitle] = React.useState(element.title || "");
    const [description, setDescription] = React.useState(element.description || "");

    React.useEffect(() => {
        if (!isEditing) {
            setTitle(element.title || "");
            setDescription(element.description || "");
        }
    }, [element.title, element.description, isEditing]);

    const handleBlur = (e: React.FocusEvent) => {
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }
        onEditComplete({ title, description });
    };

    return (
        <div
            className={`canvas-card ${isSelected ? "canvas-card--selected" : ""}`}
            style={{
                borderLeftColor: badgeColor,
                borderLeftWidth: element.appearance.strokeWidth ?? 4,
                backgroundColor:
                    element.appearance.fillColor || "#ffffff",
                cursor: isEditing ? "default" : "grab",
            }}
            onMouseDown={isEditing ? undefined : onMouseDown}
        >
            <span
                className="canvas-card__badge"
                style={{ color: badgeColor }}
            >
                {element.badge}
            </span>
            {isEditing ? (
                <div
                    className="canvas-card__edit-fields"
                    onMouseDown={(e) => e.stopPropagation()}
                    onBlur={handleBlur}
                >
                    <input
                        type="text"
                        className="canvas-card__title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onEditComplete({ title: e.currentTarget.value, description });
                            }
                        }}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                    />
                    <textarea
                        className="canvas-card__desc-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onEditComplete({ title, description: e.currentTarget.value });
                            }
                        }}
                        placeholder="Description"
                    />
                </div>
            ) : (
                <>
                    <h3 className="canvas-card__title">{element.title}</h3>
                    <p className="canvas-card__description">{element.description}</p>
                </>
            )}
        </div>
    );
};

export default CanvasCard;
