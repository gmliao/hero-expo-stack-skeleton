import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-web/tests',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
