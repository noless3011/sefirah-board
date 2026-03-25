# sefirah

A monorepo containing a backend and a Vite + React frontend.

## Project structure

- backend/ — Node/TypeScript backend (see backend/package.json)
- frontend/ — Vite + React TypeScript app (see frontend/package.json)
- design/ — design assets

## Prerequisites

- Node.js (LTS recommended)
- npm or yarn

## Quick start

1. Install dependencies for each package:

```bash
cd backend
npm install

cd ../frontend
npm install
```

2. Run locally (two terminals):

```bash
# Backend
cd backend
npm run dev   # or npm start as defined in backend/package.json

# Frontend
cd frontend
npm run dev
```

3. Build for production:

```bash
cd frontend
npm run build

cd ../backend
npm run build   # if applicable
```

## Notes

- Check each package's `package.json` for exact script names and environment requirements.
- TypeScript config files live in each package (`tsconfig.json`, `tsconfig.app.json`).

## Contributing

- Open an issue or submit a PR. Keep changes focused and add tests when appropriate.

## License

- Add your preferred license file (e.g., LICENSE) to this repository.
