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

// ── Desktop suite ──────────────────────────────────────────────────────────────
test.describe('Day 10 — Undo/Redo (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Undo and Redo buttons not visible without a PDF open', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="undo-button"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="redo-button"]')).not.toBeVisible();
  });

  test('Undo and Redo buttons visible after opening a PDF', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);
    await expect(page.locator('[data-testid="undo-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="redo-button"]')).toBeVisible();
  });

  test('Undo disabled and Redo disabled initially (no history)', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);
    await expect(page.locator('[data-testid="undo-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="redo-button"]')).toBeDisabled();
  });

  test('After adding a text annotation, Undo becomes enabled', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    // Switch to text tool and click on canvas to place annotation
    await page.locator('[data-testid="tool-text"]').click();
    const layer = page.locator('[data-testid="annotation-layer"]').first();
    await layer.click({ position: { x: 100, y: 100 } });
    // Wait briefly for state to propagate
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="undo-button"]')).toBeEnabled();
  });

  test('Keyboard shortcut Cmd+Z triggers undo (no crash)', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    // Place a text annotation
    await page.locator('[data-testid="tool-text"]').click();
    const layer = page.locator('[data-testid="annotation-layer"]').first();
    await layer.click({ position: { x: 120, y: 120 } });
    await page.waitForTimeout(300);

    // Undo via keyboard — should not throw
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(300);

    // After undo, undo button should be disabled again (was empty before the annotation)
    await expect(page.locator('[data-testid="undo-button"]')).toBeDisabled();
  });

  test('Keyboard shortcut Cmd+Shift+Z triggers redo after undo (no crash)', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    // Place a text annotation, then undo, then redo
    await page.locator('[data-testid="tool-text"]').click();
    const layer = page.locator('[data-testid="annotation-layer"]').first();
    await layer.click({ position: { x: 150, y: 150 } });
    await page.waitForTimeout(300);

    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(300);

    // Redo should now be enabled
    await expect(page.locator('[data-testid="redo-button"]')).toBeEnabled();

    // Trigger redo via keyboard
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(300);

    // Redo exhausted, undo re-enabled
    await expect(page.locator('[data-testid="undo-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="redo-button"]')).toBeDisabled();
  });

  test('Undo button click undoes last annotation', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    await page.locator('[data-testid="tool-text"]').click();
    const layer = page.locator('[data-testid="annotation-layer"]').first();
    await layer.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="undo-button"]')).toBeEnabled();
    await page.locator('[data-testid="undo-button"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="undo-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="redo-button"]')).toBeEnabled();
  });

  test('Redo button click re-applies undone annotation', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    await page.locator('[data-testid="tool-text"]').click();
    const layer = page.locator('[data-testid="annotation-layer"]').first();
    await layer.click({ position: { x: 220, y: 220 } });
    await page.waitForTimeout(300);

    await page.locator('[data-testid="undo-button"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="redo-button"]')).toBeEnabled();

    await page.locator('[data-testid="redo-button"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="undo-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="redo-button"]')).toBeDisabled();
  });
});

// ── Select tool / drag ─────────────────────────────────────────────────────────
test.describe('Day 10 — Select tool (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Select tool button is present in tool palette', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);
    await expect(page.locator('[data-testid="tool-select"]')).toBeVisible();
  });

  test('Clicking select tool activates it (aria-pressed)', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);
    await page.locator('[data-testid="tool-select"]').click();
    await expect(page.locator('[data-testid="tool-select"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

// ── Mobile suite ──────────────────────────────────────────────────────────────
test.describe('Day 10 — Undo/Redo (mobile MoreMenu)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('MoreMenu contains Undo and Redo items', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    // Open the More menu
    await page.locator('[aria-label="More tools"]').click();
    await expect(page.locator('[data-testid="more-menu"]')).toBeVisible();

    await expect(page.locator('[data-testid="undo-button-mobile"]')).toBeVisible();
    await expect(page.locator('[data-testid="redo-button-mobile"]')).toBeVisible();
  });

  test('Mobile Undo disabled initially', async ({ page }) => {
    await page.goto(BASE_URL);
    await loadTestPdf(page);

    await page.locator('[aria-label="More tools"]').click();
    await expect(page.locator('[data-testid="undo-button-mobile"]')).toBeDisabled();
    await expect(page.locator('[data-testid="redo-button-mobile"]')).toBeDisabled();
  });
});
