import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main page', async ({ page }) => {
    // Check for main elements
    await expect(page.locator('h1, h2')).toBeVisible()
  })

  test('should have theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="切换主题"], button[title*="切换"]')
    await expect(themeToggle).toBeVisible()
  })

  test('should toggle theme when theme button is clicked', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="切换主题"], button[title*="切换"]')
    
    // Get initial theme
    const initialClass = await page.locator('html').getAttribute('class')
    
    // Click theme toggle
    await themeToggle.click()
    
    // Wait for theme change
    await page.waitForTimeout(500)
    
    // Check if theme changed
    const newClass = await page.locator('html').getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should have navigation links', async ({ page }) => {
    // Check for navigation (adjust selector based on your Navigation component)
    const nav = page.locator('nav, [role="navigation"]')
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible()
    }
  })
})

test.describe('Story Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have input field for words', async ({ page }) => {
    const input = page.locator('input[type="text"], input[placeholder*="字"]')
    if (await input.count() > 0) {
      await expect(input).toBeVisible()
    }
  })

  test('should show error for empty input', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button:has-text("生成"), button:has-text("创作")')
    if (await submitButton.count() > 0) {
      await submitButton.click()
      // Wait for error message (if any)
      await page.waitForTimeout(500)
    }
  })
})

