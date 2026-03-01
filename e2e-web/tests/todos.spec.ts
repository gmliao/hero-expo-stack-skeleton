// React Native Web maps testID prop to data-testid attribute on the DOM.
// This file uses page.getByTestId() which is equivalent to [data-testid="..."] selector.

import { test, expect, type Locator } from '@playwright/test'

const isTodoChecked = async (toggle: Locator) => {
  const ariaChecked = await toggle.getAttribute('aria-checked')
  if (ariaChecked === 'true') return true
  if (ariaChecked === 'false') return false
  const marker = await toggle.textContent()
  return (marker ?? '').includes('✓')
}

// Root script bun run e2e:web starts Firebase emulators + Expo web server automatically.
test.describe('Todos flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test1@example.com')
    await page.getByTestId('password-input').fill('password')
    await page.getByTestId('login-button').click()
    await page.waitForURL('**/') // navigates to todos screen
    await expect(page.getByTestId('todos-title')).toBeVisible({ timeout: 15_000 })
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
    const checked = await isTodoChecked(firstToggle)
    await firstToggle.click()
    await expect
      .poll(async () => isTodoChecked(firstToggle), {
        message: 'todo checkbox should update checked state after click',
      })
      .toBe(!checked)
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
    const wasChecked = await isTodoChecked(firstToggle)
    if (!wasChecked) {
      await firstToggle.click()
      await expect
        .poll(async () => isTodoChecked(firstToggle), {
          message: 'todo checkbox should become checked',
        })
        .toBe(true)
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
    // Wait for the update PATCH (exclude /toggle endpoints) then wait for
    // the modal to close. Use a generous timeout because CI runners are slow.
    const updateDone = page.waitForResponse(
      resp => resp.request().method() === 'PATCH' && /\/api\/todos\/[^/]+$/.test(resp.url()),
      { timeout: 15_000 },
    )
    await page.getByTestId('create-todo-save').click()
    await updateDone
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(newTitle)).toBeVisible()
  })

  test('can delete a todo with confirmation', async ({ page }) => {
    const todoItems = page.getByTestId(/^todo-item-/)
    await expect(todoItems.first()).toBeVisible()
    let itemsBefore = await todoItems.count()
    if (itemsBefore === 0) {
      await page.getByTestId('create-todo-button').click()
      await page.getByTestId('create-todo-input').fill('E2E To Delete')
      await page.getByTestId('create-todo-save').click()
      await expect(page.getByText('E2E To Delete')).toBeVisible()
      itemsBefore = 1
    }
    // Accept native confirm dialog before triggering delete.
    const dialogPromise = page.waitForEvent('dialog')
    const firstDeleteBtn = page.getByTestId(/^todo-delete-/).first()
    await firstDeleteBtn.click()
    const dialog = await dialogPromise
    expect(dialog.type()).toBe('confirm')
    await dialog.accept()
    await expect(todoItems).toHaveCount(itemsBefore - 1)
  })
})

test.describe('Mutation error alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test1@example.com')
    await page.getByTestId('password-input').fill('password')
    await page.getByTestId('login-button').click()
    await page.waitForURL('**/')
    await expect(page.getByTestId('todos-title')).toBeVisible({ timeout: 15_000 })
  })

  test('shows alert when create todo fails (500 INTERNAL)', async ({ page }) => {
    await page.route('**/api/todos', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'INTERNAL', message: 'Internal error' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.getByTestId('create-todo-button').click()
    await page.getByTestId('create-todo-input').fill('Will Fail')

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 })
    await page.getByTestId('create-todo-save').click()

    const dialog = await dialogPromise
    expect(dialog.type()).toBe('alert')
    expect(dialog.message()).toContain('Internal error')
    await dialog.dismiss()
  })

  test('shows alert when toggle todo fails (404 NOT_FOUND)', async ({ page }) => {
    const firstToggle = page.getByTestId(/^todo-toggle-/).first()
    await expect(firstToggle).toBeVisible()

    await page.route('**/api/todos/*/toggle', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Todo not found' }),
      })
    })

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 })
    await firstToggle.click()

    const dialog = await dialogPromise
    expect(dialog.type()).toBe('alert')
    expect(dialog.message()).toContain('Todo not found')
    await dialog.dismiss()
  })

  test('shows alert when update todo fails (403 FORBIDDEN)', async ({ page }) => {
    const firstEditBtn = page.getByTestId(/^todo-edit-/).first()
    await expect(firstEditBtn).toBeVisible()
    await firstEditBtn.click()
    await expect(page.getByTestId('create-todo-input')).toBeVisible()

    await page.route(/\/api\/todos\/[^/]+$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'FORBIDDEN', message: 'Forbidden' }),
        })
      } else {
        await route.continue()
      }
    })

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 })
    await page.getByTestId('create-todo-input').fill('Forbidden Edit')
    await page.getByTestId('create-todo-save').click()

    const dialog = await dialogPromise
    expect(dialog.type()).toBe('alert')
    expect(dialog.message()).toContain('Forbidden')
    await dialog.dismiss()
  })

  test('shows alert when delete todo fails (500 INTERNAL)', async ({ page }) => {
    const todoItems = page.getByTestId(/^todo-item-/)
    await expect(todoItems.first()).toBeVisible()

    await page.route(/\/api\/todos\/[^/]+$/, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'INTERNAL', message: 'Internal error' }),
        })
      } else {
        await route.continue()
      }
    })

    // Accept confirm dialog, then wait for the error alert
    const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 })
    await page.getByTestId(/^todo-delete-/).first().click()
    const confirmDialog = await dialogPromise
    expect(confirmDialog.type()).toBe('confirm')
    await confirmDialog.accept()

    const alertDialog = await page.waitForEvent('dialog', { timeout: 10_000 })
    expect(alertDialog.type()).toBe('alert')
    expect(alertDialog.message()).toContain('Internal error')
    await alertDialog.dismiss()
  })
})

test.describe('Accessibility', () => {
  test('login form is keyboard accessible', async ({ page }) => {
    await page.goto('/login')
    // Focus email first, then use keyboard-only path through password and submit.
    await page.getByTestId('email-input').focus()
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
