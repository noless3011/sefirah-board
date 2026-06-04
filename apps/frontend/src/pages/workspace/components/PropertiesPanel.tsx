import React from "react";
import type { CanvasElement } from "@sefirah/shared";

interface PropertiesPanelProps {
    selectedElement: CanvasElement | null;
    onElementChange: (changes: Record<string, unknown>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedElement,
    onElementChange,
}) => {
    if (!selectedElement) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a9 9 0 119.81-9.81m-9.81 9.81a9 9 0 01-9.81-9.81M18 10.5h.008v.008H18V10.5zm-6-6h.008v.008H12V4.5zM6 6h.008v.008H6V6z" />
                </svg>
                <p className="text-xs text-slate-400 font-medium">
                    Select an element to edit its properties
                </p>
            </div>
        );
    }

    const { appearance } = selectedElement;
    const fillColor = appearance.fillColor || "transparent";
    const strokeWidth = appearance.strokeWidth !== undefined ? appearance.strokeWidth : 2;
    const fontFamily = appearance.fontFamily || "Inter";
    const fontSize = appearance.fontSize || 14;

    const colorSwatches = [
        { name: "Transparent", value: "transparent", colorClass: "border border-slate-300 bg-slate-50 relative after:content-[''] after:absolute after:top-1/2 after:left-[4%] after:w-[92%] after:h-[1px] after:bg-red-500 after:rotate-45" },
        { name: "Blue", value: "#3B82F6", colorClass: "bg-blue-500" },
        { name: "Amber", value: "#F5A623", colorClass: "bg-amber-500" },
        { name: "Dark Gray", value: "#4A5568", colorClass: "bg-slate-600" },
        { name: "Purple", value: "#8B5CF6", colorClass: "bg-purple-500" },
        { name: "Green", value: "#10B981", colorClass: "bg-emerald-500" },
    ];

    const handleColorClick = (colorValue: string) => {
        onElementChange({
            appearance: {
                ...appearance,
                fillColor: colorValue,
            },
        });
    };

    const handleBorderWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        onElementChange({
            appearance: {
                ...appearance,
                strokeWidth: val,
            },
        });
    };

    const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onElementChange({
            appearance: {
                ...appearance,
                fontFamily: e.target.value,
            },
        });
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        onElementChange({
            appearance: {
                ...appearance,
                fontSize: val,
            },
        });
    };

    // Text elements or Sticky Notes or Service Cards have customizable text field
    const isTextElement =
        selectedElement.type === "text" ||
        selectedElement.type === "sticky-note" ||
        selectedElement.type === "service-card" ||
        selectedElement.type === "database-card";

    const handleContentChange = (
        e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
        const value = e.target.value;
        if (selectedElement.type === "service-card" || selectedElement.type === "database-card") {
            onElementChange({ title: value });
        } else {
            onElementChange({ content: value });
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onElementChange({ description: e.target.value });
    };

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto select-none gap-6">
            {/* Section: Content if applicable */}
            {isTextElement && (
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        Element Content
                    </span>
                    {(selectedElement.type === "service-card" ||
                        selectedElement.type === "database-card") ? (
                        <>
                            <label className="text-[10px] font-semibold text-slate-500">Title</label>
                            <input
                                type="text"
                                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                                value={(selectedElement as any).title || ""}
                                onChange={handleContentChange}
                            />
                            <label className="text-[10px] font-semibold text-slate-500 mt-1">Description</label>
                            <textarea
                                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 h-16 focus:outline-none focus:border-blue-500 leading-normal"
                                value={(selectedElement as any).description || ""}
                                onChange={handleDescriptionChange}
                            />
                        </>
                    ) : (
                        <textarea
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 h-20 focus:outline-none focus:border-blue-500 leading-normal"
                            value={(selectedElement as any).content || ""}
                            onChange={handleContentChange}
                            placeholder="Enter text contents..."
                        />
                    )}
                </div>
            )}

            {/* Section: Appearance */}
            <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Appearance
                </span>

                {/* Fill Color Swatches */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-slate-500">Fill Color</label>
                    <div className="flex flex-wrap gap-2">
                        {colorSwatches.map((swatch) => {
                            const isSelectedColor = fillColor === swatch.value;
                            return (
                                <button
                                    key={swatch.value}
                                    onClick={() => handleColorClick(swatch.value)}
                                    className={`w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                        swatch.colorClass
                                    } ${isSelectedColor ? "ring-2 ring-blue-500 ring-offset-2 scale-105" : ""}`}
                                    title={swatch.name}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Border Width Slider */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                        <span>Border Width</span>
                        <span className="font-bold text-slate-700">{strokeWidth}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        value={strokeWidth}
                        onChange={handleBorderWidthChange}
                    />
                </div>
            </div>

            {/* Section: Typography */}
            <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Typography
                </span>

                {/* Font Selector */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Font Family</label>
                    <select
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 bg-white font-medium text-slate-700 cursor-pointer"
                        value={fontFamily}
                        onChange={handleFontFamilyChange}
                    >
                        <option value="Inter">Inter</option>
                        <option value="Manrope">Manrope</option>
                        <option value="Outfit">Outfit</option>
                        <option value="monospace">Monospace</option>
                    </select>
                </div>

                {/* Font Size slider */}
                {selectedElement.type === "text" && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                            <span>Font Size</span>
                            <span className="font-bold text-slate-700">{fontSize}px</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="72"
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            value={fontSize}
                            onChange={handleFontSizeChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
export default PropertiesPanel;
