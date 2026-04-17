import { test, expect } from '@playwright/test'

test('PDF Editor mode tab is clickable without crash', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByText('PDF Editor').first().click()
  await page.waitForTimeout(400)
  await expect(page.getByText(/something went wrong|error|crash/i)).not.toBeVisible()
})

test('default app banner shows on first visit (localStorage cleared)', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Clear the dismiss key to simulate first visit
  await page.evaluate(() => localStorage.removeItem('openpdf_default_prompt_dismissed'))
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500) // banner appears after 1500ms
  await expect(
    page.locator('#default-app-banner.show')
  ).toBeVisible({ timeout: 5000 })
})

test('default app banner stays dismissed after Not Now', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => localStorage.removeItem('openpdf_default_prompt_dismissed'))
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
  // Click Not Now button inside the banner
  await page.locator('#default-app-banner .banner-btn-secondary').click()
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
  await expect(page.locator('#default-app-banner.show')).not.toBeVisible()
})
