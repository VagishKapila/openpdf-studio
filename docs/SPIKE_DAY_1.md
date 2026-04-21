# Spike — Day 1 Results

**Date:** April 21, 2026
**Engineer:** Claude (Cowork session)

## ✅ DEPLOYED

**Live URL (canonical):** https://openpdf-studio-production-462c.up.railway.app
**GitHub:** https://github.com/VagishKapila/openpdf-studio (public, branch: `pwa-main`)
**Host:** Railway — project `openpdf-pwa`, service `openpdf-studio`
**Auto-deploy:** ⚠️ — Railway webhook fires on most pushes to `pwa-main` but is
unreliable (see `docs/TECH_DEBT.md` TD-008). Use `pnpm deploy` after every push.

> **Note:** The original Day 1 spike deployed to Vercel at `openpdf-spike.vercel.app`
> and later to a short-lived Railway URL (`pwa-production-d532.up.railway.app`).
> Both are defunct. The canonical URL above is the only live endpoint.

---

## Build results — Day 1

| Item | Status |
|---|---|
| pnpm workspaces monorepo | ✅ |
| React 19 + Vite 5.4 + TypeScript 5.7 | ✅ |
| Tailwind CSS v4 (`@theme` tokens, navy/amber palette) | ✅ |
| VitePWA (service worker, manifest, icons) | ✅ |
| PDF.js 4.x rendering (no CDN — fully local worker) | ✅ |
| DPR-aware canvas scaling (retina/HiDPI) | ✅ |
| Viewport-width responsive scaling | ✅ |
| Prev/Next page navigation + dot indicator | ✅ |
| TypeScript: zero errors | ✅ |
| Vite production build: passes | ✅ |
| Live site DOM check: zero broken indicators | ✅ |

## Layer 9 automated check (Headless — Day 1)

```
title:        "OpenPDF Studio"    ✅
canvas:       present             ✅
Prev button:  present             ✅
Next button:  present             ✅
Broken indicators ($0, NaN, etc): 0  ✅
```

## Layer 9 manual checklist — run on real phone

- [ ] PDF renders, legible, not blurry (iPhone Safari)
- [ ] PDF renders, legible, not blurry (Android Chrome)
- [ ] Prev/Next navigation works
- [ ] Pinch zoom works natively (browser gesture)
- [ ] No console errors (Safari remote devtools / chrome://inspect)
- [ ] Install to Home Screen works (iOS: Share → Add to Home Screen)
- [ ] PWA launches without browser chrome
- [ ] Pinch zoom holds after release (doesn't snap back)

## Build output notes

- `pdf.worker.min.mjs`: 1.4 MB (expected — Day 4: lazy-load)
- `vite-plugin-pwa` Rolldown notice: harmless, service worker correct

## Decision for Day 2

✅ **Proceed to gesture-based zoom**
- `@use-gesture/react` already installed
- Day 2: add precise pinch state + transform overlay
- Day 3: local file picker (`<input accept=".pdf">`)
- Day 4: re-render on window resize

## Deployment infrastructure (Day 1 → Day 2)

| | Day 1 | Day 2+ |
|---|---|---|
| Host | Vercel → Railway | Railway |
| Repo | VagishKapila/openpdf | VagishKapila/openpdf-studio |
| Branch | main | pwa-main |
| Deploy | Auto (Vercel) | `pnpm deploy` (push + Railway API trigger) |

---

## Day 2 + 2.1 — Custom Gesture Layer ✅

**Shipped:** 2026-04-21
**Commit:** `ad46e09`
**Live URL:** https://openpdf-studio-production-462c.up.railway.app

### What shipped

- `@use-gesture/react` pinch zoom, pan, double-tap reset
- Fit-to-width on initial PDF load (`scale=1` → canvas fills container)
- Zoom origin math: document stays under fingers during pinch
  (`tx_new = tx_old × k + (pinchX − cW/2) × (1 − k)`)
- CSS transform uses `scale` directly — `renderedScale` is purely a render-quality budget
- App chrome stays at 1:1 scale at all times (header, toolbar, page nav outside gesture layer)
- 6-button mobile toolbar (Select, Text, Draw, Highlight, Sign, More)
- 1:1 reset button appears only when `scale > 1.05`
- Hi-res re-render triggered when zoom exceeds 1.25× of last rendered scale
- Resize listener re-renders canvas on orientation change

### Playwright verification — 8/8 PASS

| Check | Result |
|---|---|
| `touch-action: none` on gesture container | ✅ |
| Canvas inside gesture container | ✅ |
| App chrome NOT inside gesture container | ✅ |
| 1:1 reset button absent at scale=1 | ✅ |
| Mobile toolbar has exactly 6 buttons | ✅ |
| 5 primary tool labels present | ✅ |
| More button present | ✅ |
| `scale(1)` in initial CSS transform (fit-to-width) | ✅ |

### iOS verification — PENDING office day

See `docs/DAY_2_IOS_TEST_PLAN.md` for the 12-point iOS test protocol.

### Day 3 unblocked

File picker (open local PDF) + basic thumbnail sidebar.
Platform-agnostic work, Android-testable in isolation.
