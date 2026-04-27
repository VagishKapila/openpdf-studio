# FormIQ Backend

Express + TypeScript + PostgreSQL backend for FormIQ v1.1.

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- pnpm 9+

## Local Development

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env with your local Postgres URL and generated JWT secrets

# 2. Generate JWT secrets (run twice for access + refresh)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Install deps
pnpm install

# 4. Run migrations
pnpm db:migrate

# 5. Start dev server (hot reload)
pnpm dev
# Server starts at http://localhost:3001

# 6. Health check
curl http://localhost:3001/health
# → { ok: true, version: "1.0.0", timestamp: "...", db: "connected" }
```

## Running Tests

```bash
pnpm test
```

Tests use mocked DB — no real Postgres needed.

## API Endpoints

| Method | Path             | Auth | Description                        |
|--------|------------------|------|------------------------------------|
| GET    | /health          | No   | Railway healthcheck                |
| POST   | /auth/register   | No   | Create account + get tokens        |
| POST   | /auth/login      | No   | Sign in + get tokens               |
| POST   | /auth/google     | No   | Google OAuth sign-in               |
| POST   | /auth/refresh    | No   | Rotate refresh token               |
| POST   | /auth/logout     | Yes  | Revoke session                     |
| GET    | /auth/me         | Yes  | Get current user                   |

### Response shape (all auth endpoints)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null,
    "companyName": null,
    "emailVerified": false,
    "isSuperAdmin": false
  },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "uuid..."
  }
}
```

### Error shape

```json
{ "error": "Human-readable error message" }
```

## Deployment (Railway)

1. Create a new service in Railway `openpdf-pwa` project
2. Add PostgreSQL plugin — `DATABASE_URL` is auto-set
3. Set env vars:
   - `JWT_ACCESS_SECRET` (64 random hex chars)
   - `JWT_REFRESH_SECRET` (64 different random hex chars)
   - `GOOGLE_CLIENT_ID` (from Google Cloud Console)
   - `FRONTEND_ORIGIN` (staging frontend URL)
   - `NODE_ENV=staging`
4. Set root directory to `apps/backend`
5. Set start command: `pnpm start` (or Railway auto-detects Dockerfile)
6. Verify: `curl https://your-service.up.railway.app/health`

## Database

Migrations run automatically on server startup via `src/db/migrate.ts`.

To generate a new migration after schema changes:
```bash
pnpm db:generate
```
