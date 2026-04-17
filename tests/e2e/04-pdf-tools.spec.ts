import { test, expect } from '@playwright/test'

test('PDF upload area exists and is interactive', async ({ page }) => {
  await page.goto('/')
  // File input must be present and attached
  await expect(page.locator('input[type="file"]').first()).toBeAttached()
})

test('Sign tool is visible in the tool palette', async ({ page }) => {
  await page.goto('/')
  // The Sign palette button must be visible
  await expect(page.locator('.palette-btn').filter({ hasText: 'Sign' }).first()).toBeVisible()
})

test('Request tool button is present in tool palette', async ({ page }) => {
  await page.goto('/')
  // The Request palette button (short label) must be attached
  await expect(page.locator('.palette-btn').filter({ hasText: 'Request' }).first()).toBeAttached()
})

test('top nav OpenPDF Studio logo and name visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.top-nav').first()).toBeVisible()
  // OpenPDF Studio text must appear in nav
  const navText = await page.locator('.top-nav').first().textContent()
  expect(navText).toContain('OpenPDF Studio')
})
