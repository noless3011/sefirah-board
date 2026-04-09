# Sefirah Board

A real-time collaborative whiteboarding and canvas application. This repository is structured as a monorepo containing a Node/TypeScript backend, a Vite + React frontend, and shared data models.

## Project Structure

This project uses npm workspaces to manage multiple packages:

- `apps/frontend/` — Vite + React TypeScript application.
- `apps/backend/` — Node/TypeScript backend powered by Express and Socket.io.
- `packages/shared/` — Shared TypeScript models and API types used by both frontend and backend.
- `design/` — Design assets and resources.

## Key Features

- **Real-time Collaboration:** Collaborative canvas with live cursor syncing via WebSocket.
- **Canvas Workspaces:** Create frames, sticky notes, database/service architecture cards, shapes, images, and smart connectors.
- **Board Management:** Personal and shared boards, custom templates, and access control (viewer/editor roles).
- **History & Revisions:** Browse history snapshots and restore to previous states.
- **Chat & Threads:** Pin contextual conversation threads directly onto canvas elements.

## Prerequisites

- Node.js (LTS recommended)
- npm (version 7+ to support workspaces)
- PostgreSQL database

## Setup Guide

### 1. Install dependencies

From the root of the repository, you can install the dependencies for all applications and packages at once:

```bash
npm install
```

### 2. Configure backend environment

Create a local backend env file from the example:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Then update `apps/backend/.env` with real values:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` and `CLIENT_URL` (for single-port mode use `http://localhost:4000`)
- `ENABLE_FE_PROXY=true` and `FRONTEND_DEV_URL=http://localhost:5173` (to proxy frontend dev server through backend)
- OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) if using social login. Could be ignore if we are not trying to setup oauth

### 3. Configure frontend environment

Create `apps/frontend/.env` only if you need to override defaults:

```env
VITE_API_URL=/api/v1
VITE_WS_URL=/workspace
```

If these values are omitted, frontend defaults to same-origin (`/api/v1` and `/workspace`).

### 4. Run database migrations

```bash
cd apps/backend
npx prisma migrate deploy
```

For local schema changes, use:

```bash
npx prisma migrate dev
```

### 5. Run locally

Start both apps from the repository root:

```bash
npm run dev
```

- Public entrypoint: `http://localhost:4000`
- Backend serves API at `http://localhost:4000/api/v1`
- Backend reverse-proxies all non-API traffic to Vite (`http://localhost:5173`) when `ENABLE_FE_PROXY=true`
- Socket.io namespace is available at `/workspace` on the same origin
- Vite dev server is pinned to port `5173` for stable proxy routing

You can still run each app separately with:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Building for Production

To build the project for production from repository root:

```bash
npm run build
```

To run production backend (serves API and static frontend build on the same port):

```bash
npm run start
```

## Documentation & Models

- [API Documentation (`API.md`)](./API.md) — Exhaustive REST API endpoints and WebSocket event specifications.
- [OAuth Setup Guide (`OAUTH_SETUP.md`)](./OAUTH_SETUP.md) — Environment variables, provider console setup (Google/GitHub), backend OAuth flows, and verification steps.
- [Shared Models (`packages/shared/Models.ts`)](./packages/shared/Models.ts) — Source-of-truth TypeScript definitions for the entire application, including the canvas, boards, users, and real-time events.
- [Contribution Guidelines (`COMMIT.md`)](./COMMIT.md) — Workflow instructions, branch naming conventions, and the pull-request process.

## Contributing Workflow

We follow an established git flow for contributing. Please refer to [COMMIT.md](./COMMIT.md) for full details.

1. Switch to and pull the `develop` branch.
2. Create a new branch following the format: `<type>/<description-of-changes>`, for example, `feat/add-new-login-page`. Types include `feat`, `fix`, `refactor`, `style`, `docs`, `perf`, `test`, `chore`.
3. Commit and push your changes to your branch.
4. Create a Pull Request into `develop`.
5. Request a review from maintaining members before merging. Do not merge your own PRs without approval.
