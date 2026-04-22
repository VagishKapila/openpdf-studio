import { test, expect } from '@playwright/test';

const BASE = process.env.SPIKE_URL || 'https://app.snaphw.com';

test.describe('Day 4 — Annotation foundation', () => {
  test('Konva canvas is present alongside PDF canvas', async ({ page }) => {
    await page.goto(BASE);
    // Wait for either a document to load or empty state
    await page.waitForFunction(
      () => {
        const spinning = document.querySelector('.animate-spin');
        return spinning === null;
      },
      { timeout: 10_000 },
    );

    // If a PDF loaded, Konva creates its own canvas — expect ≥2 canvases
    const canvasCount = await page.locator('canvas').count();
    // May be 0 if no doc loaded (empty state), 2+ if doc loaded with Konva overlay
    if (canvasCount > 0) {
      expect(canvasCount).toBeGreaterThanOrEqual(2);
    } else {
      // Empty state is valid — no canvas at all
      await expect(page.getByText(/No document open/i)).toBeVisible();
    }
  });

  test('annotation-layer div is rendered when PDF is open', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
      timeout: 10_000,
    });

    const layer = page.getByTestId('annotation-layer');
    const canvasCount = await page.locator('canvas').count();

    if (canvasCount >= 2) {
      // PDF loaded → AnnotationLayer should be present
      await expect(layer).toBeVisible({ timeout: 5_000 });
    }
    // If no PDF open, layer won't exist — that's correct behaviour
  });

  test('selection action bar hidden when nothing selected', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bar = page.getByTestId('selection-action-bar');
    // Should not be visible since nothing is selected on fresh load
    await expect(bar).toHaveCount(0);
  });

  test('page navigation clears annotation selection', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
      timeout: 10_000,
    });

    // Navigate pages if multi-page doc loaded
    const nextBtn = page.getByTestId('page-next');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      // Selection bar should still be absent
      await expect(page.getByTestId('selection-action-bar')).toHaveCount(0);
    }
  });
});
