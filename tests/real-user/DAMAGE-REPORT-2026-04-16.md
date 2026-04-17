# Layer 9 Real User Testing — Damage Report
**Date:** 2026-04-16  
**Run by:** Claude (Cowork)  
**Scope:** All active Varshyl products with a live URL

---

## Summary

| Product | URL | Pages Tested | Status | Notes |
|---|---|---|---|---|
| SnapClaps | https://snapclaps.com | 5 | ✅ HEALTHY | All pages load, no broken indicators |
| DocuFlow (marketing) | https://snaphw.com | 1 | ✅ HEALTHY | Landing page clean |
| DocuFlow (dashboard) | https://docpix-dashboard.vercel.app | 1 | ⚠️ FALSE POSITIVE | Login-only SPA, minimal text — expected |
| ConstructInv | constructinv.varshyl.com | 0 | ❌ NO DNS | Domain not in DNS yet; product has no public URL |
| BrandOS | N/A | 0 | ❌ NO URL | No public web URL found |
| Sentio Dev | N/A | 0 | ❌ NO URL | No public web URL found |

---

## Detailed Findings

### SnapClaps — ✅ HEALTHY

**Pages checked:**
- `/` — ✅ PASS (7370ms)
- `/blog` — ✅ PASS (1935ms)
- `/blog/bali-budget-guide.html` — ✅ PASS (1696ms)
- `/blog/error-fares-guide.html` — ✅ PASS (1185ms)
- `/blog/honeymoon-maldives.html` — ✅ PASS (1041ms)

**Broken indicators found:** None  
**Console errors:** None  
**Overall:** Healthy. Blog posts loading correctly. The homepage loads slowly (7.3s) — possible optimization opportunity.

---

### DocuFlow / OpenPDF Studio — ✅ HEALTHY (marketing), ⚠️ Dashboard is login-gated

**snaphw.com (marketing/editor page):**
- `/` — ✅ PASS (1263ms) — Full landing page loads cleanly

**docpix-dashboard.vercel.app (admin dashboard):**
- `/` — ❌ Pattern mismatch — login screen only has 2 occurrences of PDF/document/sign vs threshold of 3. This is a React SPA — the login screen has minimal visible text. **This is a false positive, not a real bug.** Dashboard itself requires auth to test deeper pages.

**Action needed:** Add login flow to dashboard test config to test authenticated pages properly.

---

### ConstructInv — ❌ NO PUBLIC URL

`constructinv.varshyl.com` returns NXDOMAIN — the DNS record doesn't exist. The product has no live public-facing URL yet.

**Action needed:** Deploy the app and set DNS once ready.

---

### BrandOS / Sentio Development — ❌ NOT CHECKED

No known public web URLs for these products. Layer 9 tests cannot run until URLs exist.

---

## Infrastructure Scaffolded

The following `tests/real-user/` structure was added to this repo:

```
tests/real-user/
├── live-site-check.js          # Master test runner (Playwright)
├── package.json                # npm scripts: test:production, test:dashboard, test:all
├── README.md                   # How to run
├── configs/
│   └── docuflow.js             # DocuFlow product config
├── screenshots/                # Pass/Fail screenshots (gitignored)
└── reports/                    # JSON reports (gitignored)

.github/workflows/
└── real-user-test.yml          # Daily CI at 8 AM UTC + runs on push to main
```

To add SnapClaps or ConstructInv tests to their own repos, copy `live-site-check.js` and create a matching config.

---

## What Layer 9 Checks

- HTTP 4xx/5xx on every critical page
- Broken render indicators: `$0.00`, `NaN`, `undefined`, `[object Object]`, `Error:`, `TypeError`, `ReferenceError`
- Expected content patterns (configurable per product)
- Browser console errors
- Page load time (flags slow pages)

---

## Next Actions

1. **SnapClaps** — Investigate 7.3s homepage load time (Railway cold start?)
2. **DocuFlow Dashboard** — Add authenticated test flow to test real dashboard pages
3. **ConstructInv** — No action until product is deployed
4. **BrandOS/Sentio** — No action until live URLs exist
5. **All repos** — Add `tests/real-user/` scaffold (currently only in openpdf-studio)
