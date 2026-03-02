// React Native Web maps testID prop to data-testid attribute on the DOM.
// E2E: login → create tag → create todo with tag → filter by tag; optional: options → manage tags.

import { test, expect } from '@playwright/test'

test.describe('Todo tags flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test1@example.com')
    await page.getByTestId('password-input').fill('password')
    await page.getByTestId('login-button').click()
    await page.waitForURL('**/')
    await expect(page.getByTestId('todos-title')).toBeVisible({ timeout: 15_000 })
  })

  test('create tag, create todo with tag, todo shows tag badge', async ({ page }) => {
    const tagName = 'E2E Tag ' + Date.now()
    const todoTitle = 'E2E Todo With Tag ' + Date.now()

    await page.getByTestId('create-todo-button').click()
    await expect(page.getByTestId('create-todo-modal-title')).toBeVisible()

    await page.getByTestId('create-todo-add-tag').click()
    await page.getByTestId('create-todo-new-tag-input').fill(tagName)
    await page.getByTestId('create-todo-new-tag-add').click()
    await expect(page.getByTestId('create-todo-new-tag-input')).not.toBeVisible({ timeout: 10_000 })

    const tagChip = page.getByTestId(/^create-todo-tag-/).filter({ hasText: tagName })
    await expect(tagChip).toBeVisible()

    await page.getByTestId('create-todo-input').fill(todoTitle)
    await page.getByTestId('create-todo-save').click()

    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(todoTitle)).toBeVisible()
    await expect(page.getByTestId(/^todo-tag-/).filter({ hasText: tagName }).first()).toBeVisible()
  })

  test('filter by tag shows only todos with that tag', async ({ page }) => {
    const tagName = 'E2E Filter Tag ' + Date.now()
    const todoTitle = 'E2E Filtered Todo ' + Date.now()

    await page.getByTestId('create-todo-button').click()
    await expect(page.getByTestId('create-todo-modal-title')).toBeVisible()

    await page.getByTestId('create-todo-add-tag').click()
    await page.getByTestId('create-todo-new-tag-input').fill(tagName)
    await page.getByTestId('create-todo-new-tag-add').click()
    await expect(page.getByTestId('create-todo-new-tag-input')).not.toBeVisible({ timeout: 10_000 })

    const tagChip = page.getByTestId(/^create-todo-tag-/).filter({ hasText: tagName })
    await expect(tagChip).toBeVisible()
    const tagTestId = await tagChip.getAttribute('data-testid')
    const tagId = tagTestId?.replace('create-todo-tag-', '') ?? ''
    expect(tagId).toBeTruthy()

    await page.getByTestId('create-todo-input').fill(todoTitle)
    await page.getByTestId('create-todo-save').click()

    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(todoTitle)).toBeVisible()

    await page.getByTestId(`tag-filter-${tagId}`).click()
    await expect(page.getByText(todoTitle)).toBeVisible()
    await expect(page.getByTestId(/^todo-tag-/).filter({ hasText: tagName }).first()).toBeVisible()
  })

  test('options → Manage tags shows manage tags screen', async ({ page }) => {
    await page.getByTestId('todos-options-link').click()
    await page.waitForURL('**/options**')
    await expect(page.getByTestId('options-manage-tags')).toBeVisible()

    await page.getByTestId('options-manage-tags').click()
    await page.waitForURL('**/manage-tags**')
    await expect(page.getByTestId('manage-tags-title')).toBeVisible()
  })

  test('manage tags: rename tag', async ({ page }) => {
    const tagName = 'E2E To Rename ' + Date.now()
    const newTagName = 'E2E Renamed ' + Date.now()

    await page.getByTestId('create-todo-button').click()
    await page.getByTestId('create-todo-add-tag').click()
    await page.getByTestId('create-todo-new-tag-input').fill(tagName)
    await page.getByTestId('create-todo-new-tag-add').click()
    await expect(page.getByTestId('create-todo-new-tag-input')).not.toBeVisible({ timeout: 10_000 })
    const tagChip = page.getByTestId(/^create-todo-tag-/).filter({ hasText: tagName })
    await expect(tagChip).toBeVisible()
    const tagTestId = await tagChip.getAttribute('data-testid')
    const tagId = tagTestId?.replace('create-todo-tag-', '') ?? ''
    await page.getByTestId('create-todo-cancel').click()
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 5_000 })

    await page.getByTestId('todos-options-link').click()
    await page.waitForURL('**/options**')
    await page.getByTestId('options-manage-tags').click()
    await page.waitForURL('**/manage-tags**')
    await expect(page.getByTestId('manage-tags-title')).toBeVisible()

    await page.getByTestId(`manage-tags-rename-${tagId}`).click()
    await expect(page.getByTestId('manage-tags-edit-input')).toBeVisible()
    await page.getByTestId('manage-tags-edit-input').fill(newTagName)
    await page.getByTestId('manage-tags-edit-save').click()
    await expect(page.getByTestId(`manage-tags-badge-${tagId}`)).toHaveText(newTagName)
  })
})
