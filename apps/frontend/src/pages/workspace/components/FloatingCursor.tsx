import React from "react";

interface FloatingCursorProps {
    userName: string;
    x: number;
    y: number;
    color: string;
}

export const FloatingCursor: React.FC<FloatingCursorProps> = ({
    userName,
    x,
    y,
    color,
}) => {
    return (
        <div
            className="absolute pointer-events-none select-none z-50 transition-all duration-75 ease-out"
            style={{
                left: x,
                top: y,
            }}
        >
            {/* Cursor Arrow Icon */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    transform: "translate(-3px, -3px)",
                }}
            >
                <path
                    d="M5.65376 12.3825L19.56 5.16376C20.4862 4.6825 21.4888 5.685 21.0075 6.61126L13.7888 20.5175C13.3325 21.3988 12.0625 21.3288 11.705 20.4025L9.69126 15.17L4.45751 13.1563C3.53126 12.7988 3.46126 11.5288 4.34251 11.0725L5.65376 12.3825Z"
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>

            {/* User Name Badge */}
            <div
                className="ml-4 mt-2 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md whitespace-nowrap"
                style={{
                    backgroundColor: color,
                }}
            >
                {userName}
            </div>
        </div>
    );
};
export default FloatingCursor;
