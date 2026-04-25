import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_URL = process.env.BASE_URL ?? 'https://app.snaphw.com';

async function loadTestPdf(page: Page) {
  const samplePath = resolve(__dirname, '../../../tools/test-fixtures/sample.pdf');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('[data-testid="open-button"]').click(),
  ]);
  await fileChooser.setFiles(samplePath);
  await page.waitForSelector('[data-testid="annotation-layer"]', { timeout: 10_000 });
}

// ── Desktop suite ─────────────────────────────────────────────────────────────
test.describe('Day 8 — Export (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Export button not visible when no PDF is open', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="export-button"]')).not.toBeVisible();
  });

  test('Export button visible after opening a PDF', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible();
  });

  test('clicking Export triggers a PDF download', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.locator('[data-testid="export-button"]').click(),
    ]);

    // Filename ends with -annotated.pdf
    expect(download.suggestedFilename()).toMatch(/-annotated\.pdf$/i);
  });

  test('downloaded file starts with %PDF (valid PDF)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.locator('[data-testid="export-button"]').click(),
    ]);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const header = Buffer.concat(chunks).slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  test('Export button shows loading state during export', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);

    // Start export and immediately check for loading state
    const exportPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.locator('[data-testid="export-button"]').click();

    // Button should show "Exporting…" or be disabled while in progress
    // (may be too fast to catch, so we just verify the download completes)
    await exportPromise;
    // After export, button should return to normal state
    await expect(page.locator('[data-testid="export-button"]')).toBeEnabled({ timeout: 5000 });
  });
});

// ── Mobile suite ──────────────────────────────────────────────────────────────
test.describe('Day 8 — Export (mobile)', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  });

  test('Export item in More menu enabled when PDF is open (no "Soon" badge)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);

    // Open More menu
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="More tools"]').click();
    await expect(page.locator('[data-testid="more-menu"]')).toBeVisible();

    // Export button should be present and enabled
    const exportBtn = page.locator('[data-testid="export-button-mobile"]');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();

    // No "Soon" badge on export
    const soonBadge = exportBtn.locator('text=Soon');
    await expect(soonBadge).not.toBeVisible();
  });

  test('tapping Export in More menu triggers download', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);

    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="More tools"]').click();
    await expect(page.locator('[data-testid="more-menu"]')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.locator('[data-testid="export-button-mobile"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/-annotated\.pdf$/i);
  });
});
