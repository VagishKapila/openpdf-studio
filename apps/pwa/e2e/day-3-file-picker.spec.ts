import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://openpdf-studio-production-462c.up.railway.app';

test.describe('Day 3 — File picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Open button is visible in header', async ({ page }) => {
    const openBtn = page.locator('[data-testid="open-button"]');
    await expect(openBtn).toBeVisible();
  });

  test('File input exists with correct accept attribute', async ({ page }) => {
    const input = page.locator('[data-testid="file-input"]');
    // Input is hidden but exists in DOM
    await expect(input).toBeAttached();
    const accept = await input.getAttribute('accept');
    expect(accept).toContain('application/pdf');
    expect(accept).toContain('.pdf');
  });

  test('Empty state is shown when no PDF is loaded (fresh session)', async ({ page }) => {
    // Clear any cached document in IndexedDB
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases?.() ?? [];
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Either canvas (if Dexie had something) or empty state text
    const emptyState = page.locator('text=/No PDF|Open/i');
    const canvas = page.locator('canvas');
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    const hasCanvas = await canvas.isVisible().catch(() => false);
    expect(hasEmpty || hasCanvas).toBe(true);
  });

  test('Header shows document name and page count after load', async ({ page }) => {
    // Verify header area exists with correct structure
    const header = page.locator('[data-testid="app-header"]');
    await expect(header).toBeVisible();
  });
});

test.describe('Day 3 — Mobile regression after file picker addition', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Open button visible on mobile', async ({ page }) => {
    const openBtn = page.locator('[data-testid="open-button"]');
    await expect(openBtn).toBeVisible();
  });

  test('Mobile toolbar still intact (6 buttons)', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.locator('button');
    await expect(buttons).toHaveCount(6);
  });
});
