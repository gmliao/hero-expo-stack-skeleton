// React Native Web maps testID prop to data-testid attribute on the DOM.
// This file uses page.getByTestId() which is equivalent to [data-testid="..."] selector.

import { test, expect } from '@playwright/test'

// Emulators + Expo web must be running: bun run dev
test.describe('Todos flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test1@example.com')
    await page.getByTestId('password-input').fill('password')
    await page.getByTestId('login-button').click()
    await page.waitForURL('**/') // navigates to todos screen
  })

  test('shows todo list after login', async ({ page }) => {
    await expect(page.getByTestId('create-todo-button')).toBeVisible()
  })

  test('can create a new todo', async ({ page }) => {
    await page.getByTestId('create-todo-button').click()
    await page.getByTestId('create-todo-input').fill('E2E Test Todo')
    await page.getByTestId('create-todo-save').click()
    await expect(page.getByText('E2E Test Todo')).toBeVisible()
  })

  test('can toggle a todo', async ({ page }) => {
    const firstToggle = page.getByTestId(/^todo-toggle-/).first()
    const checked = await firstToggle.getAttribute('aria-checked')
    await firstToggle.click()
    // Wait for the attribute to change, not just read it immediately
    const expectedChecked = checked === 'true' ? 'false' : 'true'
    await expect(firstToggle).toHaveAttribute('aria-checked', expectedChecked)
  })
})

test.describe('Accessibility', () => {
  test('login form is keyboard accessible', async ({ page }) => {
    await page.goto('/login')
    // Tab to email, fill, Tab to password, fill, Tab to button, Enter
    await page.keyboard.press('Tab') // focus email
    await page.keyboard.type('test1@example.com')
    await page.keyboard.press('Tab') // focus password
    await page.keyboard.type('password')
    await page.keyboard.press('Tab') // focus button
    await page.keyboard.press('Enter')
    await page.waitForURL('**/')
    await expect(page.getByTestId('todos-title')).toBeVisible()
  })

  test('login error is visible on bad credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('bad@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('login-button').click()
    await expect(page.getByTestId('login-error')).toBeVisible()
  })

  test('primary actions are discoverable by role', async ({ page }) => {
    // This test uses getByRole to ensure buttons are accessible
    await page.goto('/login')
    // The login button should be findable by role + name
    const loginButton = page.getByRole('button', { name: /sign in/i })
    await expect(loginButton).toBeVisible()
  })
})
