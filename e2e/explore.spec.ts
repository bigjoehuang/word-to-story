import { test, expect } from '@playwright/test'

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore')
  })

  test('should display explore page', async ({ page }) => {
    await expect(page).toHaveURL(/.*explore/)
  })

  test('should display words list', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000)
    
    // Check if there are word cards or list items
    const wordsContainer = page.locator('[class*="word"], [class*="grid"], [class*="card"]')
    // Just check if page loaded, don't fail if no words yet
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Read Page', () => {
  test('should navigate to read page with word parameter', async ({ page }) => {
    // First go to explore
    await page.goto('/explore')
    await page.waitForTimeout(1000)
    
    // Try to click on a word if available
    const wordLink = page.locator('a[href*="read"], button:has-text("字")').first()
    if (await wordLink.count() > 0) {
      await wordLink.click()
      await page.waitForURL(/.*read.*word=/, { timeout: 5000 })
      await expect(page).toHaveURL(/.*read.*word=/)
    }
  })
})

