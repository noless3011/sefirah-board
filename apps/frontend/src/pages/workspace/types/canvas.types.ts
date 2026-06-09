// Re-export shared types and define canvas-specific UI types
import type {
    CanvasElement,
    CanvasElementAppearance,
    CanvasElementType,
    Thread,
    ThreadReply,
    Board,
} from "@sefirah/shared";

// Re-export for convenience
export type {
    CanvasElement,
    CanvasElementAppearance,
    CanvasElementType,
    Thread,
    ThreadReply,
    Board,
};

// ── Tool types (UI-only) ─────────────────────────────────────
export type ToolType =
    | "select"
    | "pen"
    | "shape"
    | "sticky"
    | "text"
    | "connector"
    | "hand"
    | "eraser";

// ── Collaboration (UI-only, derived from socket events) ──────
export interface CollaboratorCursorInfo {
    userId: string;
    userName: string;
    avatarUrl?: string;
    color: string;
    x: number;
    y: number;
}

export interface OnlineCollaborator {
    userId: string;
    fullName: string;
    avatarUrl?: string;
}

// ── Canvas viewport state ────────────────────────────────────
export interface CanvasViewport {
    x: number;
    y: number;
    zoom: number;
}

// ── History action for undo/redo ─────────────────────────────
export interface HistoryEntry {
    type: "add" | "remove" | "update";
    elementsBefore: CanvasElement[];
    elementsAfter: CanvasElement[];
    timestamp: number;
}
