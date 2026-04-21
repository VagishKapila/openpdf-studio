# Contributing to OpenPDF Studio PWA

Thanks for your interest! This document covers the monorepo layout, dev workflow, and
coding conventions for the `pwa-monorepo` branch.

## Repository Layout

```
pwa-monorepo/
├── apps/
│   ├── pwa/            ← main React + Vite PWA (you'll work here most)
│   └── desktop-placeholder/
├── packages/
│   ├── core/           ← shared TypeScript utilities (future)
│   └── ui/             ← shared component primitives (future)
├── docs/               ← architecture notes, test plans, tech debt
├── railway.json        ← Railway deploy config
└── pnpm-workspace.yaml
```

## Prerequisites

- **Node ≥ 22** (`node -v`)
- **pnpm ≥ 9.15** (`pnpm -v` — install via `npm i -g pnpm`)

## Getting Started

```bash
pnpm install
pnpm dev          # Vite dev server at http://localhost:5173
pnpm typecheck    # TypeScript check across all packages
pnpm build        # Production build (apps/pwa/dist/)
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `pwa-main` | Production — Railway auto-deploys on push |
| `pwa-dev`  | Integration — merge feature branches here |
| `feat/*`   | Individual features |

**Never push directly to `pwa-main`.** Open a PR to `pwa-dev` first.

## Coding Conventions

- **TypeScript strict** — no `any`, no `as unknown`, no `@ts-ignore`
- **No barrel re-exports** that break tree-shaking
- **Zustand slices** in `src/store/<name>.ts` — one slice per concern
- **Storage layer** (`src/storage/`) is the only place that imports `db.ts`
- **Hooks** in `src/hooks/` — one concern per file
- **iOS overrides** go in `src/hooks/ios/` and must not touch shared hooks

## Testing

```bash
pnpm --filter @openpdf/pwa test        # Vitest unit tests
pnpm --filter @openpdf/pwa preview     # Serve production build
# Then in a second terminal:
npx playwright test --config apps/pwa/playwright.config.ts
```

## Commit Style

```
feat(day-N): short description
fix(component): what was broken
docs(day-N): what was documented
chore: dependency updates, config changes
```

## Deployment

Railway picks up every push to `pwa-main` automatically.
Check build logs at https://railway.app → `openpdf-pwa` project.
