import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL ?? 'https://app.snaphw.com';

/** Load a PDF into the app via the file picker. */
async function loadTestPdf(page: Page) {
  const samplePath = resolve(__dirname, '../../../tools/test-fixtures/sample.pdf');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('[data-testid="open-button"]').click(),
  ]);
  await fileChooser.setFiles(samplePath);
  await page.waitForSelector('[data-testid="annotation-layer"]', { timeout: 10_000 });
}

/** Returns true if any canvas in annotation-layer has a non-transparent pixel. */
async function annotationLayerHasContent(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const canvases = document.querySelectorAll('[data-testid="annotation-layer"] canvas');
    return Array.from(canvases).some((c) => {
      const ctx = (c as HTMLCanvasElement).getContext('2d');
      if (!ctx) return false;
      const { width, height } = c as HTMLCanvasElement;
      if (!width || !height) return false;
      const data = ctx.getImageData(0, 0, width, height);
      return data.data.some((v, i) => i % 4 === 3 && v > 0);
    });
  });
}

// ── Desktop suite (1440×900) ────────────────────────────────────────────────
test.describe('Day 6 — Draw tool (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);
  });

  test('draw tool button exists and activates', async ({ page }) => {
    const btn = page.locator('[data-testid="tool-draw"]');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('draw tool controls appear when draw tool is active', async ({ page }) => {
    await page.locator('[data-testid="tool-draw"]').click();
    await expect(page.locator('[data-testid="draw-tool-controls"]')).toBeVisible();
  });

  test('draw tool controls hidden when highlight tool is active', async ({ page }) => {
    await page.locator('[data-testid="tool-highlight"]').click();
    await expect(page.locator('[data-testid="draw-tool-controls"]')).not.toBeVisible();
  });

  test('highlight tool button exists and activates', async ({ page }) => {
    const btn = page.locator('[data-testid="tool-highlight"]');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('highlight tool controls appear when highlight tool is active', async ({ page }) => {
    await page.locator('[data-testid="tool-highlight"]').click();
    await expect(page.locator('[data-testid="highlight-tool-controls"]')).toBeVisible();
  });

  test('mouse drag with draw tool creates content on annotation layer', async ({ page }) => {
    await page.locator('[data-testid="tool-draw"]').click();
    const layer = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer canvas not found');

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(
        box.x + box.width * 0.2 + i * 15,
        box.y + box.height * 0.3 + i * 5,
      );
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(400);

    expect(await annotationLayerHasContent(page)).toBe(true);
  });

  test('selecting a different draw color updates active swatch', async ({ page }) => {
    await page.locator('[data-testid="tool-draw"]').click();
    const swatch = page.locator('[data-testid="draw-color-swatches"] button[aria-label="Black"]');
    await swatch.click();
    // Wait for React re-render — amber border should appear on the active swatch
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="draw-color-swatches"] button[aria-label="Black"]') as HTMLElement | null;
      if (!el) return false;
      return getComputedStyle(el).borderColor !== 'rgba(0, 0, 0, 0)';
    }, { timeout: 3000 });
    const borderColor = await swatch.evaluate((el: HTMLElement) => getComputedStyle(el).borderColor);
    // Active border is amber (#F59E0B = rgb(245,158,11))
    expect(borderColor).toMatch(/245|f59/i);
  });

  test('mouse drag with highlight tool creates content on annotation layer', async ({ page }) => {
    await page.locator('[data-testid="tool-highlight"]').click();
    const layer = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer canvas not found');

    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width * 0.1 + 120,
      box.y + box.height * 0.2 + 40,
    );
    await page.mouse.up();
    await page.waitForTimeout(400);

    expect(await annotationLayerHasContent(page)).toBe(true);
  });
});

// ── Mobile suite (Pixel 7 emulation) ────────────────────────────────────────
test.describe('Day 6 — Draw + Highlight tools (mobile)', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);
  });

  test('draw tool button visible and activatable on mobile', async ({ page }) => {
    const toolbar = page.locator('[data-testid="mobile-toolbar"]');
    await expect(toolbar).toBeVisible();
    const drawBtn = toolbar.locator('button[aria-label="Draw"]');
    await drawBtn.click();
    await expect(drawBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('draw tool controls row appears above mobile toolbar', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Draw"]').click();
    await expect(page.locator('[data-testid="draw-tool-controls-mobile"]')).toBeVisible();
  });

  test('highlight tool controls row appears above mobile toolbar', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Highlight"]').click();
    await expect(page.locator('[data-testid="highlight-tool-controls-mobile"]')).toBeVisible();
  });

  test('draw controls disappear when switching to select tool', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Draw"]').click();
    await expect(page.locator('[data-testid="draw-tool-controls-mobile"]')).toBeVisible();
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Select"]').click();
    await expect(page.locator('[data-testid="draw-tool-controls-mobile"]')).not.toBeVisible();
  });

  test('CDP touch drag with draw tool creates visible stroke on mobile', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Draw"]').click();
    const layer = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer canvas not found');

    const client = await page.context().newCDPSession(page);
    const startX = box.x + box.width * 0.3;
    const startY = box.y + box.height * 0.25;

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY, id: 0, radiusX: 4, radiusY: 4, rotationAngle: 0, force: 0.5 }],
    });
    for (let i = 1; i <= 8; i++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + i * 20, y: startY + i * 8, id: 0, radiusX: 4, radiusY: 4, rotationAngle: 0, force: 0.5 }],
      });
      await page.waitForTimeout(16);
    }
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [{ x: startX + 160, y: startY + 64, id: 0, radiusX: 4, radiusY: 4, rotationAngle: 0, force: 0 }],
    });
    await page.waitForTimeout(500);

    const hasContent = await page.evaluate(() => {
      const canvases = document.querySelectorAll('[data-testid="annotation-layer"] canvas');
      return Array.from(canvases).some((c) => {
        const ctx = (c as HTMLCanvasElement).getContext('2d');
        if (!ctx) return false;
        const { width, height } = c as HTMLCanvasElement;
        if (!width || !height) return false;
        const data = ctx.getImageData(0, 0, width, height);
        return data.data.some((v, i) => i % 4 === 3 && v > 0);
      });
    });
    expect(hasContent).toBe(true);
  });
});
