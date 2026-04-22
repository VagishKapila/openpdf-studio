import { test, expect } from '@playwright/test';

const BASE = process.env.SPIKE_URL || 'https://app.snaphw.com';

test.describe('Day 3.5 — Document UX', () => {
  test('Empty state shown on fresh session (no Dexie docs)', async ({ page }) => {
    await page.goto(BASE);
    // Wipe IndexedDB + storage so we're a clean first-time user
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('openpdf_v1');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    });
    await page.reload();

    // Spinner resolves, then empty state appears
    const emptyHeading = page.getByText(/No document open/i);
    await expect(emptyHeading).toBeVisible({ timeout: 10_000 });

    // No canvas should be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(0);
  });

  test('Close button appears when document loaded, clears on click', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // If a doc auto-loaded, close button should exist
    const closeBtn = page.getByTestId('close-button');
    const openBtn = page.getByTestId('open-button');
    await expect(openBtn).toBeVisible();

    const docLoaded = (await closeBtn.count()) > 0;
    if (docLoaded) {
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      // Canvas area transitions to empty state
      await expect(page.getByText(/No document open/i)).toBeVisible({ timeout: 5_000 });
      // Close button gone
      await expect(closeBtn).toHaveCount(0);
    }
    // If no doc loaded, close button correctly absent
    else {
      await expect(closeBtn).toHaveCount(0);
    }
  });

  test('Menu icon is visible and toggles sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const menuBtn = page.getByRole('button', { name: /Menu/i });
    await expect(menuBtn).toBeVisible();

    // Sidebar hidden before toggle
    const sidebar = page.getByTestId('document-sidebar');

    // Click menu — sidebar opens
    await menuBtn.click();
    await expect(page.getByText(/^Documents$/i)).toBeVisible({ timeout: 5_000 });
  });

  test('Mobile: sidebar slides in on menu click', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const menuBtn = page.getByRole('button', { name: /Menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    await expect(page.getByText(/^Documents$/i)).toBeVisible({ timeout: 5_000 });
    // "Open new PDF" button in sidebar
    await expect(page.getByText(/Open new PDF/i)).toBeVisible();
  });

  test('No loading spinner visible after init completes', async ({ page }) => {
    await page.goto(BASE);
    // Wait for initialization to finish (spinner disappears)
    await page.waitForFunction(() => {
      const spinning = document.querySelector('.animate-spin');
      return spinning === null;
    }, { timeout: 10_000 });
    // Either empty state or canvas — never just a blank white square
    const canvas = page.locator('canvas');
    const emptyState = page.getByText(/No document open/i);
    const eitherVisible = (await canvas.count()) > 0 || (await emptyState.count()) > 0;
    expect(eitherVisible).toBe(true);
  });
});
