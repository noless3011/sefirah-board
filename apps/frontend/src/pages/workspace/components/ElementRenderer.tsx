import React from "react";
import type { CanvasElement } from "@sefirah/shared";

interface ElementRendererProps {
    element: CanvasElement;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    hasThread: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
    element,
    isSelected,
    onMouseDown,
    hasThread,
}) => {
    const { type, width, height, appearance } = element;

    // Appearance styles
    const fillColor = appearance.fillColor || "transparent";
    const strokeColor = appearance.strokeColor || "#3B82F6";
    const strokeWidth = appearance.strokeWidth !== undefined ? appearance.strokeWidth : 2;
    const opacity = appearance.opacity !== undefined ? appearance.opacity : 1;
    const fontFamily = appearance.fontFamily || "Inter, sans-serif";
    const fontSize = appearance.fontSize || 14;
    const fontWeight = appearance.fontWeight || "normal";
    const textAlign = appearance.textAlign || "left";
    const borderRadius = appearance.borderRadius !== undefined ? appearance.borderRadius : 8;

    // Base container style
    const containerStyle: React.CSSProperties = {
        position: "absolute",
        left: element.x,
        top: element.y,
        width,
        height,
        transform: `rotate(${element.rotation || 0}deg)`,
        zIndex: element.zIndex || 1,
        opacity,
        cursor: "pointer",
        userSelect: "none",
    };

    // Selection border
    const selectionClass = isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-dashed" : "";

    const renderShapeContent = () => {
        const svgProps = {
            width: "100%",
            height: "100%",
            viewBox: `0 0 ${width} ${height}`,
        };

        const shapeProps = {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
        };

        switch (type) {
            case "rectangle":
                return (
                    <svg {...svgProps}>
                        <rect
                            x={strokeWidth / 2}
                            y={strokeWidth / 2}
                            width={width - strokeWidth}
                            height={height - strokeWidth}
                            rx={borderRadius}
                            ry={borderRadius}
                            {...shapeProps}
                        />
                    </svg>
                );
            case "ellipse":
                return (
                    <svg {...svgProps}>
                        <ellipse
                            cx={width / 2}
                            cy={height / 2}
                            rx={(width - strokeWidth) / 2}
                            ry={(height - strokeWidth) / 2}
                            {...shapeProps}
                        />
                    </svg>
                );
            case "diamond":
                const points = `${width / 2},${strokeWidth / 2} ${width - strokeWidth / 2},${height / 2} ${width / 2},${height - strokeWidth / 2} ${strokeWidth / 2},${height / 2}`;
                return (
                    <svg {...svgProps}>
                        <polygon points={points} {...shapeProps} />
                    </svg>
                );
            case "triangle":
                const triPoints = `${width / 2},${strokeWidth / 2} ${width - strokeWidth / 2},${height - strokeWidth / 2} ${strokeWidth / 2},${height - strokeWidth / 2}`;
                return (
                    <svg {...svgProps}>
                        <polygon points={triPoints} {...shapeProps} />
                    </svg>
                );
            case "service-card": {
                const title = (element as any).title || "Service Title";
                const description = (element as any).description || "Service Description";
                const badge = (element as any).badge || "SERVICE";
                return (
                    <div
                        className={`w-full h-full bg-white rounded-lg shadow-md border-l-4 border-blue-500 flex flex-col p-3 transition-shadow hover:shadow-lg ${selectionClass}`}
                        style={{ fontFamily }}
                    >
                        <span className="text-[10px] font-bold text-blue-600 tracking-wider mb-1 uppercase">
                            {badge}
                        </span>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1 leading-snug line-clamp-1">
                            {title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    </div>
                );
            }
            case "database-card": {
                const title = (element as any).title || "Database Title";
                const description = (element as any).description || "Database Description";
                const badge = (element as any).badge || "DATABASE";
                return (
                    <div
                        className={`w-full h-full bg-white rounded-lg shadow-md border-l-4 border-amber-500 flex flex-col p-3 transition-shadow hover:shadow-lg ${selectionClass}`}
                        style={{ fontFamily }}
                    >
                        <span className="text-[10px] font-bold text-amber-600 tracking-wider mb-1 uppercase">
                            {badge}
                        </span>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1 leading-snug line-clamp-1">
                            {title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    </div>
                );
            }
            case "sticky-note": {
                const content = (element as any).content || "";
                return (
                    <div
                        className={`w-full h-full shadow-lg flex flex-col p-4 rotate-1 transition-transform hover:scale-[1.02] ${selectionClass}`}
                        style={{
                            backgroundColor: fillColor === "transparent" ? "#F5A623" : fillColor,
                            color: "#1F2937",
                            fontFamily,
                            borderRadius: 4,
                        }}
                    >
                        <textarea
                            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm font-medium leading-relaxed placeholder-gray-600/50"
                            value={content}
                            readOnly
                            placeholder="Double click to edit..."
                        />
                    </div>
                );
            }
            case "text": {
                const content = (element as any).content || "Double click to edit text";
                return (
                    <div
                        className={`w-full h-full flex items-center justify-center p-1 bg-transparent overflow-hidden ${selectionClass}`}
                        style={{
                            fontFamily,
                            fontSize,
                            fontWeight,
                            textAlign,
                            color: strokeColor || "#1F2937",
                        }}
                    >
                        <div className="w-full break-words">{content}</div>
                    </div>
                );
            }
            case "line":
            case "arrow":
            case "connector": {
                const points = (element as any).points || [
                    { x: 0, y: 0 },
                    { x: width, y: height },
                ];
                const isDash = (element as any).strokeDash;

                // Build SVG path
                let pathD = "";
                if (points.length > 0) {
                    pathD = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 1; i < points.length; i++) {
                        pathD += ` L ${points[i].x} ${points[i].y}`;
                    }
                }

                // Calculate bounds to position path correctly
                return (
                    <svg
                        width={width}
                        height={height}
                        style={{ overflow: "visible", position: "absolute", top: 0, left: 0 }}
                    >
                        <path
                            d={pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isDash ? "5,5" : undefined}
                            markerEnd={type === "arrow" ? "url(#arrowhead)" : undefined}
                        />
                        {type === "arrow" && (
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="8"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
                                </marker>
                            </defs>
                        )}
                    </svg>
                );
            }
            case "image": {
                const src = (element as any).src || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500";
                const altText = (element as any).altText || "Image element";
                return (
                    <img
                        src={src}
                        alt={altText}
                        className={`w-full h-full object-cover rounded-lg shadow-md ${selectionClass}`}
                    />
                );
            }
            case "frame": {
                const label = (element as any).label || "Frame";
                return (
                    <div
                        className={`w-full h-full bg-slate-50/10 border-2 border-slate-300 rounded-lg flex flex-col p-2 select-none pointer-events-none relative ${selectionClass}`}
                    >
                        <div className="absolute -top-6 left-0 bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-t-md">
                            {label}
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div style={containerStyle} onMouseDown={onMouseDown}>
            {/* If shape or custom content, render it */}
            <div className="w-full h-full relative">
                {type !== "service-card" &&
                    type !== "database-card" &&
                    type !== "sticky-note" &&
                    type !== "text" &&
                    type !== "image" &&
                    type !== "frame" &&
                    isSelected && (
                        <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none rounded" />
                    )}

                {renderShapeContent()}

                {/* Comment / Thread Indicator */}
                {hasThread && (
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce z-50">
                        {/* Red Comment Bubble Icon */}
                        <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
