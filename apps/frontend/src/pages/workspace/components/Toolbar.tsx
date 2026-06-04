import React from "react";

interface ToolbarProps {
    activeTool: string;
    onToolChange: (tool: string) => void;
    onHistoryClick?: () => void;
    onSettingsClick?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    activeTool,
    onToolChange,
    onHistoryClick,
    onSettingsClick,
}) => {
    const mainTools = [
        {
            id: "select",
            name: "Select",
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 3.473L20 12l-7.705 2.146L16 20.354l-2.354 1L10 15.354 4 18.473V3.473z" />
                </svg>
            ),
        },
        {
            id: "pen",
            name: "Pen",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
            ),
        },
        {
            id: "shape",
            name: "Shapes",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313m0 9v2.25m0-2.25l-2.25-1.313M3 16.5l2.25 1.313M21 16.5l-2.25 1.313M21 16.5v2.25m0-2.25l-2.25-1.313m-9-13.5V3m0 0L9.75 5.25M12 3l2.25 2.25M12 21v-2.25m0 2.25l-2.25-2.25M12 21l2.25-2.25" />
                </svg>
            ),
        },
        {
            id: "sticky",
            name: "Sticky Note",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 19.5l-4.5-3V3.75h9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h6v12.75H9V3.75z" />
                </svg>
            ),
        },
        {
            id: "text",
            name: "Text",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            id: "connector",
            name: "Connector",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 gap-1.5 select-none w-14">
            {/* Drawing/Editing Tools */}
            {mainTools.map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                    <button
                        key={tool.id}
                        onClick={() => onToolChange(tool.id)}
                        className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isActive
                                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                : "text-slate-500 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-800"
                        }`}
                        title={tool.name}
                    >
                        {tool.icon}
                    </button>
                );
            })}

            {/* Separator Divider */}
            <div className="h-[1px] bg-slate-100 mx-2 my-0.5" />

            {/* History Panel Action */}
            <button
                onClick={onHistoryClick}
                className="w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
                title="History"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Settings Panel Action */}
            <button
                onClick={onSettingsClick}
                className="w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
                title="Settings"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    );
};
export default Toolbar;
