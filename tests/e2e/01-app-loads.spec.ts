import { test, expect } from '@playwright/test'

test('app loads with correct OpenPDF branding', async ({ page }) => {
  await page.goto('/app/')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/OpenPDF/i)
  await expect(page.getByText('PDF Editor').first()).toBeVisible({ timeout: 10000 })
  // Request Signatures must be visible in the welcome screen feature cards
  await expect(page.locator('.feature-card h4', { hasText: 'Request Signatures' }).first()).toBeVisible({ timeout: 10000 })
  // Zero DocPix references anywhere on the page
  const body = await page.textContent('body')
  expect(body).not.toContain('DocPix')
})

test('welcome screen feature cards are visible', async ({ page }) => {
  await page.goto('/app/')
  await page.waitForLoadState('networkidle')
  // Welcome screen must render feature cards
  await expect(page.locator('.feature-card').first()).toBeVisible({ timeout: 10000 })
  // Upload area must be available (inside req-sig overlay or welcome screen)
  await expect(page.locator('input[type="file"]').first()).toBeAttached()
})
