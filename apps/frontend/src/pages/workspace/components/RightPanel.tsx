import React from "react";
import type { CanvasElement, Thread } from "@sefirah/shared";
import { PropertiesPanel } from "./PropertiesPanel";
import { ChatPanel } from "./ChatPanel";
import { Minimap } from "./Minimap";

interface RightPanelProps {
    activeTab: "PROPERTIES" | "CHAT";
    onTabChange: (tab: "PROPERTIES" | "CHAT") => void;
    selectedElement: CanvasElement | null;
    onElementChange: (changes: Record<string, unknown>) => void;
    threads: Thread[];
    onCreateThread: (targetElementId: string | null, message: string) => void;
    onReplyToThread: (threadId: string, message: string) => void;
    onResolveThread: (threadId: string) => void;
    viewport: { x: number; y: number; zoom: number };
    elements: CanvasElement[];
}

export const RightPanel: React.FC<RightPanelProps> = ({
    activeTab,
    onTabChange,
    selectedElement,
    onElementChange,
    threads,
    onCreateThread,
    onReplyToThread,
    onResolveThread,
    viewport,
    elements,
}) => {
    return (
        <div className="w-[280px] h-full bg-white border-l border-slate-150 flex flex-col justify-between shadow-2xl relative select-none">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-150">
                <button
                    className={`flex-1 text-center py-3 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                        activeTab === "PROPERTIES"
                            ? "text-blue-600 border-b-2 border-blue-500"
                            : "text-slate-400 hover:text-slate-600"
                    }`}
                    onClick={() => onTabChange("PROPERTIES")}
                >
                    PROPERTIES
                </button>
                <button
                    className={`flex-1 text-center py-3 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                        activeTab === "CHAT"
                            ? "text-blue-600 border-b-2 border-blue-500"
                            : "text-slate-400 hover:text-slate-600"
                    }`}
                    onClick={() => onTabChange("CHAT")}
                >
                    CHAT
                </button>
            </div>

            {/* Panel Body Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === "PROPERTIES" ? (
                    <PropertiesPanel
                        selectedElement={selectedElement}
                        onElementChange={onElementChange}
                    />
                ) : (
                    <ChatPanel
                        threads={threads}
                        onCreateThread={onCreateThread}
                        onReplyToThread={onReplyToThread}
                        onResolveThread={onResolveThread}
                        selectedElementId={selectedElement ? selectedElement.id : null}
                    />
                )}
            </div>

            {/* Bottom Minimap Box */}
            <div className="border-t border-slate-100 p-4 bg-white flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                    Navigation Overview
                </span>
                <Minimap elements={elements} viewport={viewport} />
            </div>
        </div>
    );
};
export default RightPanel;
