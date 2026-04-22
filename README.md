# OpenPDF Studio

Free, private PDF editor. Local-first. No accounts. No uploads.

**Live beta:** https://app.snaphw.com
Fallback: https://openpdf-studio-production-462c.up.railway.app

## Monorepo Structure

- `apps/pwa` — Progressive Web App (primary build target)
- `apps/desktop-placeholder` — placeholder for future desktop migration
- `packages/core` — shared PDF logic, annotation model, types
- `packages/ui` — shared UI components, design tokens

## v1 Scope

10 features. 4 weeks. See `docs/SCOPE_LOCK.md` for details.

## Development

```bash
pnpm install
pnpm dev        # start local dev server
pnpm build      # production build
pnpm typecheck  # TypeScript check
pnpm deploy     # push to pwa-main + trigger Railway redeploy
```

## Deployment

Hosted on Railway (project `openpdf-pwa`, branch `pwa-main`).
Railway's GitHub webhook is unreliable — always use `pnpm deploy`
instead of bare `git push`. See `docs/TECH_DEBT.md` TD-008.

---

© 2026 Vagish Kapila · Varshyl Inc · kapilav@varshyl.com
