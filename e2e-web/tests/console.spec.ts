import { expect, test } from '@playwright/test'

test('web boot has no browser console errors on login route', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  await page.addInitScript(() => {
    const w = window as typeof window & { process?: { env?: Record<string, string> } }
    const nextEnv = {
      ...(w.process?.env ?? {}),
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'hero-stack-local',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
    }
    w.process = { ...(w.process ?? {}), env: nextEnv }
  })

  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('pageerror', error => {
    pageErrors.push(error.message)
  })

  await page.goto('/login')
  await expect(page.locator('body')).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})
