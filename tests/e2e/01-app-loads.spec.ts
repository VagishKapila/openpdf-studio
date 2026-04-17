import { test, expect } from '@playwright/test'

test('app loads with correct OpenPDF branding', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/OpenPDF/i)
  await expect(page.getByText('PDF Editor').first()).toBeVisible()
  await expect(page.getByText('Request Signatures').first()).toBeVisible()
  // Zero DocPix references anywhere on the page
  const body = await page.textContent('body')
  expect(body).not.toContain('DocPix')
})

test('welcome screen feature cards are visible', async ({ page }) => {
  await page.goto('/')
  // Key feature cards must be visible on the welcome screen
  await expect(page.getByText(/Drag & drop|Browse Files|open a PDF/i).first()).toBeVisible()
})
