import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

// Desktop viewport for all tests in this suite
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Day 2.3 — Desktop layout (idle state, no PDF loaded)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('MobileToolbar is NOT visible on desktop (md:hidden)', async ({ page }) => {
    // md:hidden makes the element invisible at ≥768px — it exists in DOM but hidden
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeHidden();
  });

  test('ToolPalette sidebar IS visible on desktop', async ({ page }) => {
    const palette = page.locator('[data-testid="tool-palette"]');
    await expect(palette).toBeVisible();
  });

  test('PageNavDock is absent before any PDF is loaded (correct idle contract)', async ({ page }) => {
    // PageNavDock returns null until loadState === "ready", so it must not be in the DOM
    const dock = page.locator('[aria-label="Page navigation"]');
    await expect(dock).toHaveCount(0);
  });

  test('CanvasArea fills available space (no tiny white rectangle)', async ({ page }) => {
    const canvasArea = page.locator('[data-testid="canvas-area"]');
    await expect(canvasArea).toBeVisible();
    const box = await canvasArea.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // At 1280 wide, canvas area should be >= 800px (after 56px sidebar)
      expect(box.width).toBeGreaterThan(800);
      // At 800 tall, main area minus header should be >= 500px
      expect(box.height).toBeGreaterThan(500);
    }
  });

  test('Tool palette buttons are interactive and set aria-pressed', async ({ page }) => {
    // Text tool button
    const textBtn = page.locator('[data-testid="tool-text"]');
    await expect(textBtn).toBeVisible();
    await textBtn.click();
    await expect(textBtn).toHaveAttribute('aria-pressed', 'true');

    // Draw tool button
    const drawBtn = page.locator('[data-testid="tool-draw"]');
    await drawBtn.click();
    await expect(drawBtn).toHaveAttribute('aria-pressed', 'true');
    // text tool should no longer be active
    await expect(textBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('Empty-state prompt is visible when no PDF loaded', async ({ page }) => {
    // Clear any cached document so auto-restore does not load a PDF
    await page.evaluate(async () => {
      const dbs = await (indexedDB as IDBFactory & { databases?: () => Promise<IDBDatabaseInfo[]> }).databases?.() ?? [];
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Use the unique heading text — 'text=Open' previously matched 6+ elements
    // (the AppHeader "Open" button + the word "Open" inside the empty-state hint)
    await expect(
      page.locator('[data-testid="canvas-area"]').getByText('No document open'),
    ).toBeVisible();
  });
});

test.describe('Day 2.3 — Mobile regression guard (iPhone 14 Pro)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('MobileToolbar IS visible on mobile', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
  });

  test('ToolPalette sidebar is NOT visible on mobile', async ({ page }) => {
    const palette = page.locator('[data-testid="tool-palette"]');
    await expect(palette).toBeHidden();
  });

  test('CanvasArea exists and has reasonable height on mobile', async ({ page }) => {
    const canvasArea = page.locator('[data-testid="canvas-area"]');
    await expect(canvasArea).toBeVisible();
    const box = await canvasArea.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // On 390-wide mobile, canvas area should span most of the width
      expect(box.width).toBeGreaterThan(300);
      // Should have substantial height even on mobile
      expect(box.height).toBeGreaterThan(400);
    }
  });
});
