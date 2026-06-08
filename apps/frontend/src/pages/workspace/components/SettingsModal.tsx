import React, { useRef } from "react";
import "./SettingsModal.css";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    canvasBgColor: string;
    onCanvasBgColorChange: (color: string) => void;
    canvasGridStyle: "dots" | "lines" | "none";
    onCanvasGridStyleChange: (style: "dots" | "lines" | "none") => void;
}

const BG_PRESETS = [
    { value: "#f8f9fa", label: "Default Light" },
    { value: "#ffffff", label: "Pure White" },
    { value: "#faf6ee", label: "Warm Paper" },
    { value: "#eef2f6", label: "Soft Blue" },
    { value: "#1e1e24", label: "Sleek Dark" },
    { value: "#121214", label: "Midnight Dark" },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    canvasBgColor,
    onCanvasBgColorChange,
    canvasGridStyle,
    onCanvasGridStyleChange,
}) => {
    const customColorInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const isCustomBgSelected = !BG_PRESETS.some(preset => preset.value.toLowerCase() === canvasBgColor.toLowerCase());

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal__header">
                    <h2>Canvas Settings</h2>
                    <button className="settings-modal__close-btn" onClick={onClose} aria-label="Close">
                        &times;
                    </button>
                </div>

                <div className="settings-modal__content">
                    {/* Background Color Section */}
                    <div className="settings-modal__section">
                        <h3 className="settings-modal__section-title">Background Color</h3>
                        <div className="settings-modal__bg-options">
                            {BG_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    className={`settings-modal__bg-btn ${
                                        canvasBgColor.toLowerCase() === preset.value.toLowerCase()
                                            ? "settings-modal__bg-btn--active"
                                            : ""
                                    }`}
                                    style={{ backgroundColor: preset.value }}
                                    onClick={() => onCanvasBgColorChange(preset.value)}
                                    title={preset.label}
                                    type="button"
                                >
                                    <span className="settings-modal__bg-label">{preset.label}</span>
                                </button>
                            ))}

                            {/* Custom Color Selector */}
                            <button
                                className={`settings-modal__bg-btn settings-modal__bg-btn--custom ${
                                    isCustomBgSelected ? "settings-modal__bg-btn--active" : ""
                                }`}
                                style={{
                                    backgroundColor: isCustomBgSelected ? canvasBgColor : "#e5e7eb",
                                }}
                                onClick={() => customColorInputRef.current?.click()}
                                type="button"
                            >
                                <span className="settings-modal__bg-label" style={{ color: isCustomBgSelected ? "#fff" : "#4b5563" }}>
                                    {isCustomBgSelected ? "Custom" : "+ Custom"}
                                </span>
                            </button>
                            <input
                                ref={customColorInputRef}
                                type="color"
                                value={isCustomBgSelected ? canvasBgColor : "#ffffff"}
                                onChange={(e) => onCanvasBgColorChange(e.target.value)}
                                style={{ display: "none" }}
                            />
                        </div>
                    </div>

                    {/* Grid Style Section */}
                    <div className="settings-modal__section">
                        <h3 className="settings-modal__section-title">Grid Style</h3>
                        <div className="settings-modal__grid-options">
                            {/* Dots Card */}
                            <button
                                className={`settings-modal__grid-card ${
                                    canvasGridStyle === "dots" ? "settings-modal__grid-card--active" : ""
                                }`}
                                onClick={() => onCanvasGridStyleChange("dots")}
                                type="button"
                            >
                                <div className="settings-modal__grid-preview settings-modal__grid-preview--dots" />
                                <span className="settings-modal__grid-label">Dots</span>
                            </button>

                            {/* Lines Card */}
                            <button
                                className={`settings-modal__grid-card ${
                                    canvasGridStyle === "lines" ? "settings-modal__grid-card--active" : ""
                                }`}
                                onClick={() => onCanvasGridStyleChange("lines")}
                                type="button"
                            >
                                <div className="settings-modal__grid-preview settings-modal__grid-preview--lines" />
                                <span className="settings-modal__grid-label">Lines</span>
                            </button>

                            {/* None Card */}
                            <button
                                className={`settings-modal__grid-card ${
                                    canvasGridStyle === "none" ? "settings-modal__grid-card--active" : ""
                                }`}
                                onClick={() => onCanvasGridStyleChange("none")}
                                type="button"
                            >
                                <div className="settings-modal__grid-preview settings-modal__grid-preview--none" />
                                <span className="settings-modal__grid-label">None</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
