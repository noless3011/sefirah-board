import React, { useCallback } from "react";
import type { CanvasElement, CanvasElementAppearance, Thread } from "@sefirah/shared";
import type { ToolType } from "../types/canvas.types";
import "./RightPanel.css";

interface RightPanelProps {
    activeTab: "properties" | "chat";
    onTabChange: (tab: "properties" | "chat") => void;
    selectedElement: CanvasElement | null;
    onAppearanceChange: (changes: Partial<CanvasElementAppearance>) => void;
    onElementChange: (changes: Partial<CanvasElement>) => void;
    threads: Thread[];
    onThreadClick: (threadId: string) => void;
    chatContent: React.ReactNode;
    minimapContent: React.ReactNode;
    activeTool?: ToolType;
    penColor?: string;
    onPenColorChange?: (color: string) => void;
    penWidth?: number;
    onPenWidthChange?: (width: number) => void;
}

const PRESET_COLORS = [
    { value: "#4285f4", label: "Blue" },
    { value: "#f5a623", label: "Amber" },
    { value: "#1a1a2e", label: "Dark" },
];

const FONT_OPTIONS = [
    { value: "Manrope", label: "Manrope SemiBold", weight: "semibold" as const },
    { value: "Inter", label: "Inter Regular", weight: "normal" as const },
    { value: "Inter", label: "Inter Medium", weight: "medium" as const },
    { value: "Inter", label: "Inter SemiBold", weight: "semibold" as const },
    { value: "Inter", label: "Inter Bold", weight: "bold" as const },
];

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

const AVATAR_COLORS = ["#4285f4", "#34a853", "#ea4335", "#f5a623", "#9b59b6", "#00bcd4"];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Sub-components ── */

const EmptyState: React.FC = () => (
    <div className="right-panel__empty">
        <svg
            className="right-panel__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
        </svg>
        <p className="right-panel__empty-text">
            Select an element on the canvas to view and edit its properties.
        </p>
    </div>
);

interface ColorPickerProps {
    label?: string;
    currentColor: string | undefined;
    onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label = "Fill Color", currentColor, onChange }) => {
    const colorInputRef = React.useRef<HTMLInputElement>(null);
    const isCustomSelected = currentColor && !PRESET_COLORS.some(c => c.value === currentColor);

    return (
        <div className="right-panel__prop-row">
            <span className="right-panel__prop-label">{label}</span>
            <div className="right-panel__colors">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color.value}
                        className={`right-panel__color-swatch${
                            currentColor === color.value ? " right-panel__color-swatch--selected" : ""
                        }`}
                        style={{ background: color.value }}
                        onClick={() => onChange(color.value)}
                        title={color.label}
                        aria-label={`Set color to ${color.label}`}
                        type="button"
                    />
                ))}
                <div style={{ position: "relative", display: "inline-block" }}>
                    <button
                        className={`right-panel__color-add${
                            isCustomSelected ? " right-panel__color-swatch--selected" : ""
                        }`}
                        style={{
                            background: isCustomSelected ? currentColor : "transparent",
                            borderStyle: isCustomSelected ? "solid" : "dashed",
                            color: isCustomSelected ? "#ffffff" : "#9ca3af",
                            textShadow: isCustomSelected ? "0 1px 2px rgba(0,0,0,0.5)" : "none"
                        }}
                        onClick={() => colorInputRef.current?.click()}
                        title="Custom color"
                        aria-label="Add custom color"
                        type="button"
                    >
                        +
                    </button>
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={currentColor || "#ffffff"}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            opacity: 0,
                            width: 0,
                            height: 0,
                            pointerEvents: "none"
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

interface BorderWidthSliderProps {
    label?: string;
    value: number;
    onChange: (width: number) => void;
}

const BorderWidthSlider: React.FC<BorderWidthSliderProps> = ({ label = "Border Width", value, onChange }) => (
    <div className="right-panel__prop-row">
        <span className="right-panel__prop-label">{label}</span>
        <div className="right-panel__slider-row">
            <input
                className="right-panel__slider"
                type="range"
                min={0}
                max={15}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={label}
            />
            <span className="right-panel__slider-value">{value}px</span>
        </div>
    </div>
);

interface TypographySelectProps {
    currentFont: string | undefined;
    currentWeight: string | undefined;
    onChange: (fontFamily: string, fontWeight: CanvasElementAppearance["fontWeight"]) => void;
}

const TypographySelect: React.FC<TypographySelectProps> = ({
    currentFont,
    currentWeight,
    onChange,
}) => {
    const selectedKey = `${currentFont ?? "Inter"}_${currentWeight ?? "regular"}`;

    return (
        <div className="right-panel__prop-row">
            <span className="right-panel__prop-label">Typography</span>
            <select
                className="right-panel__select"
                value={selectedKey}
                onChange={(e) => {
                    const option = FONT_OPTIONS.find(
                        (o) => `${o.value}_${o.weight}` === e.target.value,
                    );
                    if (option) {
                        onChange(option.value, option.weight);
                    }
                }}
                aria-label="Typography"
            >
                {FONT_OPTIONS.map((option) => {
                    const key = `${option.value}_${option.weight}`;
                    return (
                        <option key={key} value={key}>
                            {option.label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

interface ThreadCardProps {
    thread: Thread;
    onClick: () => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onClick }) => (
    <button
        className="right-panel__thread-card"
        onClick={onClick}
        type="button"
        aria-label={`Thread by ${thread.authorName}`}
    >
        <div
            className="right-panel__thread-avatar"
            style={{
                background: thread.authorAvatarUrl
                    ? undefined
                    : getAvatarColor(thread.authorName),
            }}
        >
            {thread.authorAvatarUrl ? (
                <img src={thread.authorAvatarUrl} alt={thread.authorName} />
            ) : (
                getInitials(thread.authorName)
            )}
        </div>
        <div className="right-panel__thread-body">
            <p className="right-panel__thread-name">{thread.authorName}</p>
            <p className="right-panel__thread-message">{thread.message}</p>
        </div>
    </button>
);

/* ── Main component ── */

const RightPanel: React.FC<RightPanelProps> = ({
    activeTab,
    onTabChange,
    selectedElement,
    onAppearanceChange,
    onElementChange,
    threads,
    onThreadClick,
    chatContent,
    minimapContent,
    activeTool,
    penColor = "#4285f4",
    onPenColorChange,
    penWidth = 3,
    onPenWidthChange,
}) => {
    const appearance = selectedElement?.appearance;

    const handleFillColorChange = useCallback(
        (color: string) => onAppearanceChange({ fillColor: color }),
        [onAppearanceChange],
    );

    const handleStrokeWidthChange = useCallback(
        (width: number) => onAppearanceChange({ strokeWidth: width }),
        [onAppearanceChange],
    );

    const handleTypographyChange = useCallback(
        (fontFamily: string, fontWeight: CanvasElementAppearance["fontWeight"]) =>
            onAppearanceChange({ fontFamily, fontWeight }),
        [onAppearanceChange],
    );

    const isLineElement = selectedElement && ["line", "arrow", "connector"].includes(selectedElement.type);
    const isTextElement = selectedElement?.type === "text";
    const isStickyElement = selectedElement?.type === "sticky-note";
    const isCardElement = selectedElement && ["service-card", "database-card"].includes(selectedElement.type);

    return (
        <aside className="right-panel">
            {/* Tab bar */}
            <div className="right-panel__tabs">
                <button
                    className={`right-panel__tab${
                        activeTab === "properties" ? " right-panel__tab--active" : ""
                    }`}
                    onClick={() => onTabChange("properties")}
                    type="button"
                >
                    Properties
                </button>
                <button
                    className={`right-panel__tab${
                        activeTab === "chat" ? " right-panel__tab--active" : ""
                    }`}
                    onClick={() => onTabChange("chat")}
                    type="button"
                >
                    Chat
                </button>
            </div>

            {/* Properties tab */}
            {activeTab === "properties" && (
                <>
                    <div className="right-panel__content">
                        {selectedElement == null ? (
                            activeTool === "pen" ? (
                                <div className="right-panel__properties">
                                    <div className="right-panel__section">
                                        <h3 className="right-panel__section-header">Pen Tool Settings</h3>
                                        <ColorPicker
                                            label="Pen Color"
                                            currentColor={penColor}
                                            onChange={onPenColorChange || (() => {})}
                                        />
                                        <BorderWidthSlider
                                            label="Pen Width"
                                            value={penWidth}
                                            onChange={onPenWidthChange || (() => {})}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState />
                            )
                        ) : (
                            <div className="right-panel__properties">
                                {/* Appearance section */}
                                <div className="right-panel__section">
                                    <h3 className="right-panel__section-header">Appearance</h3>
                                    {isLineElement && (
                                        <>
                                            <ColorPicker
                                                label="Line Color"
                                                currentColor={appearance?.strokeColor || "#4285f4"}
                                                onChange={(color) => onAppearanceChange({ strokeColor: color })}
                                            />
                                            <BorderWidthSlider
                                                label="Line Width"
                                                value={appearance?.strokeWidth ?? 2}
                                                onChange={handleStrokeWidthChange}
                                            />
                                        </>
                                    )}
                                    {isTextElement && (
                                        <>
                                            <ColorPicker
                                                label="Text Color"
                                                currentColor={appearance?.fillColor || "#1a1a2e"}
                                                onChange={handleFillColorChange}
                                            />
                                            <TypographySelect
                                                currentFont={appearance?.fontFamily}
                                                currentWeight={appearance?.fontWeight}
                                                onChange={handleTypographyChange}
                                            />
                                        </>
                                    )}
                                    {isStickyElement && (
                                        <>
                                            <ColorPicker
                                                label="Fill Color"
                                                currentColor={appearance?.fillColor || "#f5a623"}
                                                onChange={handleFillColorChange}
                                            />
                                            <TypographySelect
                                                currentFont={appearance?.fontFamily}
                                                currentWeight={appearance?.fontWeight}
                                                onChange={handleTypographyChange}
                                            />
                                        </>
                                    )}
                                    {isCardElement && (
                                        <>
                                            <ColorPicker
                                                label="Card Color"
                                                currentColor={appearance?.fillColor || "#ffffff"}
                                                onChange={handleFillColorChange}
                                            />
                                            <BorderWidthSlider
                                                label="Border Width"
                                                value={appearance?.strokeWidth ?? 4}
                                                onChange={handleStrokeWidthChange}
                                            />
                                        </>
                                    )}
                                    {!isLineElement && !isTextElement && !isStickyElement && !isCardElement && (
                                        <>
                                            <ColorPicker
                                                currentColor={appearance?.fillColor}
                                                onChange={handleFillColorChange}
                                            />
                                            <BorderWidthSlider
                                                value={appearance?.strokeWidth ?? 2}
                                                onChange={handleStrokeWidthChange}
                                            />
                                            <TypographySelect
                                                currentFont={appearance?.fontFamily}
                                                currentWeight={appearance?.fontWeight}
                                                onChange={handleTypographyChange}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Details section based on element type */}
                                {selectedElement && ["service-card", "database-card"].includes(selectedElement.type) && (
                                    <div className="right-panel__section">
                                        <h3 className="right-panel__section-header">Card Details</h3>
                                        <div className="right-panel__prop-row-vertical">
                                            <span className="right-panel__prop-label">Title</span>
                                            <input
                                                type="text"
                                                className="right-panel__input-text"
                                                value={(selectedElement as any).title || ""}
                                                onChange={(e) => onElementChange({ title: e.target.value })}
                                            />
                                        </div>
                                        <div className="right-panel__prop-row-vertical">
                                            <span className="right-panel__prop-label">Description</span>
                                            <textarea
                                                className="right-panel__textarea"
                                                value={(selectedElement as any).description || ""}
                                                onChange={(e) => onElementChange({ description: e.target.value })}
                                            />
                                        </div>
                                        <div className="right-panel__prop-row-vertical">
                                            <span className="right-panel__prop-label">Badge</span>
                                            <select
                                                className="right-panel__select"
                                                value={(selectedElement as any).badge || "SERVICE"}
                                                onChange={(e) => onElementChange({ badge: e.target.value })}
                                            >
                                                <option value="SERVICE">SERVICE</option>
                                                <option value="DATABASE">DATABASE</option>
                                                <option value="API">API</option>
                                                <option value="CACHE">CACHE</option>
                                                <option value="QUEUE">QUEUE</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {selectedElement && ["sticky-note", "text"].includes(selectedElement.type) && (
                                    <div className="right-panel__section">
                                        <h3 className="right-panel__section-header">Content</h3>
                                        <div className="right-panel__prop-row-vertical">
                                            <textarea
                                                className="right-panel__textarea"
                                                value={(selectedElement as any).content || ""}
                                                onChange={(e) => onElementChange({ content: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="right-panel__divider" />

                                {/* Active threads section */}
                                <div className="right-panel__section">
                                    <h3 className="right-panel__section-header">
                                        Active Threads
                                    </h3>
                                    <div className="right-panel__threads">
                                        {threads.length === 0 ? (
                                            <p className="right-panel__thread-empty">
                                                No active threads
                                            </p>
                                        ) : (
                                            threads.map((thread) => (
                                                <ThreadCard
                                                    key={thread.id}
                                                    thread={thread}
                                                    onClick={() => onThreadClick(thread.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Minimap (always visible on properties tab) */}
                    <div className="right-panel__minimap">
                        {minimapContent ?? (
                            <span className="right-panel__minimap-placeholder">Minimap</span>
                        )}
                    </div>
                </>
            )}

            {/* Chat tab */}
            {activeTab === "chat" && (
                <div className="right-panel__chat">{chatContent}</div>
            )}
        </aside>
    );
};

export default RightPanel;
