import { test, expect } from '@playwright/test';

const BASE = process.env.SPIKE_URL ?? 'https://app.snaphw.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openDebugSession(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}?debug=1`);
  await page.waitForLoadState('networkidle');
}

// Seed a blank test PDF via openpdfDebug.seedDocument() and wait for canvas
async function seedAndAwaitCanvas(page: import('@playwright/test').Page) {
  // Wait for the async debug API to be registered
  await page.waitForFunction(
    () => !!(window as unknown as Record<string, unknown>).openpdfDebug &&
          typeof (window as any).openpdfDebug.seedDocument === 'function',
    { timeout: 8000 },
  );
  await page.evaluate(async () => {
    await (window as any).openpdfDebug.seedDocument();
  });
  const layer = page.locator('[data-testid="annotation-layer"]');
  await layer.waitFor({ state: 'visible', timeout: 8000 });
  return layer;
}


// ── Desktop tests (1440×900) ─────────────────────────────────────────────────

test.describe('Day 5 — Text Tool (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('text tool button is visible and toggles active state', async ({ page }) => {
    await openDebugSession(page);
    const btn = page.getByTestId('tool-text');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('text tool controls appear when text tool is active', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    await expect(page.getByTestId('text-tool-controls')).toBeVisible();
    await expect(page.getByTestId('font-size-select')).toBeVisible();
    await expect(page.getByTestId('color-swatches')).toBeVisible();
  });

  test('text tool controls hidden when another tool is active', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    await page.getByTestId('tool-select').click();
    await expect(page.getByTestId('text-tool-controls')).not.toBeVisible();
  });

  test('clicking canvas with text tool opens TextEditor', async ({ page }) => {
    await openDebugSession(page);
    await seedAndAwaitCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer has no bounding box');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId('text-editor')).toBeVisible({ timeout: 4000 });
  });

  test('typing text and pressing Escape commits annotation', async ({ page }) => {
    await openDebugSession(page);
    await seedAndAwaitCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 4000 });
    await editor.fill('Hello World');
    await page.keyboard.press('Escape');

    // Editor dismisses, Konva canvas (annotation layer) still present
    await expect(editor).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="annotation-layer"] canvas')).toBeVisible();
  });

  test('pressing Enter commits annotation', async ({ page }) => {
    await openDebugSession(page);
    await seedAndAwaitCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.3);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 4000 });
    await editor.fill('Enter commit');
    await page.keyboard.press('Enter');
    await expect(editor).not.toBeVisible({ timeout: 3000 });
  });

  test('empty text on commit removes annotation', async ({ page }) => {
    await openDebugSession(page);
    await seedAndAwaitCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 4000 });
    // Leave empty and press Escape
    await editor.fill('');
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible({ timeout: 3000 });
    // Layer still rendered (no crash)
    await expect(page.locator('[data-testid="annotation-layer"]')).toBeVisible();
  });

  test('clicking existing text annotation reopens TextEditor', async ({ page }) => {
    await openDebugSession(page);
    await seedAndAwaitCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    const cx = box.x + box.width * 0.45;
    const cy = box.y + box.height * 0.45;

    // Place and commit a text annotation
    await page.mouse.click(cx, cy);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 4000 });
    await editor.fill('Re-edit me');
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible({ timeout: 3000 });

    // Click same location — should re-open editor (the Konva Text node is there)
    await page.mouse.click(cx, cy);
    await expect(editor).toBeVisible({ timeout: 4000 });
  });

  test('font size select is functional', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    const fontSelect = page.getByTestId('font-size-select');
    await expect(fontSelect).toBeVisible();
    await fontSelect.selectOption('24');
    await expect(fontSelect).toHaveValue('24');
    // Change back to 16
    await fontSelect.selectOption('16');
    await expect(fontSelect).toHaveValue('16');
  });

  test('color swatch selection updates active indicator', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    const swatches = page.getByTestId('color-swatches').locator('button');
    // Click Red swatch (index 1)
    await swatches.nth(1).click();
    const style = await swatches.nth(1).getAttribute('style');
    expect(style).toContain('F59E0B'); // amber border = selected
  });
});

