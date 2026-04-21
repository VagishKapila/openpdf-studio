# Day 2 — iOS Safari Test Plan

> Run this protocol on a physical iPhone (Safari + installed PWA) before marking Day 2 complete.
> Android Chrome was validated on Day 2 deploy night. iOS is deferred to next office day.

## Known iOS Safari Risks

### 1. 300 ms Tap Delay
iOS Safari historically adds a 300 ms delay to single taps when `touch-action` is not set.
We set `touch-action: none` on the gesture container — verify this eliminates the delay.

**Fix path:** `apps/pwa/src/components/canvas/CanvasArea.tsx` outer div.

### 2. Pinch-Zoom Conflict with Browser Chrome
iOS Safari intercepts pinch gestures to zoom the entire page unless the viewport
meta tag has `user-scalable=no` or `minimum-scale=1, maximum-scale=1`.

**Current mitigation:** `<meta name="viewport" content="..., user-scalable=no">` in `index.html`.
**Verify:** page chrome (address bar) does NOT resize during in-canvas pinch.

### 3. Touch Coordinate Origin
iOS may report touch coordinates relative to the visual viewport (after browser zoom),
not the layout viewport. This can cause pinch origin to appear offset.

**Fix path (if needed):** `apps/pwa/src/hooks/ios/useDocumentGesturesIOS.ts` — isolation file.

### 4. `translate3d` Flicker
Some iOS versions flicker when `willChange: transform` is applied to elements
that share a compositing layer with fixed-position siblings.

**Fix path:** promote AppHeader/MobileToolbar to `will-change: transform` too,
or use `isolation: isolate` on the shell wrapper.

### 5. PWA vs Browser Differences
Installed PWA (`display: standalone`) may behave differently from Safari browser tab —
specifically, safe-area-insets and keyboard-avoidance.

**Verify both:** Safari tab AND Home Screen icon launch.

### 6. Passive Listener Rejection
`@use-gesture/react` passes `{ passive: false }` to `addEventListener`. iOS 13+ may
log warnings if wheel events are non-passive. Confirm no console errors.

---

## 12-Point Test Protocol

| # | Check | Safari tab | PWA (standalone) |
|---|-------|-----------|-----------------|
| 1 | App loads without white flash | ☐ | ☐ |
| 2 | "Open" button opens file picker | ☐ | ☐ |
| 3 | PDF renders on first page | ☐ | ☐ |
| 4 | Pinch-to-zoom: canvas scales, NOT page chrome | ☐ | ☐ |
| 5 | Pinch zoom stays in 0.5×–5× bounds | ☐ | ☐ |
| 6 | Drag-to-pan works when scale > 1.05 | ☐ | ☐ |
| 7 | Double-tap resets to 1× | ☐ | ☐ |
| 8 | "1:1" badge appears when zoomed, disappears at reset | ☐ | ☐ |
| 9 | Header / toolbar / page-nav do NOT move during zoom | ☐ | ☐ |
| 10 | No console errors (passive listener, CORS, etc.) | ☐ | ☐ |
| 11 | Safe-area-inset respected (no buttons behind notch) | ☐ | ☐ |
| 12 | Multi-page navigation works (Prev / Next dots) | ☐ | ☐ |

---

## Isolation Architecture

All iOS-specific workarounds MUST go in a dedicated file:

```
apps/pwa/src/hooks/ios/
  useDocumentGesturesIOS.ts   ← iOS override of useDocumentGestures
  index.ts                    ← re-exports useDocumentGestures with iOS sniff
```

The main `useDocumentGestures.ts` must remain unchanged. iOS branching is done by
the barrel `index.ts` detecting `navigator.userAgent` — so CI/Android are never
affected by iOS patches.
