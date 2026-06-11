# COWORK-44 — 5 UX Bug Fixes

**Date:** 2026-04-28  
**Branch:** staging  
**Status:** ✅ SHIPPED — Layer 9 PASS

---

## Bugs Fixed

| Bug | Description | Commit |
|-----|-------------|--------|
| Bug 5 | Password show/hide toggle in auth forms | `983bd99b` |
| Bug 4 | Auth dialog overflow at 376px mobile viewport | `a035012f` |
| Bug 3 | "Tap to select" tooltip floats mid-screen | `6f847d3d` |
| Bug 2 | Tool switch loses placed annotations | `cddcb579` |
| Bug 1 | Signature upload too large, no resize | `3d585c0a` |

---

## Diagnoses (reported before fixing)

### Bug 2 — Annotation loss on tool switch
**Root cause:** `AnnotationLayer.tsx` render effect includes `activeTool` in deps. On every tool switch, `layer.destroyChildren()` clears all Konva nodes synchronously. Signature annotations build `Konva.Image` nodes asynchronously via `imgEl.onload`. With no cleanup function, if `activeTool` changed again before `onload` fired, the layer was destroyed a second time — then the stale `onload` fired into the rebuilt layer, adding nodes in the wrong render context (duplicates or missing shapes). No signature appeared until the NEXT re-render.

**Fix:** Added `let cancelled = false` + `return () => { cancelled = true; }` cleanup in the render effect. All `imgEl.onload` callbacks check `if (cancelled) return`. Added `imgCacheRef: Map<string, HTMLImageElement>` to cache resolved image elements — subsequent tool switches draw signatures synchronously with zero flash.

### Bug 3 — Tooltip floats mid-screen
**Root cause:** `CanvasArea.tsx` had a JSX block `{activeTool === 'select' && <div className="pointer-events-none select-none absolute top-2 left-1/2 z-30 ...">}` that re-appeared on every tool-switch to select, positioned at `top-2` of the entire canvas container — mid-screen on mobile, undismissable.

**Fix:** Removed the div entirely. Added a `useEffect` that fires a Sonner toast (`position: 'bottom-center'`, 3s) once per session — gated by `sessionStorage.getItem('formiq-select-hint-seen')` and only when at least one annotation is present.

### Bug 4 — Mobile auth dialog at 376px
**Root cause:** `AuthDialog.tsx` used `px-8` (32px each side = 64px total) inside a `DialogContent` that's `w-full` at 376px viewport. Combined with form elements and the Google OAuth "or" divider, the usable content area of 312px was tight and could clip inputs on very small phones.

**Fix:** Changed both inner divs from `px-8` to `px-5 sm:px-8` (20px on mobile, 32px on desktop). Added `overflow-y-auto max-h-[90dvh]` to the `motion.div` so the dialog scrolls internally on short screens (iPhone SE portrait).

---

## Commits

| SHA | Message |
|-----|---------|
| `983bd99b` | feat(auth): add password show/hide toggle |
| `a035012f` | fix(auth-ui): mobile layout — auth dialog at 376px viewport |
| `6f847d3d` | fix(editor): annotation hint becomes Sonner toast, shown once per session |
| `cddcb579` | fix(annotations): cancel stale onload callbacks on tool switch |
| `3d585c0a` | feat(signature): auto-crop white background + size presets for uploaded signatures |

---

## Layer 9 Evidence

| Check | Result |
|-------|--------|
| New bundle | `index-BMxiUtmt.js` (was `index-CcHF7nF_.js`) ✅ |
| Zero broken indicators ($0, NaN, undefined) | ✅ |
| Eye toggle button in live DOM | `aria-label="Show password"` found ✅ |
| AuthDialog overflow-y-auto present | ✅ |
| Responsive padding divs (px-5) | 2 divs found ✅ |
| formiq-select-hint-seen key in bundle | ✅ |
| Old floating tooltip div removed | ✅ |
| cancelled flag in bundle | ✅ |
| Size preset labels (Small/Medium/Large) in bundle | ✅ |
| sig-size-presets testid in bundle | ✅ |
| Placement size label in bundle | ✅ |
| Google OAuth button visible | ✅ |
| Backend health | `{"ok":true,"db":"connected"}` ✅ |
| Auth regression (register + /auth/me) | 201 + 200 ✅ |
| Production untouched | app.snaphw.com HTTP 200, pwa-main not touched ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/pwa/src/components/auth/PasswordInput.tsx` | **NEW** — Eye/EyeOff toggle wrapping shadcn Input |
| `apps/pwa/src/components/auth/LoginForm.tsx` | Replace `<Input type="password">` → `<PasswordInput>` |
| `apps/pwa/src/components/auth/SignupForm.tsx` | Same — PasswordInput for signup-password |
| `apps/pwa/src/components/auth/AuthDialog.tsx` | px-8 → px-5 sm:px-8 on both inner divs; overflow-y-auto max-h-[90dvh] |
| `apps/pwa/src/components/canvas/CanvasArea.tsx` | Remove floating tooltip div; add sessionStorage-gated toast |
| `apps/pwa/src/components/canvas/AnnotationLayer.tsx` | cancelled flag + imgCacheRef in render effect |
| `apps/pwa/src/components/canvas/SignatureModal.tsx` | Unified white-bg crop; uploadSizePreset S/M/L buttons |

---

## Stop Point

**STOPPED.** All 5 bugs fixed and verified on staging. No promotion to `pwa-main`.
