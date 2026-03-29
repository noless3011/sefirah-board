// =============================================================================
// SEFIRAH BOARD — TypeScript Models (v2)
// Domains: Auth · User · Board · Templates · Collaboration · Canvas ·
//          History · Threads/Chat · WebSocket · UI State
// =============================================================================
import {z} from 'zod'
// =============================================================================
// 1. SHARED / PRIMITIVE TYPES
// =============================================================================

/** ISO 8601 datetime string, e.g. "2024-11-01T12:00:00.000Z" */
export const ISODateStringSchema = z.iso.datetime();
export type ISODateString = z.infer<typeof ISODateStringSchema>;

/** UUID v4 string */
export const UUIDSchema = z.uuid();
export type UUID = z.infer<typeof UUIDSchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/** * Generic Zod schema builder for PaginatedResponse.
 * Usage: const UsersPaginatedSchema = PaginatedResponseSchema(UserSchema);
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

/** * Generic Zod schema builder for ApiResponse.
 * Usage: const AuthResponseApiSchema = ApiResponseSchema(AuthResponseSchema);
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  statusCode: z.number().int().positive(),
  error: z.string(),
  message: z.string(),
  /** Field-level validation errors, keyed by field name */
  details: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// =============================================================================
// 2. AUTH DOMAIN — /api/v1/auth
// =============================================================================

export const AuthUserSchema = z.object({
  id: UUIDSchema,
  email: z.email(),
  fullName: z.string().min(1, "Full name is required"),
  avatarUrl: z.url().nullable(),
  createdAt: ISODateStringSchema,
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** POST /api/v1/auth/register */
export const RegisterPayloadSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

/**
 * POST /api/v1/auth/login
 * rememberMe: true extends refresh token TTL
 */
export const LoginPayloadSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

/** POST /api/v1/auth/oauth/google */
export const GoogleOAuthPayloadSchema = z.object({
  token: z.string().min(1, "OAuth token is required"),
});
export type GoogleOAuthPayload = z.infer<typeof GoogleOAuthPayloadSchema>;

/** POST /api/v1/auth/oauth/github */
export const GitHubOAuthPayloadSchema = z.object({
  code: z.string().min(1, "OAuth code is required"),
});
export type GitHubOAuthPayload = z.infer<typeof GitHubOAuthPayloadSchema>;

/** POST /api/v1/auth/refresh-token */
export const RefreshTokenPayloadSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

/** POST /api/v1/auth/forgot-password */
export const ForgotPasswordPayloadSchema = z.object({
  email: z.email("Invalid email address"),
});
export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordPayloadSchema>;

/**
 * POST /api/v1/auth/reset-password  [NEW]
 */
export const ResetPasswordPayloadSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});
export type ResetPasswordPayload = z.infer<typeof ResetPasswordPayloadSchema>;

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

// =============================================================================
// 3. USER & ACCOUNT SETTINGS DOMAIN — /api/v1/users
// All endpoints require: Authorization: Bearer <accessToken>
// =============================================================================

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  cursorVisibility: z.boolean(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UserSchema = z.object({
  id: UUIDSchema,
  fullName: z.string().min(1, "Full name is required"),
  email: z.email(),
  avatarUrl: z.url().nullable(),
  preferences: UserPreferencesSchema,
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});
export type User = z.infer<typeof UserSchema>;

/** PATCH /api/v1/users/me/profile */
export const UpdateProfilePayloadSchema = z.object({
  fullName: z.string().min(1).optional(),
  avatarUrl: z.url().nullable().optional(),
});
export type UpdateProfilePayload = z.infer<typeof UpdateProfilePayloadSchema>;

/** PUT /api/v1/users/me/password */
export const UpdatePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});
export type UpdatePasswordPayload = z.infer<typeof UpdatePasswordPayloadSchema>;

/** PATCH /api/v1/users/me/preferences */
export const UpdatePreferencesPayloadSchema = z.object({
  emailNotifications: z.boolean().optional(),
  cursorVisibility: z.boolean().optional(),
});
export type UpdatePreferencesPayload = z.infer<typeof UpdatePreferencesPayloadSchema>;

/** DELETE /api/v1/users/me */
export const DeactivateAccountPayloadSchema = z.object({
  password: z.string().min(1, "Password is required to deactivate account"),
});
export type DeactivateAccountPayload = z.infer<typeof DeactivateAccountPayloadSchema>;

// =============================================================================
// 4. BOARD MANAGEMENT DOMAIN — /api/v1/boards
// =============================================================================

export const BoardTypeSchema = z.enum(['personal', 'shared']);
export type BoardType = z.infer<typeof BoardTypeSchema>;

export const BoardStatusSchema = z.enum(['active', 'archived']);
export type BoardStatus = z.infer<typeof BoardStatusSchema>;

export const BoardBadgeSchema = z.enum(['ACTIVE PROJECT', 'REVIEW REQUIRED', 'ARCHIVED']);
export type BoardBadge = z.infer<typeof BoardBadgeSchema>;

export const BoardVisibilitySchema = z.enum(['private', 'shared', 'public']);
export type BoardVisibility = z.infer<typeof BoardVisibilitySchema>;

export const ExportFormatSchema = z.enum(['png', 'pdf', 'svg']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const BoardCollaboratorSummarySchema = z.object({
  userId: UUIDSchema,
  fullName: z.string(),
  avatarUrl: z.url().nullable(),
});
export type BoardCollaboratorSummary = z.infer<typeof BoardCollaboratorSummarySchema>;

export const SharedBySchema = z.object({
  userId: UUIDSchema,
  fullName: z.string(),
  avatarUrl: z.url().nullable(),
});
export type SharedBy = z.infer<typeof SharedBySchema>;

export const BoardSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1, "Board title is required"),
  thumbnailUrl: z.url().nullable(),
  type: BoardTypeSchema,
  status: BoardStatusSchema,
  badge: BoardBadgeSchema.nullable(),
  visibilityIcon: BoardVisibilitySchema,
  ownerId: UUIDSchema,
  templateId: UUIDSchema.nullable(),
  sharedBy: SharedBySchema.nullable(),
  collaborators: z.array(BoardCollaboratorSummarySchema),
  extraCollaboratorsCount: z.number().int().nonnegative(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});
export type Board = z.infer<typeof BoardSchema>;

/** GET /api/v1/boards — query parameters */
export const GetBoardsQuerySchema = z.object({
  type: BoardTypeSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
export type GetBoardsQuery = z.infer<typeof GetBoardsQuerySchema>;

export const GetBoardsResponseSchema = PaginatedResponseSchema(BoardSchema);
export type GetBoardsResponse = z.infer<typeof GetBoardsResponseSchema>;

/** POST /api/v1/boards */
export const CreateBoardPayloadSchema = z.object({
  title: z.string().min(1, "Board title is required"),
  templateId: UUIDSchema.optional(),
});
export type CreateBoardPayload = z.infer<typeof CreateBoardPayloadSchema>;

/** PATCH /api/v1/boards/:boardId */
export const UpdateBoardPayloadSchema = z.object({
  title: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
  badge: BoardBadgeSchema.nullable().optional(),
  visibilityIcon: BoardVisibilitySchema.optional(),
});
export type UpdateBoardPayload = z.infer<typeof UpdateBoardPayloadSchema>;

/** POST /api/v1/boards/:boardId/thumbnail — multipart/form-data */
export const UploadBoardThumbnailPayloadSchema = z.object({
  // Note: Adjust this based on your environment (client vs server)
  file: z.any().refine((val) => val !== undefined && val !== null, "File is required"),
});
export type UploadBoardThumbnailPayload = z.infer<typeof UploadBoardThumbnailPayloadSchema>;

export const UploadBoardThumbnailResponseSchema = z.object({
  thumbnailUrl: z.url(),
});
export type UploadBoardThumbnailResponse = z.infer<typeof UploadBoardThumbnailResponseSchema>;

/** POST /api/v1/boards/:boardId/export */
export const ExportBoardPayloadSchema = z.object({
  format: ExportFormatSchema,
});
export type ExportBoardPayload = z.infer<typeof ExportBoardPayloadSchema>;

export const ExportBoardResponseSchema = z.object({
  downloadUrl: z.url(),
  expiresAt: ISODateStringSchema,
});
export type ExportBoardResponse = z.infer<typeof ExportBoardResponseSchema>;

// =============================================================================
// 5. TEMPLATES DOMAIN — /api/v1/templates  [NEW DOMAIN]
// Corresponds to the Templates page with category filter tabs.
// Templates are read-only; use POST /boards with templateId to create from one.
// =============================================================================

export const TemplateCategorySchema = z.enum([
  'Flowcharts',
  'Brainstorming',
  'Design Systems',
  'Project Management',
  'Agile Frameworks',
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const TemplateSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1, "Template title is required"),
  description: z.string(),
  thumbnailUrl: z.url().nullable(),
  category: TemplateCategorySchema,
  createdAt: ISODateStringSchema,
});
export type Template = z.infer<typeof TemplateSchema>;

/** GET /api/v1/templates — query parameters */
export const GetTemplatesQuerySchema = z.object({
  /** Omit to return all templates (the "All Templates" tab) */
  category: TemplateCategorySchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
export type GetTemplatesQuery = z.infer<typeof GetTemplatesQuerySchema>;

export const GetTemplatesResponseSchema = PaginatedResponseSchema(TemplateSchema);
export type GetTemplatesResponse = z.infer<typeof GetTemplatesResponseSchema>;

export const GetTemplateResponseSchema = TemplateSchema;
export type GetTemplateResponse = z.infer<typeof GetTemplateResponseSchema>;

// =============================================================================
// 6. COLLABORATION & SHARING DOMAIN
// /api/v1/boards/:boardId/collaborators
// =============================================================================

export const CollaboratorRoleSchema = z.enum(['viewer', 'editor']);
export type CollaboratorRole = z.infer<typeof CollaboratorRoleSchema>;

export const CollaboratorSchema = z.object({
  userId: UUIDSchema,
  fullName: z.string().min(1, "Full name is required"),
  email: z.email(),
  avatarUrl: z.url().nullable(),
  role: CollaboratorRoleSchema,
  joinedAt: ISODateStringSchema,
});
export type Collaborator = z.infer<typeof CollaboratorSchema>;

export const GetCollaboratorsResponseSchema = z.array(CollaboratorSchema);
export type GetCollaboratorsResponse = z.infer<typeof GetCollaboratorsResponseSchema>;

/** POST /api/v1/boards/:boardId/collaborators/invite */
export const InviteCollaboratorPayloadSchema = z.object({
  email: z.email("Invalid email address"),
  role: CollaboratorRoleSchema,
});
export type InviteCollaboratorPayload = z.infer<typeof InviteCollaboratorPayloadSchema>;

/**
 * POST /api/v1/boards/:boardId/collaborators/link  [NEW]
 * Generates a shareable invite link/code for the Share modal copy-link flow.
 */
export const GenerateInviteLinkPayloadSchema = z.object({
  role: CollaboratorRoleSchema,
  /** Validity duration in hours. Defaults to 72 if omitted. */
  expiresInHours: z.number().int().positive().optional(),
});
export type GenerateInviteLinkPayload = z.infer<typeof GenerateInviteLinkPayloadSchema>;

export const GenerateInviteLinkResponseSchema = z.object({
  inviteCode: z.string().min(1),
  inviteUrl: z.url(),
  expiresAt: ISODateStringSchema,
});
export type GenerateInviteLinkResponse = z.infer<typeof GenerateInviteLinkResponseSchema>;

/** PATCH /api/v1/boards/:boardId/collaborators/:userId */
export const UpdateCollaboratorRolePayloadSchema = z.object({
  role: CollaboratorRoleSchema,
});
export type UpdateCollaboratorRolePayload = z.infer<typeof UpdateCollaboratorRolePayloadSchema>;

export const UpdateCollaboratorResponseSchema = CollaboratorSchema;
export type UpdateCollaboratorResponse = z.infer<typeof UpdateCollaboratorResponseSchema>;

/** POST /api/v1/invites/redeem — standalone endpoint */
export const RedeemInvitePayloadSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});
export type RedeemInvitePayload = z.infer<typeof RedeemInvitePayloadSchema>;

export const RedeemInviteResponseSchema = z.object({
  board: BoardSchema,
  role: CollaboratorRoleSchema,
});
export type RedeemInviteResponse = z.infer<typeof RedeemInviteResponseSchema>;

// =============================================================================
// 6. CANVAS STATE REST API — /api/v1/boards/:boardId/canvas
// =============================================================================

export const CanvasElementTypeSchema = z.enum([
  'rectangle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'connector',
  'text', 'sticky-note', 'image', 'frame', 'service-card', 'database-card'
]);
export type CanvasElementType = z.infer<typeof CanvasElementTypeSchema>;

export const TextAlignSchema = z.enum(['left', 'center', 'right']);
export type TextAlign = z.infer<typeof TextAlignSchema>;

export const FontWeightSchema = z.enum(['normal', 'medium', 'semibold', 'bold']);
export type FontWeight = z.infer<typeof FontWeightSchema>;

export const CanvasElementAppearanceSchema = z.object({
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  opacity: z.number().min(0).max(1).optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: FontWeightSchema.optional(),
  textAlign: TextAlignSchema.optional(),
  borderRadius: z.number().nonnegative().optional(),
});
export type CanvasElementAppearance = z.infer<typeof CanvasElementAppearanceSchema>;

// Base schema omitting 'type' so we can strictly enforce it in the extended schemas
const BaseCanvasElementSchemaBase = z.object({
  id: UUIDSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  zIndex: z.number().int(),
  isLocked: z.boolean(),
  appearance: CanvasElementAppearanceSchema,
  createdBy: UUIDSchema,
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const TextElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.enum(['text', 'sticky-note']),
  content: z.string(),
});
export type TextElement = z.infer<typeof TextElementSchema>;

export const ServiceCardElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.literal('service-card'),
  badge: z.string(),
  title: z.string(),
  description: z.string(),
});
export type ServiceCardElement = z.infer<typeof ServiceCardElementSchema>;

export const DatabaseCardElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.literal('database-card'),
  badge: z.string(),
  title: z.string(),
  description: z.string(),
});
export type DatabaseCardElement = z.infer<typeof DatabaseCardElementSchema>;

export const ShapeElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.enum(['rectangle', 'ellipse', 'diamond', 'triangle']),
});
export type ShapeElement = z.infer<typeof ShapeElementSchema>;

export const ConnectorElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.enum(['line', 'arrow', 'connector']),
  startElementId: UUIDSchema.optional(),
  endElementId: UUIDSchema.optional(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  strokeDash: z.boolean().optional(),
});
export type ConnectorElement = z.infer<typeof ConnectorElementSchema>;

export const ImageElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.literal('image'),
  src: z.url(),
  altText: z.string().optional(),
});
export type ImageElement = z.infer<typeof ImageElementSchema>;

export const FrameElementSchema = BaseCanvasElementSchemaBase.extend({
  type: z.literal('frame'),
  label: z.string().optional(),
  childElementIds: z.array(UUIDSchema),
});
export type FrameElement = z.infer<typeof FrameElementSchema>;

// The unified CanvasElement schema
export const CanvasElementSchema = z.union([
  TextElementSchema,
  ServiceCardElementSchema,
  DatabaseCardElementSchema,
  ShapeElementSchema,
  ConnectorElementSchema,
  ImageElementSchema,
  FrameElementSchema,
]);
export type CanvasElement = z.infer<typeof CanvasElementSchema>;

// BaseCanvasElement export for cases where you might just need the structure
export type BaseCanvasElement = z.infer<typeof BaseCanvasElementSchemaBase> & {
  type: CanvasElementType;
};

/** GET /api/v1/boards/:boardId/canvas/elements */
export const GetCanvasElementsResponseSchema = z.object({
  boardId: UUIDSchema,
  elements: z.array(CanvasElementSchema),
  lastSavedAt: ISODateStringSchema,
});
export type GetCanvasElementsResponse = z.infer<typeof GetCanvasElementsResponseSchema>;

/** PUT /api/v1/boards/:boardId/canvas/snapshot */
export const SaveCanvasSnapshotPayloadSchema = z.object({
  elements: z.array(CanvasElementSchema),
});
export type SaveCanvasSnapshotPayload = z.infer<typeof SaveCanvasSnapshotPayloadSchema>;

// =============================================================================
// 7. BOARD HISTORY DOMAIN — /api/v1/boards/:boardId/history  [NEW DOMAIN]
// Powers the History panel (clock icon in canvas sidebar).
// Long-term revision browsing and restore. Short-lived in-session undo/redo
// is handled client-side via a local stack — no REST call per keystroke.
// =============================================================================

export const BoardRevisionSchema = z.object({
  id: UUIDSchema,
  boardId: UUIDSchema,
  authorId: UUIDSchema,
  authorName: z.string().min(1),
  /** Element count at this snapshot — shown in History panel */
  elementCount: z.number().int().nonnegative(),
  /** e.g. "Auto-save" or "Restored from revision" */
  description: z.string(),
  createdAt: ISODateStringSchema,
});
export type BoardRevision = z.infer<typeof BoardRevisionSchema>;

export const BoardRevisionDetailSchema = BoardRevisionSchema.extend({
  elements: z.array(CanvasElementSchema),
});
export type BoardRevisionDetail = z.infer<typeof BoardRevisionDetailSchema>;

/** GET /api/v1/boards/:boardId/history — query parameters */
export const GetBoardHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(50).optional(), 
});
export type GetBoardHistoryQuery = z.infer<typeof GetBoardHistoryQuerySchema>;

/** POST /api/v1/boards/:boardId/history/restore */
export const RestoreBoardRevisionPayloadSchema = z.object({
  revisionId: UUIDSchema,
});
export type RestoreBoardRevisionPayload = z.infer<typeof RestoreBoardRevisionPayloadSchema>;

export const RestoreBoardRevisionResponseSchema = z.object({
  revision: BoardRevisionSchema,
  elements: z.array(CanvasElementSchema),
});
export type RestoreBoardRevisionResponse = z.infer<typeof RestoreBoardRevisionResponseSchema>;

// =============================================================================
// 8. ACTIVE THREADS / CHAT DOMAIN — /api/v1/boards/:boardId/threads
// =============================================================================

export const ThreadStatusSchema = z.enum(['open', 'resolved']);
export type ThreadStatus = z.infer<typeof ThreadStatusSchema>;

export const ThreadReplySchema = z.object({
  id: UUIDSchema,
  threadId: UUIDSchema,
  authorId: UUIDSchema,
  authorName: z.string().min(1),
  authorAvatarUrl: z.url().nullable(),
  message: z.string().min(1, "Message cannot be empty"),
  createdAt: ISODateStringSchema,
});
export type ThreadReply = z.infer<typeof ThreadReplySchema>;

export const ThreadSchema = z.object({
  id: UUIDSchema,
  boardId: UUIDSchema,
  /** Canvas element this thread is pinned to (red bubble in Workspace) */
  targetElementId: UUIDSchema,
  authorId: UUIDSchema,
  authorName: z.string().min(1),
  authorAvatarUrl: z.url().nullable(),
  message: z.string().min(1, "Message cannot be empty"),
  status: ThreadStatusSchema,
  replies: z.array(ThreadReplySchema),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});
export type Thread = z.infer<typeof ThreadSchema>;

/** POST /api/v1/boards/:boardId/threads */
export const CreateThreadPayloadSchema = z.object({
  targetElementId: UUIDSchema,
  message: z.string().min(1, "Message cannot be empty"),
});
export type CreateThreadPayload = z.infer<typeof CreateThreadPayloadSchema>;

/** POST /api/v1/boards/:boardId/threads/:threadId/reply */
export const ReplyToThreadPayloadSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});
export type ReplyToThreadPayload = z.infer<typeof ReplyToThreadPayloadSchema>;

/** PATCH /api/v1/boards/:boardId/threads/:threadId */
export const UpdateThreadPayloadSchema = z.object({
  status: z.literal('resolved'),
});
export type UpdateThreadPayload = z.infer<typeof UpdateThreadPayloadSchema>;

// =============================================================================
// 9. WEBSOCKET EVENTS — Namespace: /workspace
// =============================================================================

export enum WsClientEvent {
  JOIN_ROOM      = 'join-room',
  CURSOR_MOVE    = 'cursor-move',
  ELEMENT_CREATE = 'element-create',
  ELEMENT_UPDATE = 'element-update',
  ELEMENT_DELETE = 'element-delete',
}

export const WsClientEventSchema = z.nativeEnum(WsClientEvent);

export enum WsServerEvent {
  USER_JOINED      = 'user-joined',
  USER_LEFT        = 'user-left',
  CURSOR_MOVED     = 'cursor-moved',
  ELEMENT_CREATED  = 'element-created',
  ELEMENT_UPDATED  = 'element-updated',
  ELEMENT_DELETED  = 'element-deleted',
}

export const WsServerEventSchema = z.nativeEnum(WsServerEvent);

export const JoinRoomPayloadSchema = z.object({
  boardId: UUIDSchema,
});
export type JoinRoomPayload = z.infer<typeof JoinRoomPayloadSchema>;

export const UserJoinedPayloadSchema = z.object({
  user: z.object({
    userId: UUIDSchema,
    fullName: z.string(),
    avatarUrl: z.url().nullable(),
  }),
});
export type UserJoinedPayload = z.infer<typeof UserJoinedPayloadSchema>;

export const UserLeftPayloadSchema = z.object({
  userId: UUIDSchema,
});
export type UserLeftPayload = z.infer<typeof UserLeftPayloadSchema>;

export const CursorMovePayloadSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type CursorMovePayload = z.infer<typeof CursorMovePayloadSchema>;

export const CursorMovedPayloadSchema = z.object({
  userId: UUIDSchema,
  userName: z.string(),
  x: z.number(),
  y: z.number(),
});
export type CursorMovedPayload = z.infer<typeof CursorMovedPayloadSchema>;

/**
 * Zod equivalent for Partial<Omit<CanvasElement, 'id' | 'type' | 'createdBy' | 'createdAt' | 'updatedAt'>>
 * Combines all mutable properties across all element types.
 */
export const CanvasElementChangesSchema = z.object({
  // Base properties
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().int().optional(),
  isLocked: z.boolean().optional(),
  appearance: CanvasElementAppearanceSchema.optional(),
  
  // Type-specific properties
  content: z.string().optional(),
  badge: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  startElementId: UUIDSchema.optional(),
  endElementId: UUIDSchema.optional(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  strokeDash: z.boolean().optional(),
  src: z.url().optional(),
  altText: z.string().optional(),
  label: z.string().optional(),
  childElementIds: z.array(UUIDSchema).optional(),
}).strict(); // Ensures clients can't inject random fields

export type CanvasElementChanges = z.infer<typeof CanvasElementChangesSchema>;

export const ElementCreatePayloadSchema = z.object({ element: CanvasElementSchema });
export type ElementCreatePayload = z.infer<typeof ElementCreatePayloadSchema>;

export const ElementCreatedPayloadSchema = z.object({ element: CanvasElementSchema });
export type ElementCreatedPayload = z.infer<typeof ElementCreatedPayloadSchema>;

export const ElementUpdatePayloadSchema = z.object({
  id: UUIDSchema,
  changes: CanvasElementChangesSchema,
});
export type ElementUpdatePayload = z.infer<typeof ElementUpdatePayloadSchema>;

export const ElementUpdatedPayloadSchema = z.object({
  id: UUIDSchema,
  changes: CanvasElementChangesSchema,
});
export type ElementUpdatedPayload = z.infer<typeof ElementUpdatedPayloadSchema>;

export const ElementDeletePayloadSchema = z.object({ id: UUIDSchema });
export type ElementDeletePayload = z.infer<typeof ElementDeletePayloadSchema>;

export const ElementDeletedPayloadSchema = z.object({ id: UUIDSchema });
export type ElementDeletedPayload = z.infer<typeof ElementDeletedPayloadSchema>;

// =============================================================================
// 10. DASHBOARD & NAVIGATION UI STATE
// =============================================================================

export const ForgotPasswordPageStateSchema = z.object({
  email: z.email(),
  isSubmitting: z.boolean(),
  isSuccess: z.boolean(),
  error: z.string().nullable(),
});
export type ForgotPasswordPageState = z.infer<typeof ForgotPasswordPageStateSchema>;

export const ResetPasswordPageStateSchema = z.object({
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
  isSubmitting: z.boolean(),
  isSuccess: z.boolean(),
  error: z.string().nullable(),
});
export type ResetPasswordPageState = z.infer<typeof ResetPasswordPageStateSchema>;

export const DashboardViewModeSchema = z.enum(['grid', 'list']);
export type DashboardViewMode = z.infer<typeof DashboardViewModeSchema>;

export const NavTabSchema = z.enum(['Recent', 'Templates', 'Shared']);
export type NavTab = z.infer<typeof NavTabSchema>;

export const NotificationSchema = z.object({
  id: UUIDSchema,
  type: z.enum(['invite', 'comment', 'mention', 'board-update']),
  message: z.string(),
  boardId: UUIDSchema.optional(),
  isRead: z.boolean(),
  createdAt: ISODateStringSchema,
});
export type Notification = z.infer<typeof NotificationSchema>;

// =============================================================================
// 11. CANVAS WORKSPACE UI STATE
// =============================================================================

export const CanvasToolSchema = z.enum([
  'select', 'pen', 'shapes', 'sticky-note', 'text', 'connector', 'history', 'settings'
]);
export type CanvasTool = z.infer<typeof CanvasToolSchema>;

export const CanvasZoomLevelSchema = z.number().positive(); // e.g. 85 = 85%
export type CanvasZoomLevel = z.infer<typeof CanvasZoomLevelSchema>;

/** Right-hand Properties panel state */
export const PropertiesPanelStateSchema = z.object({
  activeTab: z.enum(['PROPERTIES', 'CHAT']),
  selectedElementId: UUIDSchema.nullable(),
  appearance: CanvasElementAppearanceSchema,
});
export type PropertiesPanelState = z.infer<typeof PropertiesPanelStateSchema>;

/** Floating cursor label rendered per collaborator on the canvas */
export const ActiveCursorSchema = z.object({
  userId: UUIDSchema,
  userName: z.string(),
  avatarUrl: z.url().nullable(),
  x: z.number(),
  y: z.number(),
  /** Accent color for the cursor name badge */
  color: z.string(), // Could be refined to z.string().regex(/^#[0-9A-F]{6}$/i) if you strictly use hex colors
});
export type ActiveCursor = z.infer<typeof ActiveCursorSchema>;

/** Mini-map overlay (bottom-right corner of the Workspace) */
export const MinimapStateSchema = z.object({
  viewportX: z.number(),
  viewportY: z.number(),
  viewportWidth: z.number().nonnegative(),
  viewportHeight: z.number().nonnegative(),
  canvasWidth: z.number().nonnegative(),
  canvasHeight: z.number().nonnegative(),
});
export type MinimapState = z.infer<typeof MinimapStateSchema>;

/**
 * In-session undo/redo stack state (client-side only).
 */
export const UndoRedoStateSchema = z.object({
  canUndo: z.boolean(),
  canRedo: z.boolean(),
  stackIndex: z.number().int().nonnegative(),
  stackSize: z.number().int().nonnegative(),
});
export type UndoRedoState = z.infer<typeof UndoRedoStateSchema>;