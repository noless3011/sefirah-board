// =============================================================================
// SEFIRAH BOARD — TypeScript Models (v2)
// Domains: Auth · User · Board · Templates · Collaboration · Canvas ·
//          History · Threads/Chat · WebSocket · UI State
// =============================================================================

// =============================================================================
// 1. SHARED / PRIMITIVE TYPES
// =============================================================================

/** ISO 8601 datetime string, e.g. "2024-11-01T12:00:00.000Z" */
export type ISODateString = string;

/** UUID v4 string */
export type UUID = string;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  /** Field-level validation errors, keyed by field name */
  details?: Record<string, string[]>;
}

// =============================================================================
// 2. AUTH DOMAIN — /api/v1/auth
// =============================================================================

export interface AuthUser {
  id: UUID;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: ISODateString;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** POST /api/v1/auth/register */
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

/**
 * POST /api/v1/auth/login
 * rememberMe: true extends refresh token TTL — maps to the "Remember Me"
 * checkbox on the Login page.
 */
export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** POST /api/v1/auth/oauth/google */
export interface GoogleOAuthPayload {
  token: string;
}

/** POST /api/v1/auth/oauth/github */
export interface GitHubOAuthPayload {
  code: string;
}

/** POST /api/v1/auth/refresh-token */
export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** POST /api/v1/auth/forgot-password */
export interface ForgotPasswordPayload {
  email: string;
}

/**
 * POST /api/v1/auth/reset-password  [NEW]
 * Second step of the forgot-password flow. `token` comes from the reset link
 * emailed to the user after POST /forgot-password.
 */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

// =============================================================================
// 3. USER & ACCOUNT SETTINGS DOMAIN — /api/v1/users
// All endpoints require: Authorization: Bearer <accessToken>
// =============================================================================

export interface UserPreferences {
  /** "Email Notifications" toggle — Account Settings > Preferences */
  emailNotifications: boolean;
  /** "Real-time Cursor Visibility" toggle — controls WS cursor-move events */
  cursorVisibility: boolean;
}

export interface User {
  id: UUID;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** PATCH /api/v1/users/me/profile */
export interface UpdateProfilePayload {
  fullName?: string;
  avatarUrl?: string | null;
}

/** PUT /api/v1/users/me/password */
export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** PATCH /api/v1/users/me/preferences */
export interface UpdatePreferencesPayload {
  emailNotifications?: boolean;
  cursorVisibility?: boolean;
}

/** DELETE /api/v1/users/me */
export interface DeactivateAccountPayload {
  password: string;
}

// =============================================================================
// 4. BOARD MANAGEMENT DOMAIN — /api/v1/boards
// =============================================================================

export type BoardType = 'personal' | 'shared';

export type BoardStatus = 'active' | 'archived';

/**
 * Status badge shown on board cards.
 * Visible in Dashboard and Shared page screenshots.
 */
export type BoardBadge =
  | 'ACTIVE PROJECT'
  | 'REVIEW REQUIRED'
  | 'ARCHIVED'
  | (string & {});

/**
 * Icon shown on board cards indicating access level.
 * - 'private'  → lock icon
 * - 'shared'   → people icon
 * - 'public'   → globe icon
 */
export type BoardVisibility = 'private' | 'shared' | 'public';

export type ExportFormat = 'png' | 'pdf' | 'svg';

export interface BoardCollaboratorSummary {
  userId: UUID;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * The person who shared a board with the current user.
 * Populated only when Board.type === 'shared'.
 * Shown on Shared page board cards: "Shared by Sarah Jenkins".
 */
export interface SharedBy {
  userId: UUID;
  fullName: string;
  avatarUrl: string | null;
}

export interface Board {
  id: UUID;
  title: string;
  thumbnailUrl: string | null;
  type: BoardType;
  status: BoardStatus;
  badge: BoardBadge | null;
  visibilityIcon: BoardVisibility;
  ownerId: UUID;
  templateId: UUID | null;
  /** Only present when type === 'shared' */
  sharedBy: SharedBy | null;
  /** Subset of collaborators displayed as avatars on the card */
  collaborators: BoardCollaboratorSummary[];
  /** Count rendered as "+N" beyond the visible avatars */
  extraCollaboratorsCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** GET /api/v1/boards — query parameters */
export interface GetBoardsQuery {
  type?: BoardType;
  search?: string;
  page?: number;
  limit?: number;
}

/** POST /api/v1/boards */
export interface CreateBoardPayload {
  title: string;
  templateId?: UUID;
}

/** PATCH /api/v1/boards/:boardId */
export interface UpdateBoardPayload {
  title?: string;
  isArchived?: boolean;
  badge?: BoardBadge | null;
  visibilityIcon?: BoardVisibility;
}

/** POST /api/v1/boards/:boardId/thumbnail — multipart/form-data */
export interface UploadBoardThumbnailPayload {
  file: File | Blob;
}

/**
 * POST /api/v1/boards/:boardId/export  [NEW]
 * Corresponds to the Export button in the canvas toolbar header.
 */
export interface ExportBoardPayload {
  format: ExportFormat;
}

export interface ExportBoardResponse {
  /** Pre-signed URL for the exported file */
  downloadUrl: string;
  expiresAt: ISODateString;
}

// =============================================================================
// 5. TEMPLATES DOMAIN — /api/v1/templates  [NEW DOMAIN]
// Corresponds to the Templates page with category filter tabs.
// Templates are read-only; use POST /boards with templateId to create from one.
// =============================================================================

export type TemplateCategory =
  | 'Flowcharts'
  | 'Brainstorming'
  | 'Design Systems'
  | 'Project Management'
  | 'Agile Frameworks'
  | (string & {});

export interface Template {
  id: UUID;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  category: TemplateCategory;
  createdAt: ISODateString;
}

/** GET /api/v1/templates — query parameters */
export interface GetTemplatesQuery {
  /** Omit to return all templates (the "All Templates" tab) */
  category?: TemplateCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// 6. COLLABORATION & SHARING DOMAIN
// /api/v1/boards/:boardId/collaborators
// =============================================================================

export type CollaboratorRole = 'viewer' | 'editor';

export interface Collaborator {
  userId: UUID;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: CollaboratorRole;
  joinedAt: ISODateString;
}

/** POST /api/v1/boards/:boardId/collaborators/invite */
export interface InviteCollaboratorPayload {
  email: string;
  role: CollaboratorRole;
}

/**
 * POST /api/v1/boards/:boardId/collaborators/link  [NEW]
 * Generates a shareable invite link/code for the Share modal copy-link flow.
 */
export interface GenerateInviteLinkPayload {
  role: CollaboratorRole;
  /** Validity duration in hours. Defaults to 72 if omitted. */
  expiresInHours?: number;
}

export interface GenerateInviteLinkResponse {
  inviteCode: string;
  inviteUrl: string;
  expiresAt: ISODateString;
}

/** PATCH /api/v1/boards/:boardId/collaborators/:userId */
export interface UpdateCollaboratorRolePayload {
  role: CollaboratorRole;
}

/** POST /api/v1/invites/redeem — standalone endpoint */
export interface RedeemInvitePayload {
  inviteCode: string;
}

export interface RedeemInviteResponse {
  board: Board;
  role: CollaboratorRole;
}

// =============================================================================
// 7. CANVAS STATE REST API — /api/v1/boards/:boardId/canvas
// =============================================================================

export type CanvasElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'connector'
  | 'text'
  | 'sticky-note'
  | 'image'
  | 'frame'
  | 'service-card'   // e.g. "Auth Gateway" in Workspace screenshot
  | 'database-card'; // e.g. "User Registry" in Workspace screenshot

export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface CanvasElementAppearance {
  fillColor?: string;
  strokeColor?: string;
  /** Maps to the Border Width slider in the Properties panel */
  strokeWidth?: number;
  opacity?: number;
  /** e.g. "Manrope SemiBold" — matches Typography dropdown in Properties panel */
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;
  borderRadius?: number;
}

export interface BaseCanvasElement {
  id: UUID;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  isLocked: boolean;
  appearance: CanvasElementAppearance;
  createdBy: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TextElement extends BaseCanvasElement {
  type: 'text' | 'sticky-note';
  content: string;
}

export interface ServiceCardElement extends BaseCanvasElement {
  type: 'service-card';
  badge: string;       // e.g. "SERVICE"
  title: string;       // e.g. "Auth Gateway"
  description: string; // e.g. "Handles JWT, OAuth2 flows"
}

export interface DatabaseCardElement extends BaseCanvasElement {
  type: 'database-card';
  badge: string;       // e.g. "DATABASE"
  title: string;       // e.g. "User Registry"
  description: string; // e.g. "PostgreSQL Instance v15"
}

export interface ShapeElement extends BaseCanvasElement {
  type: 'rectangle' | 'ellipse' | 'diamond' | 'triangle';
}

export interface ConnectorElement extends BaseCanvasElement {
  type: 'line' | 'arrow' | 'connector';
  startElementId?: UUID;
  endElementId?: UUID;
  points: Array<{ x: number; y: number }>;
  /** Dashed connector style visible in the Workspace screenshot */
  strokeDash?: boolean;
}

export interface ImageElement extends BaseCanvasElement {
  type: 'image';
  src: string;
  altText?: string;
}

export interface FrameElement extends BaseCanvasElement {
  type: 'frame';
  label?: string;
  childElementIds: UUID[];
}

export type CanvasElement =
  | TextElement
  | ServiceCardElement
  | DatabaseCardElement
  | ShapeElement
  | ConnectorElement
  | ImageElement
  | FrameElement;

/** GET /api/v1/boards/:boardId/canvas/elements */
export interface GetCanvasElementsResponse {
  boardId: UUID;
  elements: CanvasElement[];
  lastSavedAt: ISODateString;
}

/** PUT /api/v1/boards/:boardId/canvas/snapshot */
export interface SaveCanvasSnapshotPayload {
  elements: CanvasElement[];
}

// =============================================================================
// 8. BOARD HISTORY DOMAIN — /api/v1/boards/:boardId/history  [NEW DOMAIN]
// Powers the History panel (clock icon in canvas sidebar).
// Long-term revision browsing and restore. Short-lived in-session undo/redo
// is handled client-side via a local stack — no REST call per keystroke.
// =============================================================================

export interface BoardRevision {
  id: UUID;
  boardId: UUID;
  authorId: UUID;
  authorName: string;
  /** Element count at this snapshot — shown in History panel */
  elementCount: number;
  /** e.g. "Auto-save" or "Restored from revision" */
  description: string;
  createdAt: ISODateString;
}

export interface BoardRevisionDetail extends BoardRevision {
  elements: CanvasElement[];
}

/** GET /api/v1/boards/:boardId/history — query parameters */
export interface GetBoardHistoryQuery {
  limit?: number; // default 50
}

/** POST /api/v1/boards/:boardId/history/restore */
export interface RestoreBoardRevisionPayload {
  revisionId: UUID;
}

export interface RestoreBoardRevisionResponse {
  revision: BoardRevision;
  elements: CanvasElement[];
}

// =============================================================================
// 9. ACTIVE THREADS / CHAT DOMAIN — /api/v1/boards/:boardId/threads
// =============================================================================

export type ThreadStatus = 'open' | 'resolved';

export interface ThreadReply {
  id: UUID;
  threadId: UUID;
  authorId: UUID;
  authorName: string;
  authorAvatarUrl: string | null;
  message: string;
  createdAt: ISODateString;
}

export interface Thread {
  id: UUID;
  boardId: UUID;
  /** Canvas element this thread is pinned to (red bubble in Workspace) */
  targetElementId: UUID;
  authorId: UUID;
  authorName: string;
  authorAvatarUrl: string | null;
  message: string;
  status: ThreadStatus;
  replies: ThreadReply[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** POST /api/v1/boards/:boardId/threads */
export interface CreateThreadPayload {
  targetElementId: UUID;
  message: string;
}

/** POST /api/v1/boards/:boardId/threads/:threadId/reply */
export interface ReplyToThreadPayload {
  message: string;
}

/** PATCH /api/v1/boards/:boardId/threads/:threadId */
export interface UpdateThreadPayload {
  status: ThreadStatus;
}

// =============================================================================
// 10. WEBSOCKET EVENTS — Namespace: /workspace
// =============================================================================

export enum WsClientEvent {
  JOIN_ROOM      = 'join-room',
  CURSOR_MOVE    = 'cursor-move',
  ELEMENT_CREATE = 'element-create',
  ELEMENT_UPDATE = 'element-update',
  ELEMENT_DELETE = 'element-delete',
}

export enum WsServerEvent {
  USER_JOINED      = 'user-joined',
  USER_LEFT        = 'user-left',
  CURSOR_MOVED     = 'cursor-moved',
  ELEMENT_CREATED  = 'element-created',
  ELEMENT_UPDATED  = 'element-updated',
  ELEMENT_DELETED  = 'element-deleted',
}

export interface JoinRoomPayload    { boardId: UUID; }
export interface UserJoinedPayload  { user: { userId: UUID; fullName: string; avatarUrl: string | null; }; }
export interface UserLeftPayload    { userId: UUID; }

/** Throttled at ~50ms via lodash.throttle before emitting */
export interface CursorMovePayload  { x: number; y: number; }
export interface CursorMovedPayload { userId: UUID; userName: string; x: number; y: number; }

export type CanvasElementChanges = Partial<
  Omit<CanvasElement, 'id' | 'type' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;

export interface ElementCreatePayload  { element: CanvasElement; }
export interface ElementCreatedPayload { element: CanvasElement; }
export interface ElementUpdatePayload  { id: UUID; changes: CanvasElementChanges; }
export interface ElementUpdatedPayload { id: UUID; changes: CanvasElementChanges; }
export interface ElementDeletePayload  { id: UUID; }
export interface ElementDeletedPayload { id: UUID; }

/** Typed event maps for socket.io-client */
export interface ServerToClientEvents {
  [WsServerEvent.USER_JOINED]:     (payload: UserJoinedPayload)    => void;
  [WsServerEvent.USER_LEFT]:       (payload: UserLeftPayload)      => void;
  [WsServerEvent.CURSOR_MOVED]:    (payload: CursorMovedPayload)   => void;
  [WsServerEvent.ELEMENT_CREATED]: (payload: ElementCreatedPayload) => void;
  [WsServerEvent.ELEMENT_UPDATED]: (payload: ElementUpdatedPayload) => void;
  [WsServerEvent.ELEMENT_DELETED]: (payload: ElementDeletedPayload) => void;
}

export interface ClientToServerEvents {
  [WsClientEvent.JOIN_ROOM]:      (payload: JoinRoomPayload)      => void;
  [WsClientEvent.CURSOR_MOVE]:    (payload: CursorMovePayload)    => void;
  [WsClientEvent.ELEMENT_CREATE]: (payload: ElementCreatePayload) => void;
  [WsClientEvent.ELEMENT_UPDATE]: (payload: ElementUpdatePayload) => void;
  [WsClientEvent.ELEMENT_DELETE]: (payload: ElementDeletePayload) => void;
}

// =============================================================================
// 11. DASHBOARD & NAVIGATION UI STATE
// =============================================================================

export type DashboardViewMode = 'grid' | 'list';

export type NavTab = 'Recent' | 'Templates' | 'Shared';

export interface Notification {
  id: UUID;
  type: 'invite' | 'comment' | 'mention' | 'board-update';
  message: string;
  boardId?: UUID;
  isRead: boolean;
  createdAt: ISODateString;
}

// =============================================================================
// 12. CANVAS WORKSPACE UI STATE
// =============================================================================

export type CanvasTool =
  | 'select'
  | 'pen'
  | 'shapes'
  | 'sticky-note'
  | 'text'
  | 'connector'
  | 'history'
  | 'settings';

export type CanvasZoomLevel = number; // e.g. 85 = 85%

/** Right-hand Properties panel state */
export interface PropertiesPanelState {
  activeTab: 'PROPERTIES' | 'CHAT';
  selectedElementId: UUID | null;
  appearance: CanvasElementAppearance;
}

/** Floating cursor label rendered per collaborator on the canvas */
export interface ActiveCursor {
  userId: UUID;
  userName: string;
  avatarUrl: string | null;
  x: number;
  y: number;
  /** Accent color for the cursor name badge */
  color: string;
}

/** Mini-map overlay (bottom-right corner of the Workspace) */
export interface MinimapState {
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * In-session undo/redo stack state (client-side only).
 * Short-lived Ctrl+Z / Ctrl+Y — not persisted to REST History API.
 * Maps to the undo/redo arrows visible in the canvas toolbar header.
 */
export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  stackIndex: number;
  stackSize: number;
}