import { test, expect } from '@playwright/test'

test('Request Signatures visible in toolbar for logged-out users', async ({ page }) => {
  await page.goto('/')
  // Button must exist in the tool palette (always visible)
  await expect(page.getByText('Request Signatures').first()).toBeVisible()
})

test('clicking Request Signatures while logged out shows auth prompt', async ({ page }) => {
  await page.goto('/')
  // Click the welcome-screen feature card (or toolbar button)
  await page.getByText('Request Signatures').first().click()
  // Auth prompt must appear
  await expect(
    page.getByText(/sign in|create account|free account/i).first()
  ).toBeVisible({ timeout: 5000 })
  // The request form must NOT open — no "Add Signer" or "Document Title" visible
  await expect(page.getByText(/Add Signer|Document Title/i)).not.toBeVisible()
})

test('auth prompt has Sign In and Create Account buttons', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Request Signatures').first().click()
  await expect(page.getByText('Sign In').first()).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Create Account').first()).toBeVisible({ timeout: 5000 })
})
