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

// ── Desktop suite ────────────────────────────────────────────────────────
test.describe('Day 7 — Sign tool (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);
  });

  test('clicking Sign tool opens signature modal', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).toBeVisible();
  });

  test('Draw tab is visible by default and has signature canvas', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await expect(page.locator('[data-testid="sig-tab-draw"]')).toBeVisible();
    await expect(page.locator('[data-testid="signature-canvas"]')).toBeVisible();
  });

  test('Type tab shows text input and 3 font buttons', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await expect(page.locator('[data-testid="sig-type-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="sig-font-buttons"] button')).toHaveCount(3);
  });

  test('Type tab shows live preview when text is entered', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await page.locator('[data-testid="sig-type-input"]').fill('John Doe');
    await expect(page.locator('[data-testid="sig-type-preview"]')).toContainText('John Doe');
  });

  test('Upload tab has file input', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-upload"]').click();
    await expect(page.locator('[data-testid="sig-file-input"]')).toBeAttached();
  });

  test('Cancel button closes modal without placing', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).toBeVisible();
    await page.locator('[data-testid="sig-cancel"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).not.toBeVisible();
  });

  test('Place Signature (type) closes modal and shows ghost on mouse move', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await page.locator('[data-testid="sig-type-input"]').fill('Alice');
    await page.locator('[data-testid="sig-place"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).not.toBeVisible();

    // Move mouse over canvas to trigger ghost
    const canvas = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
      await expect(page.locator('[data-testid="sig-placement-ghost"]')).toBeVisible();
    }
  });

  test('clicking canvas during placement commits annotation', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await page.locator('[data-testid="sig-type-input"]').fill('Bob');
    await page.locator('[data-testid="sig-place"]').click();

    const canvas = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas not found');
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4);
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
    await page.waitForTimeout(600);

    // Ghost should be gone after commit
    await expect(page.locator('[data-testid="sig-placement-ghost"]')).not.toBeVisible();

    // Annotation layer should have content
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

  test('cancel placement button clears ghost', async ({ page }) => {
    await page.locator('[data-testid="tool-sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await page.locator('[data-testid="sig-type-input"]').fill('Charlie');
    await page.locator('[data-testid="sig-place"]').click();

    const canvas = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await canvas.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);

    await page.locator('[data-testid="sig-placement-cancel"]').click();
    await expect(page.locator('[data-testid="sig-placement-ghost"]')).not.toBeVisible();
  });
});

// ── Mobile suite ─────────────────────────────────────────────────────────
test.describe('Day 7 — Sign tool (mobile)', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await loadTestPdf(page);
  });

  test('tap Sign tool → modal opens', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Sign"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).toBeVisible();
  });

  test('Draw tab has signature canvas on mobile', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Sign"]').click();
    await expect(page.locator('[data-testid="signature-canvas"]')).toBeVisible();
  });

  test('Type + Place → touch commits annotation', async ({ page }) => {
    await page.locator('[data-testid="mobile-toolbar"] button[aria-label="Sign"]').click();
    await page.locator('[data-testid="sig-tab-type"]').click();
    await page.locator('[data-testid="sig-type-input"]').fill('Test Sig');
    await page.locator('[data-testid="sig-place"]').click();
    await expect(page.locator('[data-testid="signature-modal"]')).not.toBeVisible();

    // Tap canvas to commit
    const canvas = page.locator('[data-testid="annotation-layer"] canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas not found');
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.4);
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="sig-placement-ghost"]')).not.toBeVisible();
  });
});
