import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'console.spec.ts',
  fullyParallel: false,
  timeout: 90_000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
  },
  webServer: {
    command:
      "cd .. && dotenv -e .env -- sh -c 'cd apps/client && EXPO_PUBLIC_FIREBASE_PROJECT_ID=${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-hero-stack-local} EXPO_PUBLIC_FIREBASE_API_KEY=${EXPO_PUBLIC_FIREBASE_API_KEY:-demo-api-key} EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-localhost} bun run build:web && bunx serve -s dist -l 4173'",
    url: 'http://127.0.0.1:4173/login',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
