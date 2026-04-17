# Layer 9 — Real User Testing

Live-site health checks using Playwright. Catches broken indicators ($0, NaN, undefined, [object Object], Error:), missing expected content patterns, console errors, and 4xx/5xx HTTP responses.

## Setup

```bash
cd tests/real-user
npm install playwright
npx playwright install chromium
```

## Run

```bash
# Production (snaphw.com)
PRODUCT=docuflow node live-site-check.js production

# Dashboard (docpix-dashboard.vercel.app)
PRODUCT=docuflow node live-site-check.js dashboard
```

## Adding a new product

1. Create `configs/<product>.js` (copy `configs/docuflow.js` as template)
2. Define `urls`, `expectedPatterns`, `criticalPages`
3. Run: `PRODUCT=<product> node live-site-check.js production`

## Output

- Pass/Fail screenshots → `screenshots/<product>/`
- JSON reports → `reports/<product>-<env>-<timestamp>.json`
