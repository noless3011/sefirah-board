# OAuth Setup Guide

This guide documents how to configure OAuth for the current Sefirah backend implementation.

## Scope

- Implemented providers: Google and GitHub
- Backend OAuth endpoints:
  - `POST /api/v1/auth/oauth/google`
  - `POST /api/v1/auth/oauth/github`
- Backend location: `apps/backend`

## 1) Required Environment Variables

Create or update `apps/backend/.env` (copy from `apps/backend/.env.example` if needed):

```env
PORT=4000
NODE_ENV=development

# Must match your frontend origin in development (for Vite default use 5173)
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_strong_refresh_secret

GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
GOOGLE_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
```

Notes:

- `JWT_SECRET` is required.
- `JWT_REFRESH_SECRET` is strongly recommended. If missing, code falls back to a weak default.
- Current Google backend flow validates an ID token and only requires `GOOGLE_CLIENT_ID` at runtime. `GOOGLE_SECRET` is currently not used by backend code.

## 2) Database Preparation

OAuth login creates entries in:

- `User`
- `OAuthAccount`
- `RefreshToken`

Run migrations before testing OAuth:

```bash
cd apps/backend
npx prisma migrate deploy
```

For local development with new schema changes:

```bash
cd apps/backend
npx prisma migrate dev
```

## 3) Google OAuth Setup

### Google Cloud Console

1. Open Google Cloud Console and choose/create a project.
2. Configure OAuth consent screen.
3. Create OAuth client credentials:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5173` (or your frontend dev URL)
   - Authorized redirect URIs:
     - If using Google Identity Services popup + ID token flow, redirect URI may not be required.
4. Copy `Client ID` into `GOOGLE_CLIENT_ID`.
5. Keep `Client Secret` private (`GOOGLE_SECRET`), even if not currently used by backend.

### Frontend -> Backend Contract (Google)

1. Frontend obtains Google ID token from Google Sign-In.
2. Frontend calls:

```http
POST /api/v1/auth/oauth/google
Content-Type: application/json

{
  "token": "<google_id_token>"
}
```

3. Backend verifies token with `google-auth-library`, finds/creates user, links OAuth account, returns app tokens.

Success response shape:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "User Name",
      "avatarUrl": "https://...",
      "createdAt": "ISO-8601"
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

## 4) GitHub OAuth Setup

### GitHub OAuth App

1. Go to GitHub Settings -> Developer settings -> OAuth Apps.
2. Click New OAuth App.
3. Configure:
   - Homepage URL: your frontend URL (example: `http://localhost:5173`)
   - Authorization callback URL: your frontend callback URL (example: `http://localhost:5173/auth/github/callback`)
4. Copy credentials:
   - Client ID -> `GITHUB_CLIENT_ID`
   - Client Secret -> `GITHUB_CLIENT_SECRET`

### Frontend -> Backend Contract (GitHub)

1. Frontend redirects user to GitHub authorize URL.
2. GitHub returns `code` to frontend callback route.
3. Frontend calls backend:

```http
POST /api/v1/auth/oauth/github
Content-Type: application/json

{
  "code": "<github_oauth_code>"
}
```

4. Backend exchanges `code` for GitHub access token, fetches profile + emails, finds/creates user, links OAuth account, returns app tokens.

## 5) Running the App Locally

Start backend:

```bash
cd apps/backend
npm run dev
```

Start frontend (separate terminal):

```bash
cd apps/frontend
npm run dev
```

Default endpoints:

- Backend API base: `http://localhost:4000/api/v1`
- Health check: `GET http://localhost:4000/api/v1/health`

## 6) Quick Manual Verification

### Verify Google endpoint is wired

```bash
curl -X POST http://localhost:4000/api/v1/auth/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"INVALID_OR_TEST_TOKEN"}'
```

Expected: structured validation/auth error (not 404).

### Verify GitHub endpoint is wired

```bash
curl -X POST http://localhost:4000/api/v1/auth/oauth/github \
  -H "Content-Type: application/json" \
  -d '{"code":"INVALID_OR_TEST_CODE"}'
```

Expected: structured validation/auth error (not 404).

## 7) Security Checklist

- Never commit real OAuth client secrets to git.
- Use different OAuth credentials for development/staging/production.
- Keep callback URLs strict and environment-specific.
- Prefer HTTPS in non-local environments.
- Rotate secrets if they are exposed.

## 8) Current Implementation Notes

- OAuth routes are defined in `apps/backend/src/routes/authRoutes.ts`.
- Google token verification and GitHub code exchange live in `apps/backend/src/controllers/authController.ts`.
- API router is mounted at `/api/v1` in `apps/backend/src/index.ts`.
- Frontend OAuth UI/callback handling is not yet implemented in this repository; this guide documents backend integration contracts.