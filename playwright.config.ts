import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-web/tests',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['html'], ['list']] : 'html',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'echo "Server should be started externally via bun run dev"',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
