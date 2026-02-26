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
    const expectedChecked = checked === 'true' ? 'false' : 'true'
    await expect(firstToggle).toHaveAttribute('aria-checked', expectedChecked)
  })

  test('can create a todo with title, description and dueDate', async ({ page }) => {
    await page.getByTestId('create-todo-button').click()
    await page.getByTestId('create-todo-input').fill('E2E Full Todo')
    await page.getByTestId('create-todo-description').fill('Optional description')
    await page.getByTestId('create-todo-due-date').fill('2026-12-31')
    await page.getByTestId('create-todo-save').click()
    await expect(page.getByText('E2E Full Todo')).toBeVisible()
    await expect(page.getByText('Optional description')).toBeVisible()
  })

  test('filter tabs change list: active and completed', async ({ page }) => {
    // Ensure at least one todo, then toggle first to completed
    const firstToggle = page.getByTestId(/^todo-toggle-/).first()
    await expect(firstToggle).toBeVisible()
    const wasChecked = (await firstToggle.getAttribute('aria-checked')) === 'true'
    if (!wasChecked) {
      await firstToggle.click()
      await expect(firstToggle).toHaveAttribute('aria-checked', 'true')
    }
    const completedTitle = await firstToggle.getAttribute('aria-label')
    // Switch to completed: list should show the completed item
    await page.getByTestId('filter-tab-completed').click()
    await expect(page.getByText(completedTitle ?? '')).toBeVisible()
    // Switch to active: completed item should not be in list
    await page.getByTestId('filter-tab-active').click()
    await expect(page.getByText(completedTitle ?? '')).not.toBeVisible()
    // Back to all
    await page.getByTestId('filter-tab-all').click()
    await expect(page.getByText(completedTitle ?? '')).toBeVisible()
  })

  test('can edit a todo', async ({ page }) => {
    const firstEditBtn = page.getByTestId(/^todo-edit-/).first()
    await expect(firstEditBtn).toBeVisible()
    await firstEditBtn.click()
    await expect(page.getByTestId('create-todo-modal-title')).toBeVisible()
    await expect(page.getByTestId('create-todo-input')).toBeVisible()
    const newTitle = 'E2E Edited ' + Date.now()
    await page.getByTestId('create-todo-input').fill(newTitle)
    await page.getByTestId('create-todo-save').click()
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible()
    await expect(page.getByText(newTitle)).toBeVisible()
  })

  test('can delete a todo with confirmation', async ({ page }) => {
    let itemsBefore = await page.getByTestId(/^todo-item-/).count()
    if (itemsBefore === 0) {
      await page.getByTestId('create-todo-button').click()
      await page.getByTestId('create-todo-input').fill('E2E To Delete')
      await page.getByTestId('create-todo-save').click()
      await expect(page.getByText('E2E To Delete')).toBeVisible()
      itemsBefore = 1
    }
    // Accept native confirm dialog when delete is triggered (RN Web Alert.alert → dialog)
    page.once('dialog', d => d.accept())
    const firstDeleteBtn = page.getByTestId(/^todo-delete-/).first()
    await firstDeleteBtn.click()
    await expect(page.getByTestId(/^todo-item-/)).toHaveCount(itemsBefore - 1)
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
