import { test, expect } from '@playwright/test';

const BASE = process.env.SPIKE_URL || 'https://app.snaphw.com';

test.describe('Day 4 — Annotation foundation', () => {
  test('Konva canvas is present alongside PDF canvas', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 10_000 },
    );

    const canvasCount = await page.locator('canvas').count();
    if (canvasCount > 0) {
      // PDF loaded — Konva adds its own canvas alongside the PDF canvas
      expect(canvasCount).toBeGreaterThanOrEqual(2);
    } else {
      // Empty state is valid
      await expect(page.getByText(/No document open/i)).toBeVisible();
    }
  });

  test('annotation-layer div is rendered when PDF is open', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
      timeout: 10_000,
    });

    const canvasCount = await page.locator('canvas').count();
    if (canvasCount >= 2) {
      await expect(page.getByTestId('annotation-layer')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('selection action bar is hidden when nothing is selected', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bar = page.getByTestId('selection-action-bar');
    await expect(bar).toHaveCount(0);
  });

  test('page nav dock is visible when PDF is open', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
      timeout: 10_000,
    });

    const canvasCount = await page.locator('canvas').count();
    if (canvasCount >= 2) {
      // Nav dock should be present
      const nav = page.getByRole('navigation', { name: /Page navigation/i });
      await expect(nav).toBeVisible({ timeout: 5_000 });

      // Navigate to next page if enabled
      const nextBtn = page.getByRole('button', { name: /Next/i });
      const isDisabled = await nextBtn.getAttribute('disabled');
      if (isDisabled === null) {
        await nextBtn.click();
        // After navigation, selection bar should still be absent
        await expect(page.getByTestId('selection-action-bar')).toHaveCount(0);
      }
    }
  });
});
