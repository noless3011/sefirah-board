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

## Setup & Installation

From the root of the repository, you can install the dependencies for all applications and packages at once:

```bash
npm install
```

## Running Locally

Because this is a monorepo, you can run the applications from their respective directories. You will typically need two terminal sessions.

**Terminal 1: Start the Backend**

```bash
cd apps/backend
npx ts-node index.js # Or configure a 'dev'/'start' script in your package.json
```

**Terminal 2: Start the Frontend**

```bash
cd apps/frontend
npm run dev
```

The frontend will start a local dev server (usually at `http://localhost:5173`).

## Building for Production

To build the project for production:

```bash
# Build Frontend
cd apps/frontend
npm run build

# Build Backend
cd apps/backend
# Ensure a build script (e.g., tsc) is configured in your package.json
npm run build
```

## Documentation & Models

- [API Documentation (`API.md`)](./API.md) — Exhaustive REST API endpoints and WebSocket event specifications.
- [Shared Models (`packages/shared/Models.ts`)](./packages/shared/Models.ts) — Source-of-truth TypeScript definitions for the entire application, including the canvas, boards, users, and real-time events.
- [Contribution Guidelines (`COMMIT.md`)](./COMMIT.md) — Workflow instructions, branch naming conventions, and the pull-request process.

## Contributing Workflow

We follow an established git flow for contributing. Please refer to [COMMIT.md](./COMMIT.md) for full details.

1. Switch to and pull the `develop` branch.
2. Create a new branch following the format: `<type>/<description-of-changes>`, for example, `feat/add-new-login-page`. Types include `feat`, `fix`, `refactor`, `style`, `docs`, `perf`, `test`, `chore`.
3. Commit and push your changes to your branch.
4. Create a Pull Request into `develop`.
5. Request a review from maintaining members before merging. Do not merge your own PRs without approval.
