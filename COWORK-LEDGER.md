# COWORK Ledger — FormIQ (VagishKapila/formiq)

| # | Description | Branch | Status | Notes |
|---|---|---|---|---|
| 40.7 | Repo audit, rename to formiq, archive duplicate | staging | Shipped | Renamed openpdf → formiq, pwa-main frozen as v1.0.1, COWORK-LEDGER created |
| 41 | Auth API wiring — 7-commit functional auth build | staging | Shipped | Types, API client, Zustand persist store, shadcn UI primitives, LoginForm, SignupForm, GoogleButton, GoogleOAuthProvider, AuthDialog, UserMenu, RequireAuth, AppHeader gating |
| 41.A | Premium auth UI + brand identity drop-in | staging | Shipped | Real FormIQ wordmark + icon, cyan/teal/lime palette via brand.ts tokens, glass dialog with brand glow ring, UserMenu, RequireAuth gating, FormIQLogo in header, brand gradient Sign In CTA, favicon + manifest updated |
| 42 | Backend deploy — formiq-backend-staging on Railway | staging | Shipped | Express+TS+Drizzle+JWT+argon2, 10 auth routes, Railway Postgres, healthcheck ok |
| 43 | COWORK-43.A — Varshyl webhook 401 + PWA meta tag + Google OAuth env vars | staging | Shipped | Webhook X-Varshyl-Key fixed, theme-color meta corrected, VITE_GOOGLE_CLIENT_ID set on Railway |
| 44 | COWORK-44 — 5 UX bugs: password toggle, mobile dialog, tooltip toast, annotation flash, sig crop+presets | staging | Shipped | PasswordInput, AuthDialog overflow+padding, Sonner toast, imgCacheRef+cancelled flag, unified crop+S/M/L. Bundle index-BMxiUtmt.js. Layer 9 ✅ |
| 44.A | COWORK-44.A — 6 iPhone Layer 9 bugs: draw drag, annotation persistence, iOS keyboard, header overflow, size presets, crop halo | staging | Shipped | Bug A: draw draggable+dragend point offset. Bug B: SHA-256 deterministic doc ID. Bug C: focusin scrollIntoView(350ms). Bug D: hidden sm:flex/sm:inline header. Bug E: absolute PDF-space widths S=80 M=150 L=240. Bug F: WHITE 240→220. Bundle index-C0IG1bIn.js. Commits: 9882eac(A) 8a44ac2(B) dee7e79(C) 95887db(D) 82ce158(E+F). Layer 9 ✅ $0=0 NaN=0 undefined=0 [object Object]=0 Error:=0 |
