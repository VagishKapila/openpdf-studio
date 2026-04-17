import { test, expect } from '@playwright/test'

test('PDF upload area exists and is interactive', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Hidden file input must be attached to the DOM
  await expect(page.locator('input[type="file"]').first()).toBeAttached()
})

test('Sign tool is visible in the tool palette', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(
    page.locator('.palette-btn', { hasText: 'Sign' }).first()
  ).toBeVisible({ timeout: 10000 })
})

test('Request Signatures toolbar button is present', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // The "Request" palette button (added in this release)
  await expect(
    page.locator('.palette-btn', { hasText: 'Request' }).first()
  ).toBeAttached({ timeout: 10000 })
})

test('top nav shows OpenPDF Studio branding', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const nav = page.locator('.top-nav').first()
  await expect(nav).toBeVisible({ timeout: 10000 })
  const navText = await nav.textContent()
  expect(navText).toContain('OpenPDF Studio')
})
