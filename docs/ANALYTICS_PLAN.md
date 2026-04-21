# OpenPDF Studio — Analytics Plan

**Status:** Planned, not built  
**Target build:** Day 4-5 of v1 (after annotation layer lands)  
**Owner:** Vagish Kapila · Varshyl Inc · kapilav@varshyl.com

---

## What Vagish wants to see

1. How many people used the app today (daily active visitors)
2. Which feature is most used (tool_selected counts)
3. Top 10 users and what they did (anonymous UID aggregations)

Reporting cadence: daily, weekly, monthly snapshots.  
Viewer: only Vagish (self-service dashboard).  
Future: API/webhook pull into a Varshyl super-admin dashboard.

---

## Recommended stack

**Plausible Analytics** (plausible.io)

- Privacy-friendly: no cookies, no PII, GDPR-compliant by default
- Tiny client: < 1KB script
- Free tier: 10k pageviews/month (enough for launch)
- Custom events supported
- REST API for pulling data into external dashboards
- Self-hostable later if needed

Alternatives considered and rejected:

| Option | Reason rejected |
|---|---|
| PostHog | Overkill, adds cookies, heavy self-host |
| Mixpanel | Closed-silo API, expensive |
| Google Analytics | Violates privacy-first positioning |
| Custom-built | Too much to build and maintain |

**Decision: Plausible.**

---

## Events to instrument (Day 4-5)

| Event | When | Properties |
|---|---|---|
| `pageview` | Page load (auto) | url |
| `document_opened` | PDF loaded | pageCount, source (file/url) |
| `tool_selected` | Active tool changes | tool |
| `page_navigated` | Prev/Next or thumbnail tap | direction |
| `zoom_interaction` | Pinch or button (debounced 2s) | — |
| `signature_created` | Signature saved | mode |
| `annotation_placed` | Annotation added | type |
| `pdf_exported` | Save/download triggered | — |
| `pwa_installed` | PWA beforeinstallprompt fired | — |

All events include `uid` = anonymous UUID stored in localStorage
(`openpdf_anon_uid`). No accounts. No PII. Privacy-first.

---

## Implementation sketch (Day 4-5)

1. Add Plausible script tag to `apps/pwa/index.html`
2. Create `apps/pwa/src/lib/analytics.ts` with `trackEvent(name, props)` helper
3. Generate anonymous UID in localStorage on first visit
4. Wire `analytics.trackEvent()` into store mutations and gesture hook
5. Wrap every analytics call in try/catch — analytics must **never** break the app

Estimated build time: 2-3 hours.

```typescript
// apps/pwa/src/lib/analytics.ts (sketch)
function getAnonUid(): string {
  const key = 'openpdf_anon_uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(key, uid);
  }
  return uid;
}

export function trackEvent(name: string, props?: Record<string, string | number>): void {
  try {
    (window as unknown as { plausible?: Function }).plausible?.(name, {
      props: { uid: getAnonUid(), ...props },
    });
  } catch {
    // analytics must never break the app
  }
}
```

---

## Varshyl super-admin integration (future)

Plausible exposes a REST API. When Varshyl builds cross-product BI
(separate project, post-launch), it pulls from:

- Plausible API for OpenPDF traffic + events
- Stripe API for revenue (when monetization starts)
- Each product's own analytics endpoint

This is a Varshyl-level initiative, not an OpenPDF feature.

---

## Signup step required before build

Vagish creates a Plausible account at [plausible.io](https://plausible.io)
with email `kapilav@varshyl.com`, adds site `app.snaphw.com` (or canonical
domain), captures the script URL and optional API key.

API key goes in Railway env as `PLAUSIBLE_API_KEY` (future use only —
the frontend script needs no key).

---

© 2026 Vagish Kapila · Varshyl Inc · kapilav@varshyl.com
