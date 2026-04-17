import { test, expect } from '@playwright/test'

test('Request Signatures visible in feature cards for logged-out users', async ({ page }) => {
  await page.goto('/app/')
  await page.waitForLoadState('networkidle')
  // Must appear in the welcome screen feature cards — always visible regardless of auth state
  await expect(
    page.locator('.feature-card h4', { hasText: 'Request Signatures' }).first()
  ).toBeVisible({ timeout: 10000 })
})

test('clicking Request Signatures while logged out shows auth gate', async ({ page }) => {
  await page.goto('/app/')
  await page.waitForLoadState('networkidle')
  // Click the feature card
  await page.locator('.feature-card', { hasText: 'Request Signatures' }).first().click()
  await page.waitForTimeout(500)
  // Auth gate: either the rs-auth-prompt modal OR the auth modal must appear
  // (depends on which version is deployed — both are valid auth gates)
  const authGateVisible = await page.locator('#rs-auth-prompt.visible, .auth-modal, #auth-modal').first().isVisible().catch(() => false)
  const signInTextVisible = await page.getByText(/sign in|log in/i).first().isVisible().catch(() => false)
  expect(authGateVisible || signInTextVisible).toBe(true)
  // The request form must NOT be open without auth
  await expect(page.locator('#req-sig-overlay.visible')).not.toBeVisible()
})

test('auth prompt or modal has sign-in option', async ({ page }) => {
  await page.goto('/app/')
  await page.waitForLoadState('networkidle')
  await page.locator('.feature-card', { hasText: 'Request Signatures' }).first().click()
  await page.waitForTimeout(600)
  // Some form of "sign in" affordance must be visible
  await expect(
    page.getByText(/sign in|log in|create account|register/i).first()
  ).toBeVisible({ timeout: 8000 })
})
