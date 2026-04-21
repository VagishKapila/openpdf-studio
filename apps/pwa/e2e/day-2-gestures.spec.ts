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

test.describe('Day 2.1 — Toolbar scope + fit-to-width', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('#root > *', { timeout: 10_000 });
  });

  test('mobile toolbar has exactly 6 buttons (5 tools + More)', async ({ page }) => {
    // v1 scope: Select, Text, Draw, Highlight, Sign, More
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.locator('button');
    await expect(buttons).toHaveCount(6);
  });

  test('mobile toolbar includes the 5 primary tools by aria-label', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    for (const label of ['Select', 'Text', 'Draw', 'Highlight', 'Sign']) {
      await expect(toolbar.locator(`button[aria-label="${label}"]`)).toHaveCount(1);
    }
  });

  test('mobile toolbar includes More button', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar.locator('button[aria-label="More tools"]')).toHaveCount(1);
  });

  test('canvas transform uses scale directly (not scale/renderedScale)', async ({ page }) => {
    // At initial load the inner transform div should have scale(1) — not scale(0.667)
    // which would happen if we incorrectly divided by renderedScale=1.5
    const transformDiv = page.locator('main [style*="translate3d"]').first();
    const style = await transformDiv.getAttribute('style');
    // Should contain scale(1) — fit-to-width at load
    expect(style).toMatch(/scale\(1\)/);
  });
});
