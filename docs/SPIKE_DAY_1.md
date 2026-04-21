# Spike — Day 1 Results

**Date:** April 21, 2026
**Engineer:** Claude (Cowork session)

## ✅ DEPLOYED

**Live URL:** https://openpdf-spike.vercel.app
**GitHub:** https://github.com/VagishKapila/openpdf (public)
**Vercel project:** vagish-kapilas-projects / openpdf-spike
**Auto-deploy:** ✅ — every push to `main` redeploys automatically (Vercel GitHub integration)

---

## Build results

| Item | Status |
|---|---|
| pnpm workspaces monorepo | ✅ |
| React 19 + Vite 8 + TypeScript strict | ✅ |
| Tailwind CSS v4 (`@theme` tokens, navy/amber palette) | ✅ |
| VitePWA (service worker, manifest, icons) | ✅ |
| PDF.js 4.10 rendering (no CDN — fully local worker) | ✅ |
| DPR-aware canvas scaling (retina/HiDPI) | ✅ |
| Viewport-width responsive scaling | ✅ |
| Prev/Next page navigation + dot indicator | ✅ |
| TypeScript: zero errors | ✅ |
| Vite production build: passes | ✅ |
| Live site DOM check: zero broken indicators | ✅ |
| PDF loads + renders (14 pages detected) | ✅ |

## Layer 9 automated check (Headless — Vercel URL)

```
title:        "OpenPDF Studio"    ✅
canvas:       present             ✅
Prev button:  present             ✅
Next button:  present             ✅
Page count:   "Page 1 of 14"     ✅
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
- React 18 peer dep warnings: harmless (react-konva not updated for React 19 yet)

## Decision for Day 2

✅ **Proceed to gesture-based zoom**
- `@use-gesture/react` already installed
- Day 2: add precise pinch state + transform overlay
- Day 3: local file picker (`<input accept=".pdf">`)
- Day 4: re-render on window resize

## Deployment infrastructure

- **Host:** Vercel (vagish-kapilas-projects team)
- **Trigger:** GitHub push to `main` branch → auto-deploy
- **Build config:**
  - Root dir: `apps/pwa`
  - Build: `cd ../.. && pnpm install && cd apps/pwa && pnpm build`
  - Output: `dist/`
- **No Cloudflare account needed** for the spike
