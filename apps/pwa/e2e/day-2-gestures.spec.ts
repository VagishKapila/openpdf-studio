import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

// Helper: load sample PDF via file chooser (matches day-10 pattern)
async function loadTestPdf(page: Page) {
  const samplePath = resolve(__dirname, '../../../tools/test-fixtures/sample.pdf');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('[data-testid="open-button"]').click(),
  ]);
  await fileChooser.setFiles(samplePath);
  await page.waitForSelector('[data-testid="annotation-layer"]', { timeout: 10_000 });
}

test.describe('Day 2 — Gesture layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Gesture container (touch-action:none, translate3d) only mounts when a PDF is open.
    // Days 3–10 evolved the idle state so auto-restore is not guaranteed.
    await loadTestPdf(page);
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
  // Must run at mobile viewport — MobileToolbar is md:hidden on desktop (≥768 px)
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('mobile toolbar has exactly 6 buttons (5 tools + More)', async ({ page }) => {
    // v1 scope: Move, Text, Draw, Mark, Sign, More
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.locator('button');
    await expect(buttons).toHaveCount(6);
  });

  test('mobile toolbar includes the 5 primary tools by aria-label', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    // Tool labels updated in Day 7.2: Select→Move, Highlight→Mark
    for (const label of ['Move', 'Text', 'Draw', 'Mark', 'Sign']) {
      await expect(toolbar.locator(`button[aria-label="${label}"]`)).toHaveCount(1);
    }
  });

  test('mobile toolbar includes More button', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar.locator('button[aria-label="More tools"]')).toHaveCount(1);
  });

  test('canvas transform uses scale directly (not scale/renderedScale)', async ({ page }) => {
    // transform div only mounts after a PDF is open
    await loadTestPdf(page);
    // At initial load the inner transform div should have scale(1) — not scale(0.667)
    // which would happen if we incorrectly divided by renderedScale=1.5
    const transformDiv = page.locator('main [style*="translate3d"]').first();
    const style = await transformDiv.getAttribute('style');
    // Should contain scale(1) — fit-to-width at load
    expect(style).toMatch(/scale\(1\)/);
  });
});
