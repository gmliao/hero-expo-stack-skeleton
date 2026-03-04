// React Native Web maps testID prop to data-testid attribute on the DOM.

import { expect, test, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByTestId('email-input').fill('test1@example.com')
  await page.getByTestId('password-input').fill('password')
  await page.getByTestId('login-button').click()
  await page.waitForURL('**/')
  await expect(page.getByTestId('todos-title')).toBeVisible({ timeout: 15_000 })
}

async function openCreateTodo(page: Page) {
  await page.getByTestId('create-todo-button').click()
  await expect(page.getByTestId('create-todo-modal-title')).toBeVisible()
}

async function openCreateTagFromTodoModal(page: Page) {
  const createFirstButton = page.getByTestId('create-todo-create-first-tag')
  if (await createFirstButton.count()) {
    await createFirstButton.click()
  } else {
    await page.getByTestId('create-todo-new-tag').click()
  }

  await expect(page.getByTestId('tag-form-name-input')).toBeVisible()
}

async function submitTagForm(
  page: Page,
  {
    name,
    emoji = '📚',
    colorToken = 'tagRose',
  }: {
    name: string
    emoji?: '🧰' | '🏠' | '📚' | '⚡' | '🛒'
    colorToken?: 'tagTeal' | 'tagBlue' | 'tagGreen' | 'tagAmber' | 'tagRose'
  },
) {
  await page.getByTestId('tag-form-name-input').fill(name)
  await page.getByTestId(`tag-form-emoji-${emoji}`).click()
  await page.getByTestId(`tag-form-color-${colorToken}`).click()
  await page.getByTestId('tag-form-save').click()
  await expect(page.getByTestId('tag-form-name-input')).not.toBeVisible({ timeout: 10_000 })
}

async function createTagInsideTodoModal(
  page: Page,
  {
    name,
    emoji = '📚',
    colorToken = 'tagRose',
  }: {
    name: string
    emoji?: '🧰' | '🏠' | '📚' | '⚡' | '🛒'
    colorToken?: 'tagTeal' | 'tagBlue' | 'tagGreen' | 'tagAmber' | 'tagRose'
  },
) {
  await openCreateTagFromTodoModal(page)
  await submitTagForm(page, { name, emoji, colorToken })

  const tagChip = page.getByTestId(/^create-todo-tag-/).filter({ hasText: name })
  await expect(tagChip).toBeVisible()
  const tagTestId = await tagChip.getAttribute('data-testid')
  const tagId = tagTestId?.replace('create-todo-tag-', '') ?? ''
  expect(tagId).toBeTruthy()
  return { tagId, tagChip }
}

async function createTodo(page: Page, title: string) {
  await page.getByTestId('create-todo-input').fill(title)
  await page.getByTestId('create-todo-save').click()
  await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(title)).toBeVisible()
}

test.describe('Todo tags flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('create tag from child modal, create todo with tag, todo shows tag badge', async ({ page }) => {
    const tagName = 'E2E Tag ' + Date.now()
    const todoTitle = 'E2E Todo With Tag ' + Date.now()

    await openCreateTodo(page)
    await createTagInsideTodoModal(page, { name: tagName, emoji: '📚', colorToken: 'tagRose' })
    await createTodo(page, todoTitle)

    await expect(page.getByTestId(/^todo-tag-/).filter({ hasText: tagName }).first()).toBeVisible()
  })

  test('clicking the same todo badge toggles the shared tag filter on and off', async ({ page }) => {
    const tagName = 'E2E Filter Tag ' + Date.now()
    const taggedTitle = 'E2E Tagged Todo ' + Date.now()
    const plainTitle = 'E2E Plain Todo ' + Date.now()

    await openCreateTodo(page)
    await createTagInsideTodoModal(page, { name: tagName, emoji: '⚡', colorToken: 'tagAmber' })
    await createTodo(page, taggedTitle)

    await openCreateTodo(page)
    await page.getByTestId('create-todo-input').fill(plainTitle)
    await page.getByTestId('create-todo-save').click()
    await expect(page.getByText(plainTitle)).toBeVisible()

    const taggedItem = page.getByTestId(/^todo-item-/).filter({ hasText: taggedTitle }).first()
    const taggedBadge = taggedItem.getByTestId(/^todo-tag-/).filter({ hasText: tagName }).first()

    await taggedBadge.click()
    await expect(page.getByText(taggedTitle)).toBeVisible()
    await expect(page.getByText(plainTitle)).not.toBeVisible()

    await taggedBadge.click()
    await expect(page.getByText(taggedTitle)).toBeVisible()
    await expect(page.getByText(plainTitle)).toBeVisible()
  })

  test('options → Manage tags shows manage tags screen', async ({ page }) => {
    await page.getByTestId('todos-options-link').click()
    await page.waitForURL('**/options**')
    await expect(page.getByTestId('options-manage-tags')).toBeVisible()

    await page.getByTestId('options-manage-tags').click()
    await page.waitForURL('**/manage-tags**')
    await expect(page.getByTestId('manage-tags-title')).toBeVisible()
  })

  test('manage tags edits the full tag payload through the shared form modal', async ({ page }) => {
    const tagName = 'E2E To Edit ' + Date.now()
    const newTagName = 'E2E Edited ' + Date.now()

    await openCreateTodo(page)
    const { tagId } = await createTagInsideTodoModal(page, {
      name: tagName,
      emoji: '🧰',
      colorToken: 'tagTeal',
    })
    await page.getByTestId('create-todo-cancel').click()
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 5_000 })

    await page.getByTestId('todos-options-link').click()
    await page.waitForURL('**/options**')
    await page.getByTestId('options-manage-tags').click()
    await page.waitForURL('**/manage-tags**')
    await expect(page.getByTestId('manage-tags-title')).toBeVisible()

    await page.getByTestId(`manage-tags-edit-${tagId}`).click()
    await expect(page.getByTestId('tag-form-name-input')).toBeVisible()
    await page.getByTestId('tag-form-name-input').fill(newTagName)
    await page.getByTestId('tag-form-emoji-📚').click()
    await page.getByTestId('tag-form-color-tagRose').click()
    await page.getByTestId('tag-form-save').click()

    await expect(page.getByTestId(`manage-tags-badge-${tagId}`)).toContainText(newTagName)
  })

  test('edited tag visuals propagate to create-todo chips and todo-list badges', async ({ page }) => {
    const tagName = 'E2E Visual Source ' + Date.now()
    const editedTagName = 'E2E Visual Edited ' + Date.now()
    const todoTitle = 'E2E Visual Todo ' + Date.now()

    await openCreateTodo(page)
    const { tagId } = await createTagInsideTodoModal(page, {
      name: tagName,
      emoji: '🧰',
      colorToken: 'tagTeal',
    })
    await page.getByTestId('create-todo-cancel').click()
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 5_000 })

    await page.getByTestId('todos-options-link').click()
    await page.waitForURL('**/options**')
    await page.getByTestId('options-manage-tags').click()
    await page.waitForURL('**/manage-tags**')

    await page.getByTestId(`manage-tags-edit-${tagId}`).click()
    await page.getByTestId('tag-form-name-input').fill(editedTagName)
    await page.getByTestId('tag-form-emoji-📚').click()
    await page.getByTestId('tag-form-color-tagRose').click()
    await page.getByTestId('tag-form-save').click()
    await expect(page.getByTestId(`manage-tags-badge-${tagId}`)).toContainText(`📚 ${editedTagName}`)

    await page.getByTestId('manage-tags-back').click()
    await page.waitForURL('**/options')
    await page.getByTestId('options-back').click()
    await page.waitForURL('**/')

    await openCreateTodo(page)
    const editedChip = page.getByTestId(`create-todo-tag-${tagId}`)
    await expect(editedChip).toContainText(`📚 ${editedTagName}`)
    await expect(editedChip).toHaveCSS('border-color', 'rgb(253, 164, 175)')

    await editedChip.click()
    await createTodo(page, todoTitle)

    const item = page.getByTestId(/^todo-item-/).filter({ hasText: todoTitle }).first()
    const itemTestId = await item.getAttribute('data-testid')
    const todoId = itemTestId?.replace('todo-item-', '') ?? ''
    expect(todoId).toBeTruthy()
    const editedBadge = item.getByTestId(`todo-tag-${todoId}-${tagId}`)
    await expect(editedBadge).toContainText(`📚 ${editedTagName}`)
    await expect(editedBadge).toHaveCSS('background-color', 'rgb(255, 228, 230)')
  })

  test('edit modal pre-fills selected tags for an existing todo', async ({ page }) => {
    const tagName = 'E2E Prefill Tag ' + Date.now()
    const todoTitle = 'E2E Todo Prefill Tag ' + Date.now()

    await openCreateTodo(page)
    const { tagId } = await createTagInsideTodoModal(page, {
      name: tagName,
      emoji: '🛒',
      colorToken: 'tagGreen',
    })
    await createTodo(page, todoTitle)

    const item = page.getByTestId(/^todo-item-/).filter({ hasText: todoTitle }).first()
    await item.getByTestId(/^todo-edit-/).click()
    await expect(page.getByTestId('create-todo-modal-title')).toBeVisible()

    const selectedTagChip = page.getByTestId(`create-todo-tag-${tagId}`)
    await expect(selectedTagChip).toBeVisible()
    await selectedTagChip.click()
    await page.getByTestId('create-todo-save').click()
    await expect(page.getByTestId('create-todo-modal-title')).not.toBeVisible({ timeout: 15_000 })
    await expect(item.getByTestId(/^todo-tag-/).filter({ hasText: tagName })).toHaveCount(0)
  })
})
