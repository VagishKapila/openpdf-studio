import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

const BASE = process.env.SPIKE_URL ?? 'https://app.snaphw.com';

test.describe('Day 5 — Text Tool (mobile)', () => {
  test('mobile text tool button visible and activatable', async ({ page }) => {
    await page.goto(`${BASE}?debug=1`);
    await page.waitForLoadState('networkidle');
    const toolbar = page.getByTestId('mobile-toolbar');
    await expect(toolbar).toBeVisible();
    const textBtn = toolbar.getByRole('button', { name: /Text/i });
    await expect(textBtn).toBeVisible();
    await textBtn.click();
    await expect(textBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('mobile text tool controls row appears above toolbar', async ({ page }) => {
    await page.goto(`${BASE}?debug=1`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('mobile-toolbar').getByRole('button', { name: /Text/i }).click();
    await expect(page.getByTestId('text-tool-controls-mobile')).toBeVisible();
    await expect(page.getByTestId('font-size-select-mobile')).toBeVisible();
    await expect(page.getByTestId('color-swatches-mobile')).toBeVisible();
  });

  test('mobile: controls disappear when switching to another tool', async ({ page }) => {
    await page.goto(`${BASE}?debug=1`);
    await page.waitForLoadState('networkidle');
    const toolbar = page.getByTestId('mobile-toolbar');
    await toolbar.getByRole('button', { name: /Text/i }).click();
    await expect(page.getByTestId('text-tool-controls-mobile')).toBeVisible();
    await toolbar.getByRole('button', { name: /Select/i }).click();
    await expect(page.getByTestId('text-tool-controls-mobile')).not.toBeVisible();
  });
});
