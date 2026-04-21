import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

test.describe('Day 2 — Gesture layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for React to hydrate
    await page.waitForSelector('#root > *', { timeout: 10_000 });
  });

  test('gesture container has touch-action: none', async ({ page }) => {
    // The gesture container sits inside <main> and must have touch-action:none
    // so the browser hands all pointer events to our handler
    const gestureContainer = page.locator('main [style*="touch-action: none"]').first();
    await expect(gestureContainer).toBeVisible();
  });

  test('canvas renders inside the gesture container', async ({ page }) => {
    const gestureContainer = page.locator('main [style*="touch-action: none"]').first();
    const canvas = gestureContainer.locator('canvas');
    await expect(canvas).toHaveCount(1);
  });

  test('app chrome is NOT inside gesture container (stays fixed during zoom)', async ({ page }) => {
    // CRITICAL: header, toolbars, and page nav must live OUTSIDE the
    // gesture container so they never scale/translate with the canvas.
    const gestureContainer = page.locator('main [style*="touch-action: none"]').first();

    // AppHeader renders as <header>
    await expect(gestureContainer.locator('header')).toHaveCount(0);
    // MobileToolbar + PageNavDock render as <nav>
    await expect(gestureContainer.locator('nav')).toHaveCount(0);
  });

  test('1:1 reset button is absent at scale = 1', async ({ page }) => {
    // The reset badge only appears when scale > 1.05.
    // At page load the scale is 1, so it must not be visible.
    const resetBtn = page.locator('button[aria-label="Reset zoom"]');
    await expect(resetBtn).toHaveCount(0);
  });
});
