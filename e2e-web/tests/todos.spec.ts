import { test, expect } from '@playwright/test'

// Emulators + Expo web must be running: bun run dev
test.describe('Todos flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test1@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('**/') // navigates to todos screen
  })

  test('shows todo list after login', async ({ page }) => {
    await expect(page.locator('[data-testid="create-todo-button"]')).toBeVisible()
  })

  test('can create a new todo', async ({ page }) => {
    await page.click('[data-testid="create-todo-button"]')
    await page.fill('[data-testid="create-todo-input"]', 'E2E Test Todo')
    await page.click('[data-testid="create-todo-save"]')
    await expect(page.locator('text=E2E Test Todo')).toBeVisible()
  })

  test('can toggle a todo', async ({ page }) => {
    const firstToggle = page.locator('[data-testid^="todo-toggle-"]').first()
    const checked = await firstToggle.getAttribute('aria-checked')
    await firstToggle.click()
    const newChecked = await firstToggle.getAttribute('aria-checked')
    expect(newChecked).not.toBe(checked)
  })
})
