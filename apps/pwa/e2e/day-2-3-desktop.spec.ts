import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const SAMPLE_PDF = path.resolve(__dirname, 'fixtures/sample.pdf');

// Desktop viewport for all tests in this suite
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Day 2.3 — Desktop layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('MobileToolbar is NOT visible on desktop (md:hidden)', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    // Should exist in DOM but be invisible at desktop viewport
    await expect(toolbar).toBeHidden();
  });

  test('ToolPalette (sidebar) IS visible on desktop', async ({ page }) => {
    const palette = page.locator('[data-testid="tool-palette"]');
    await expect(palette).toBeVisible();
  });

  test('PageNavDock IS visible on desktop', async ({ page }) => {
    const dock = page.locator('[aria-label="Page navigation"]');
    await expect(dock).toBeVisible();
  });

  test('CanvasArea fills available space (no tiny white rectangle)', async ({ page }) => {
    const canvas = page.locator('[data-testid="canvas-area"]');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Canvas area should occupy most of the viewport width (>= 800px on 1280 viewport)
      expect(box.width).toBeGreaterThan(800);
      // And most of the vertical space (>= 500px on 800 tall viewport)
      expect(box.height).toBeGreaterThan(500);
    }
  });

  test('Desktop: tool palette buttons respond to click', async ({ page }) => {
    const textBtn = page.locator('[data-testid="tool-text"]');
    await expect(textBtn).toBeVisible();
    await textBtn.click();
    // After clicking, text tool should be active
    await expect(textBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Day 2.3 — Mobile toolbar still works (regression guard)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('MobileToolbar IS visible on mobile', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
  });

  test('ToolPalette (sidebar) is NOT visible on mobile', async ({ page }) => {
    const palette = page.locator('[data-testid="tool-palette"]');
    await expect(palette).toBeHidden();
  });

  test('PageNavDock IS visible on mobile', async ({ page }) => {
    const dock = page.locator('[aria-label="Page navigation"]');
    await expect(dock).toBeVisible();
  });
});
