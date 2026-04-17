#!/usr/bin/env node
/**
 * Layer 9 — Real User Testing
 * Live-site health check: broken indicators, expected patterns, critical pages
 * Usage: PRODUCT=snapclaps node live-site-check.js [production|staging]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PRODUCT = process.env.PRODUCT;
const ENV = process.argv[2] || 'production';

if (!PRODUCT) {
  console.error('ERROR: Set PRODUCT env var (e.g. PRODUCT=snapclaps node live-site-check.js)');
  process.exit(1);
}

const configPath = path.join(__dirname, 'configs', `${PRODUCT}.js`);
if (!fs.existsSync(configPath)) {
  console.error(`ERROR: No config found at ${configPath}`);
  process.exit(1);
}

const config = require(configPath);
const baseUrl = config.urls[ENV];
if (!baseUrl) {
  console.error(`ERROR: No URL defined for env "${ENV}" in ${PRODUCT} config`);
  process.exit(1);
}

const screenshotsDir = path.join(__dirname, 'screenshots', PRODUCT);
fs.mkdirSync(screenshotsDir, { recursive: true });

const BROKEN_PATTERNS = [
  { pattern: /\$0\.00\b/, name: '$0.00 price' },
  { pattern: /\bNaN\b/, name: 'NaN value' },
  { pattern: /\bundefined\b/, name: 'undefined value' },
  { pattern: /\[object Object\]/, name: '[object Object]' },
  { pattern: /Error:\s/i, name: 'Error: message' },
  { pattern: /Cannot read prop/i, name: 'Cannot read property' },
  { pattern: /TypeError/i, name: 'TypeError' },
  { pattern: /ReferenceError/i, name: 'ReferenceError' },
  { pattern: /404 Not Found/i, name: '404 Not Found' },
  { pattern: /500 Internal Server/i, name: '500 Internal Server Error' },
  { pattern: /Application error/i, name: 'Application error' },
];

async function checkPage(page, url, label) {
  const result = { url, label, passed: true, issues: [], consoleErrors: [], loadMs: 0 };
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const t0 = Date.now();
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    result.loadMs = Date.now() - t0;
    result.statusCode = resp ? resp.status() : null;

    if (resp && resp.status() >= 400) {
      result.issues.push(`HTTP ${resp.status()} on ${url}`);
      result.passed = false;
    }

    // Wait a bit for JS to render
    await page.waitForTimeout(2000);

    const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');

    // Check broken patterns
    for (const { pattern, name } of BROKEN_PATTERNS) {
      if (pattern.test(bodyText)) {
        const matches = bodyText.match(pattern);
        result.issues.push(`BROKEN: "${name}" found (${matches.length} occurrence(s))`);
        result.passed = false;
      }
    }

    // Check expected patterns
    if (config.expectedPatterns) {
      for (const { pattern, name, minCount } of config.expectedPatterns) {
        const matches = bodyText.match(pattern) || [];
        if (matches.length < (minCount || 1)) {
          result.issues.push(`MISSING PATTERN: "${name}" — found ${matches.length}, expected ${minCount || 1}+`);
          result.passed = false;
        }
      }
    }

    result.consoleErrors = consoleErrors.slice(0, 5); // cap at 5
    if (consoleErrors.length > 0) {
      result.issues.push(`${consoleErrors.length} console error(s): ${consoleErrors[0].substring(0, 100)}`);
    }

  } catch (err) {
    result.loadMs = Date.now() - t0;
    result.issues.push(`LOAD FAILED: ${err.message.substring(0, 150)}`);
    result.passed = false;
  }

  return result;
}

async function run() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  LAYER 9 — REAL USER TESTING`);
  console.log(`  Product : ${config.productName}`);
  console.log(`  Env     : ${ENV}`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`${'='.repeat(60)}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const results = [];
  const pages = config.criticalPages || ['/'];

  for (const pagePath of pages) {
    const url = `${baseUrl}${pagePath}`;
    const label = pagePath === '/' ? 'Homepage' : pagePath;
    console.log(`Checking: ${url}`);

    const page = await context.newPage();
    const result = await checkPage(page, url, label);
    results.push(result);

    // Screenshot
    const screenshotName = pagePath.replace(/\//g, '_').replace(/^_/, '') || 'homepage';
    const shotPath = path.join(screenshotsDir, `${screenshotName}_${result.passed ? 'PASS' : 'FAIL'}.png`);
    try {
      await page.screenshot({ path: shotPath, fullPage: false });
    } catch (e) { /* ignore screenshot errors */ }

    const status = result.passed ? '✅ PASS' : `❌ FAIL`;
    console.log(`  ${status} (${result.loadMs}ms) ${result.issues.length ? '— ' + result.issues[0] : ''}`);
    if (result.issues.length > 1) {
      result.issues.slice(1).forEach(i => console.log(`         ${i}`));
    }

    await page.close();
  }

  await browser.close();

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const allIssues = results.flatMap(r => r.issues.map(i => `[${r.label}] ${i}`));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  DAMAGE REPORT — ${config.productName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Pages checked : ${results.length}`);
  console.log(`  PASS          : ${passed}`);
  console.log(`  FAIL          : ${failed}`);
  console.log(`  Overall       : ${failed === 0 ? '✅ HEALTHY' : '❌ BROKEN'}`);

  if (allIssues.length > 0) {
    console.log(`\n  Issues found:`);
    allIssues.forEach(i => console.log(`    • ${i}`));
  }

  console.log(`\n  Screenshots saved to: screenshots/${PRODUCT}/`);
  console.log(`${'='.repeat(60)}\n`);

  // Save JSON report
  const reportPath = path.join(__dirname, 'reports');
  fs.mkdirSync(reportPath, { recursive: true });
  const report = {
    product: config.productName,
    env: ENV,
    baseUrl,
    testedAt: new Date().toISOString(),
    summary: { total: results.length, passed, failed, healthy: failed === 0 },
    results,
    allIssues,
  };
  const reportFile = path.join(reportPath, `${PRODUCT}-${ENV}-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`  Report saved: ${reportFile}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
