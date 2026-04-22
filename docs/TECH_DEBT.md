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

## TD-008 — Railway GitHub webhook unreliable on pwa-main · med · Day 2.1

**When:** Day 2.1 (2026-04-21)

Railway's GitHub integration auto-deploys on some pushes to `pwa-main` but
silently skips others. Root cause unknown — may be related to commit metadata,
push size, or webhook timing. Confirmed: `579300b` deployed correctly;
`ad46e09` was pushed but Railway never received the trigger and kept serving
the old build until a manual API call forced the redeploy.

**What we gave up:**
- Reliable "push to deploy" flow
- Trust that the live URL reflects the latest commit without a manual check

**Impact right now:**
After every `git push`, there's uncertainty about whether Railway actually
redeployed. Testing against "latest" can mean testing a build that's 1-3
commits behind.

**Mitigation (applied Day 2.2):**
`tools/scripts/deploy.sh` pushes to GitHub AND explicitly triggers a
Railway redeploy via the GraphQL API in one command. Run it instead of
bare `git push`:

```bash
./tools/scripts/deploy.sh
# or
pnpm deploy
```

The underlying Railway call (browser-based, no CLI required):

```graphql
mutation {
  serviceInstanceDeploy(
    serviceId: "065fd211-8a8e-421c-af41-556b72af4b07",
    environmentId: "454461ea-46fd-47c3-af6e-0b87e702153a",
    latestCommit: true
  )
}
```

**When to revisit:**
- If Railway ships a webhook reliability fix
- If we migrate hosting before v1 launch
- If `deploy.sh` itself starts failing — then investigate Railway status directly


---

## TD-009 — GoDaddy API requires 2FA + account tier qualification · low · Day 2.3c

**When:** 2026-04-21

GoDaddy's developer API portal at `developer.godaddy.com/keys` requires step-up
authentication (2FA via SMS) before generating API keys, and production API access
requires one of: 10+ domains on the account, Discount Domain Club membership, or a
Reseller account.

**Impact:** DNS changes for `snaphw.com` (and other GoDaddy-managed Varshyl domains)
require Chrome browser automation against Vagish's authenticated session, or manual
dashboard work at `dcc.godaddy.com/control/dnsmanagement`.

**What was done:** CNAME for `app.snaphw.com` was added via browser automation
(no API needed for a one-off change). The DNS record was created and propagated in <30s.

**When to revisit:**
- If Vagish upgrades to Discount Domain Club (~$15-30/yr — unlocks unlimited production API)
- If domain count grows past 10 on the GoDaddy account
- When choosing a registrar for future Varshyl domains: prefer Cloudflare Registrar or
  Namecheap (both offer free-tier DNS APIs, no account tier requirements)

**Workaround:** Chrome MCP browser automation in Vagish's authenticated GoDaddy session
works fine for occasional DNS changes without any API credentials.
