import { test, expect } from '@playwright/test'

test('app page has OpenPDF Studio branding and no DocPix', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('OpenPDF Studio').first()).toBeVisible({ timeout: 10000 })
  const body = await page.textContent('body')
  expect(body).not.toContain('DocPix')
})

test('no broken image references (no 404 on key assets)', async ({ page }) => {
  const failedRequests: string[] = []
  page.on('response', (res) => {
    if (res.status() === 404 && /\.(png|ico|svg|woff|css)/.test(res.url())) {
      failedRequests.push(`${res.status()} ${res.url()}`)
    }
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  expect(failedRequests, `Broken assets: ${failedRequests.join(', ')}`).toHaveLength(0)
})

test('page has proper meta description', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const meta = await page.locator('meta[name="description"]').getAttribute('content')
  expect(meta).toBeTruthy()
  expect(meta!.toLowerCase()).not.toContain('docpix')
})
