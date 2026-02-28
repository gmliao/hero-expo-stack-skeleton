import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-web/tests',
  testIgnore: ['**/console.spec.ts'],
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['html'], ['list']] : 'html',
  use: {
    baseURL: 'http://127.0.0.1:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: (() => {
      const authHost = process.env.E2E_EMULATOR_AUTH_HOST
      const functionsUrl = process.env.E2E_EMULATOR_FUNCTIONS_URL
      const extra =
        authHost || functionsUrl
          ? ` EXPO_PUBLIC_AUTH_EMULATOR_HOST=${authHost ?? ''} EXPO_PUBLIC_FUNCTIONS_URL=${functionsUrl ?? ''}`
          : ''
      return `dotenv -e .env -- sh -c 'cd apps/client && CI=1 EXPO_PUBLIC_USE_EMULATOR=true EXPO_PUBLIC_FIREBASE_PROJECT_ID=hero-stack-local EXPO_PUBLIC_FIREBASE_API_KEY=\${EXPO_PUBLIC_FIREBASE_API_KEY:-demo-api-key} EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=\${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-hero-stack-local.firebaseapp.com}${extra} bun run web -- --port 8081'`
    })(),
    url: 'http://127.0.0.1:8081/login',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
