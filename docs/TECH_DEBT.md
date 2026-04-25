# Tech Debt Log

> Format: `[ID] Title — Severity (low/med/high) — Opened`

---

## TD-001 — Compound index missing for annotations · med · Day 1.75

`StoredAnnotation` has a compound `[documentId+pageNumber]` index referenced in
`getAnnotationsForPage`, but Dexie v4 compound index syntax uses `+`-joined strings
in the schema definition. If the schema string is wrong, queries silently return empty.

**Fix:** add an integration test that inserts an annotation and retrieves it by page.

---

## TD-002 — `useDocumentStore.subscribe` in gesture hook · low · Day 2

`useDocumentGestures.ts` calls `useViewportStore.subscribe` inside the hook body
(not inside a `useEffect`). This creates a new subscription every render and leaks
it. In practice re-renders are rare for this component, but it should be moved into
a `useEffect` with cleanup.

---

## TD-003 — Drag pan has no inertia · low · Day 2

`onDrag` in `useDocumentGestures.ts` updates the offset synchronously on every event.
There is no momentum / inertia when the user lifts their finger mid-swipe. For v1 this
is acceptable; revisit in Day 4.

---

## TD-004 — `renderPdfPage` recreated on every currentPage change · low · Day 1.75

`renderPdfPage` is `useCallback`-wrapped but its dep array includes `doc` and
`currentPage`, meaning a new function reference is created on every page turn.
This is benign but means `useCanvasTransform` re-subscribes on every page.

---

## TD-005 — No error boundary around CanvasArea · med · Day 1.75

If `pdf.getPage()` throws (e.g., corrupted file, out-of-range page), the error
propagates to React and crashes the whole app. Wrap `CanvasArea` in an
`ErrorBoundary` before v1 launch.

---

## TD-006 — `PageNavDock` dots overflow on 100+ page docs · low · Day 1.75

The sliding window shows 7 dots max, but the active dot expands to 20 px width.
On very long documents the window can feel jumpy when near the edges.
Smooth with a CSS transition on `width`.

---

## TD-007 — `lucide-react` version pinned to `^0.511` · low · Day 2

`lucide-react@^1.x` (in the original scaffold) does not yet have stable semver.
Pinned to `^0.511` which ships tree-shakeable named exports. Watch for v1 stable.


---

## ✅ RESOLVED — SW Cache Strategy · Day 10 · `fix(td-002)`

`vite.config.ts` now includes full Workbox cache strategy:
- `precache` all static assets (`**/*.{js,css,html,ico,png,svg,woff2}`)
- `maximumFileSizeToCacheInBytes: 5MB` — eliminates pdf.worker size warning
- `runtimeCaching`: Google Fonts CacheFirst (1-year TTL), app shell NetworkFirst (3s timeout)
- `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`
- `devOptions: { enabled: false }` — no SW interference in dev mode
