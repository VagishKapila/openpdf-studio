import { test, expect } from '@playwright/test'

test('PDF Editor mode tab is clickable without crash', async ({ page }) => {
  await page.goto('/')
  await page.getByText('PDF Editor').first().click()
  await page.waitForTimeout(400)
  await expect(page.getByText(/something went wrong|error|crash/i)).not.toBeVisible()
})

test('default app banner shows on first visit (localStorage cleared)', async ({ page }) => {
  await page.goto('/')
  // Clear localStorage to simulate first visit
  await page.evaluate(() => localStorage.removeItem('openpdf_default_prompt_dismissed'))
  await page.reload()
  await page.waitForTimeout(2000)
  await expect(page.getByText(/Make OpenPDF Studio your default/i)).toBeVisible()
})

test('default app banner stays dismissed after Not Now', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('openpdf_default_prompt_dismissed'))
  await page.reload()
  await page.waitForTimeout(2000)
  // Click Not Now
  const notNow = page.getByText('Not Now')
  await notNow.click()
  // Reload and confirm banner is gone
  await page.reload()
  await page.waitForTimeout(2000)
  await expect(page.getByText(/Make OpenPDF Studio your default/i)).not.toBeVisible()
})
