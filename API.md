# Sefirah Board — API Documentation

> Base URL: `/api/v1`
> All protected endpoints require `Authorization: Bearer <accessToken>`.

---

## 1. 🛡️ Domain: Authentication (`/api/v1/auth`)

Handles registration, login, OAuth, and password management.

| Method | Endpoint | Payload (Body) | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | `{ email, password, fullName }` | Register a new account. |
| `POST` | `/login` | `{ email, password, rememberMe?: boolean }` | Standard login. Returns `{ user, accessToken, refreshToken }`. `rememberMe: true` extends refresh token TTL. |
| `POST` | `/oauth/google` | `{ token }` (from Google Auth Provider) | Sign in / register via Google. |
| `POST` | `/oauth/github` | `{ code }` (from GitHub OAuth callback) | Sign in / register via GitHub. |
| `POST` | `/refresh-token` | `{ refreshToken }` | Obtain a new access token when the current one expires. |
| `POST` | `/forgot-password` | `{ email }` | Send a password-reset email containing a reset link/code. |
| `POST` | `/reset-password` | `{ token: string, newPassword: string }` | **[NEW]** Complete the password-reset flow. `token` is extracted from the reset link emailed in the previous step. Returns `{ message: 'Password updated successfully' }`. |

---

## 2. 👤 Domain: User & Account Settings (`/api/v1/users`)

Corresponds to the **Account Settings** page. All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Payload (Body) | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | — | Fetch current user profile. |
| `PATCH` | `/me/profile` | `{ fullName?, avatarUrl? }` | Update Profile Information (name + avatar). |
| `PUT` | `/me/password` | `{ currentPassword, newPassword }` | Change password (Security section). |
| `PATCH` | `/me/preferences` | `{ emailNotifications?: boolean, cursorVisibility?: boolean }` | Update Preferences toggles. |
| `DELETE` | `/me` | `{ password }` (confirmation) | Deactivate / delete the account. |

---

## 3. 🗂️ Domain: Board Management (`/api/v1/boards`)

Corresponds to the **Dashboard** (Recent, Shared, Templates tabs).

| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Query: `?type=personal\|shared`, `&search=`, `&page=1`, `&limit=20` | List boards for the dashboard. Each board object includes `sharedBy`, `badge`, and `visibilityIcon` fields (see Board object below). |
| `POST` | `/` | `{ title: string, templateId?: string }` | **"Create New Board"** button. Optionally initialize from a template. |
| `GET` | `/:boardId` | — | Fetch board metadata (title, permissions, updatedAt). |
| `PATCH` | `/:boardId` | `{ title?, isArchived?, badge?, visibilityIcon? }` | Rename, archive, change badge, or change visibility. |
| `DELETE` | `/:boardId` | — | Delete a board. |
| `POST` | `/:boardId/thumbnail` | `multipart/form-data: file (image)` | Upload a canvas screenshot as the board's thumbnail. Frontend captures the canvas and POSTs here. |
| `POST` | `/:boardId/export` | `{ format: 'png' \| 'pdf' \| 'svg' }` | **[NEW]** Export the board canvas. Returns `{ downloadUrl: string, expiresAt: ISODateString }`. Corresponds to the **Export** button in the canvas toolbar. |

### Board object (response shape)

```json
{
  "id": "uuid",
  "title": "YOLO/VAE Architecture",
  "thumbnailUrl": "https://...",
  "type": "personal | shared",
  "status": "active | archived",
  "badge": "ACTIVE PROJECT | REVIEW REQUIRED | ARCHIVED | null",
  "visibilityIcon": "private | shared | public",
  "ownerId": "uuid",
  "templateId": "uuid | null",
  "sharedBy": { "userId": "uuid", "fullName": "Sarah Jenkins", "avatarUrl": "..." },
  "collaborators": [{ "userId": "...", "fullName": "...", "avatarUrl": "..." }],
  "extraCollaboratorsCount": 2,
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

> **`sharedBy`** is populated only when `type === 'shared'`. It identifies the person who shared the board with the current user (visible on Shared board cards: "Shared by Sarah Jenkins").

---

## 4. 📄 Domain: Templates (`/api/v1/templates`)

**[NEW DOMAIN]** Corresponds to the **Templates** page. Templates are read-only; boards are created from them via `POST /boards` with a `templateId`.

| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Query: `?category=Flowcharts\|Brainstorming\|Design+Systems\|Project+Management\|Agile+Frameworks`, `&search=`, `&page=1` | List available templates. Returns paginated results. Omit `category` to return all (the "All Templates" tab). |
| `GET` | `/:templateId` | — | Fetch a single template's full metadata including description and thumbnail. Used before creating a board from a template. |

### Template object (response shape)

```json
{
  "id": "uuid",
  "title": "Technical System Flow",
  "description": "Map out complex architecture and user logic with precision-aligned connectors...",
  "thumbnailUrl": "https://...",
  "category": "Flowcharts",
  "createdAt": "ISO"
}
```

---

## 5. 🤝 Domain: Collaboration & Sharing (`/api/v1/boards/:boardId/collaborators`)

Corresponds to the **Share** button and the **Redeem Invite** feature.

| Method | Endpoint | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | — | List all members with access to this board. |
| `POST` | `/invite` | `{ email: string, role: 'viewer' \| 'editor' }` | Invite a collaborator by email. |
| `POST` | `/link` | `{ role: 'viewer' \| 'editor', expiresInHours?: number }` | **[NEW]** Generate a shareable invite link/code. Returns `{ inviteCode, inviteUrl, expiresAt }`. Powers the copy-link flow in the Share modal. |
| `PATCH` | `/:userId` | `{ role: 'viewer' \| 'editor' }` | Change a member's role. |
| `DELETE` | `/:userId` | — | Revoke a member's access. |
| `POST` | `/api/v1/invites/redeem` | `{ inviteCode: string }` | (Standalone endpoint) Join a shared board using a code. Corresponds to the **Redeem Invite** card on the Shared page. |

---

## 6. 🎨 Domain: Canvas State REST API (`/api/v1/boards/:boardId/canvas`)

REST endpoints for initial load and periodic auto-save. Real-time sync is handled via WebSocket (see section 8).

| Method | Endpoint | Payload (Body) | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/elements` | — | Load all canvas elements when a user first opens a board. |
| `PUT` | `/snapshot` | `{ elements: CanvasElement[] }` | Auto-save fallback: overwrite the entire canvas state (runs every 1–2 min if WebSocket is unavailable). |

---

## 7. 🕰️ Domain: Board History (`/api/v1/boards/:boardId/history`)

**[NEW DOMAIN]** Corresponds to the **Undo / Redo** arrows in the canvas toolbar header.

| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Query: `?limit=50` | List recent revision snapshots for this board (timestamp + authorId + element count). Used to populate the history panel. |
| `GET` | `/:revisionId` | — | Fetch the full canvas state for a specific revision. Used to preview or restore a past state. |
| `POST` | `/restore` | `{ revisionId: string }` | Restore the board to a past revision. Creates a new revision entry so the action itself is undoable. |

> **Note on undo/redo UX:** Short-lived, in-session undo/redo (Ctrl+Z / Ctrl+Y) is handled client-side via a local history stack and WebSocket `element-update` events — no REST call needed per keystroke. The REST History API backs the **History Panel** (the clock icon in the sidebar) for longer-term revision browsing and restore.

### Revision object (response shape)

```json
{
  "id": "uuid",
  "boardId": "uuid",
  "authorId": "uuid",
  "authorName": "Klein",
  "elementCount": 42,
  "description": "Auto-save",
  "createdAt": "ISO"
}
```

---

## 8. 💬 Domain: Active Threads / Chat (`/api/v1/boards/:boardId/threads`)

Corresponds to the **CHAT** tab and the red comment bubbles pinned to canvas elements.

| Method | Endpoint | Payload (Body) | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | — | Fetch all comment threads on this board. |
| `POST` | `/` | `{ targetElementId: string, message: string }` | Create a new thread pinned to a canvas element (e.g. the "Need to update API docs" sticky note). |
| `POST` | `/:threadId/reply` | `{ message: string }` | Reply within an existing thread. |
| `PATCH` | `/:threadId` | `{ status: 'resolved' }` | Mark a thread as resolved. |

---

## 9. 🚀 Domain: WebSocket Events (Namespace: `/workspace`)

Bidirectional real-time communication via Socket.io. Uses **Emit** (client → server) and **Listen** (server → client) rather than traditional HTTP.

### A. Room Management

| Direction | Event | Payload | Description |
| :--- | :--- | :--- | :--- |
| FE → Server | `join-room` | `{ boardId }` | Join the shared room for a board. Required before any canvas or cursor events. |
| Server → FE | `user-joined` | `{ user: { userId, fullName, avatarUrl } }` | Broadcast to others when a collaborator joins. Triggers avatar display in the canvas header. |
| Server → FE | `user-left` | `{ userId }` | Broadcast when a collaborator disconnects. |

### B. Cursor Sync *(requires "Real-time Cursor Visibility" preference)*

| Direction | Event | Payload | Description |
| :--- | :--- | :--- | :--- |
| FE → Server | `cursor-move` | `{ x: number, y: number }` | Throttled via `lodash.throttle` at ~50ms before sending. |
| Server → FE | `cursor-moved` | `{ userId, userName, x, y }` | Other clients render the floating cursor label (e.g. "Klein", "Sarah", "Alex"). |

### C. Canvas Element Sync

| Direction | Event | Payload | Description |
| :--- | :--- | :--- | :--- |
| FE → Server | `element-create` | `{ element: CanvasElement }` | A new shape, card, or sticky note was drawn. |
| Server → FE | `element-created` | `{ element: CanvasElement }` | Relay new element to all other clients in the room. |
| FE → Server | `element-update` | `{ id, changes: Partial<CanvasElement> }` | An element was moved, resized, or its Properties panel values changed (fill colour, border width, typography). |
| Server → FE | `element-updated` | `{ id, changes }` | Relay update to other clients. |
| FE → Server | `element-delete` | `{ id }` | An element was deleted. |
| Server → FE | `element-deleted` | `{ id }` | Relay deletion to other clients. |