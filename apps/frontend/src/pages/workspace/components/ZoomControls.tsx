import React from "react";

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
}) => {
    const displayZoom = Math.round(zoom * 100);

    return (
        <div className="flex items-center bg-white rounded-lg shadow-lg border border-slate-100 p-1 select-none">
            {/* Minus Button */}
            <button
                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                onClick={onZoomOut}
                title="Zoom Out"
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
            </button>

            {/* Percentage Display */}
            <button
                className="px-2 text-xs font-semibold text-slate-700 hover:text-blue-500 cursor-pointer min-w-[56px] text-center"
                onClick={onResetZoom}
                title="Reset Zoom"
            >
                {displayZoom}%
            </button>

            {/* Plus Button */}
            <button
                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                onClick={onZoomIn}
                title="Zoom In"
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
    );
};
export default ZoomControls;
