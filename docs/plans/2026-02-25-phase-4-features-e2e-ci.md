# Skeleton Setup — Phase 4 Features + E2E + CI + Final Verification

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver login/todos features, web E2E, CI pipeline, and final verification.

**Scope:** Original Phase 5 + Phase 6 + Phase 7 from the monolithic plan.

---

## Phase 5 — Feature Screens

### Task 14: Auth feature — login screen

> **Invoke ui-ux-pro-max skill** before implementing the login screen UI.

**Files:**
- Create: `app/app/(auth)/_layout.tsx`
- Create: `app/app/(auth)/login.tsx`
- Create: `app/src/stores/useAuthStore.ts`

**Step 1: Create auth store**

```typescript
// app/src/stores/useAuthStore.ts
import { create } from 'zustand'

interface AuthState {
  uid: string | null
  setUid: (uid: string | null) => void
}

export const useAuthStore = create<AuthState>(set => ({
  uid: null,
  setUid: uid => set({ uid }),
}))
```

**Step 2: Create `app/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

**Step 3: Create login screen**

```tsx
// app/app/(auth)/login.tsx
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YStack, Text, Input, Button, Spinner } from 'tamagui'
import { firebaseAuth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/useAuthStore'

export default function LoginScreen() {
  const { t } = useTranslation()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const setUid = useAuthStore(s => s.setUid)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
      setUid(cred.user.uid)
      router.replace('/(app)/')
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <YStack flex={1} justifyContent="center" padding="$6" backgroundColor="$background" gap="$4">
        <Text fontSize="$7" fontWeight="700" color="$color">{t('auth.signInTitle')}</Text>
        {error && <Text color="$danger">{error}</Text>}
        <Input
          testID="email-input"
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          testID="password-input"
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          testID="login-button"
          onPress={handleLogin}
          backgroundColor="$primary"
          disabled={loading}
          icon={loading ? <Spinner /> : undefined}
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </YStack>
    </SafeAreaView>
  )
}
```

**Step 4: Commit**

```bash
git add app/app/(auth)/ app/src/stores/useAuthStore.ts
git commit -m "feat: login screen with Firebase Auth emulator support"
```

---

### Task 15: Todos feature — list + create + toggle

> **Invoke ui-ux-pro-max skill** before implementing the todos screen UI.

**Files:**
- Create: `app/app/(app)/_layout.tsx`
- Create: `app/app/(app)/index.tsx`
- Create: `app/src/features/todos/TodoItem.tsx`
- Create: `app/src/features/todos/CreateTodoModal.tsx`

**Step 1: Create `app/(app)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router'

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

**Step 2: Create `TodoItem.tsx`**

```tsx
// app/src/features/todos/TodoItem.tsx
import { XStack, Text, Checkbox } from 'tamagui'
import type { Todo } from '@shared/types/api'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
}

export function TodoItem({ todo, onToggle }: Props) {
  return (
    <XStack
      testID={`todo-item-${todo.id}`}
      padding="$4"
      borderBottomWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$3"
    >
      <Checkbox
        testID={`todo-toggle-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
      />
      <Text
        flex={1}
        color="$color"
        textDecorationLine={todo.completed ? 'line-through' : 'none'}
        opacity={todo.completed ? 0.5 : 1}
      >
        {todo.title}
      </Text>
    </XStack>
  )
}
```

**Step 3: Create todos index screen**

```tsx
// app/app/(app)/index.tsx
import { YStack, XStack, Text, Button, Spinner, ScrollView } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { useToggleTodoMutation } from '@/data/hooks/useToggleTodoMutation'
import { TodoItem } from '@/features/todos/TodoItem'

export default function TodosScreen() {
  const { t } = useTranslation()
  const uid = useAuthStore(s => s.uid) ?? ''
  const { data: todos, isPending, isError } = useTodosQuery(uid)
  const toggleMutation = useToggleTodoMutation()
  const openModal = useUIStore(s => s.openCreateModal)

  if (isPending) return <Spinner size="large" color="$primary" />
  if (isError)   return <Text color="$danger">{t('todos.loadError')}</Text>

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <YStack flex={1} backgroundColor="$background">
        <XStack padding="$4" justifyContent="space-between" alignItems="center">
          <Text testID="todos-title" fontSize="$6" fontWeight="700">{t('todos.title')}</Text>
          <Button testID="create-todo-button" onPress={openModal} size="$3">{t('todos.create')}</Button>
        </XStack>
        <ScrollView>
          {todos?.map(todo => (
            <TodoItem key={todo.id} todo={todo} onToggle={id => toggleMutation.mutate(id)} />
          ))}
          {todos?.length === 0 && (
            <Text padding="$4" color="$colorSecondary" textAlign="center">
              {t('todos.empty')}
            </Text>
          )}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}
```

**Step 4: Commit**

```bash
git add app/app/(app)/ app/src/features/todos/
git commit -m "feat: todos screen — list, toggle with TanStack Query + Zustand"
```

---

## Phase 6 — E2E Tests

### Task 16: Playwright web E2E

**Files:**
- Create: `e2e-web/playwright.config.ts`
- Create: `e2e-web/tests/todos.spec.ts`

**Step 1: Install Playwright**

```bash
bun add -D @playwright/test
bunx playwright install chromium
```

**Step 2: Create `playwright.config.ts`**

```typescript
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
```

**Step 3: Create `e2e-web/tests/todos.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

// Emulators + Expo web must be running: bun run dev
test.describe('Todos flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[testID="email-input"]', 'test1@example.com')
    await page.fill('[testID="password-input"]', 'password')
    await page.click('[testID="login-button"]')
    await page.waitForURL('**/') // navigates to todos screen
  })

  test('shows todo list after login', async ({ page }) => {
    await expect(page.locator('[testID="create-todo-button"]')).toBeVisible()
  })

  test('can create a new todo', async ({ page }) => {
    await page.click('[testID="create-todo-button"]')
    await page.fill('[testID="todo-title-input"]', 'E2E Test Todo')
    await page.click('[testID="save-todo-button"]')
    await expect(page.locator('text=E2E Test Todo')).toBeVisible()
  })

  test('can toggle a todo', async ({ page }) => {
    const firstToggle = page.locator('[testID^="todo-toggle-"]').first()
    const checked = await firstToggle.getAttribute('aria-checked')
    await firstToggle.click()
    const newChecked = await firstToggle.getAttribute('aria-checked')
    expect(newChecked).not.toBe(checked)
  })
})
```

**Step 4: Run E2E (requires `bun run dev` running)**

```bash
bun run e2e:web
```

Expected: Tests pass against the running app + emulators.

**Web a11y minimum acceptance (must pass before commit)**

- Keyboard path works for core flow (`Tab` to email/password/login/create/toggle, `Enter` activates).
- Form inputs expose accessible names (via visible label or `accessibilityLabel`).
- Error state is announced (for web output, prefer `accessibilityLiveRegion="polite"` or equivalent).
- Primary actions are discoverable by role/name (Playwright can locate login/create/toggle actions without text-locale coupling).
- No obvious contrast regressions on login/todos primary UI (manual smoke in Chromium).

**Step 5: Commit**

```bash
git add e2e-web/ playwright.config.ts
git commit -m "feat: Playwright web E2E — login, create todo, toggle todo"
```

---

### Task 17: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create `ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  app-unit:
    runs-on: ubuntu-latest
    name: App Unit Tests
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Cache bun
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: bun-${{ hashFiles('app/bun.lockb') }}
      - run: cd app && bun install --frozen-lockfile
      - run: cd app && bun run test

  backend-tests:
    runs-on: ubuntu-latest
    name: Backend Emulator Tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - uses: oven-sh/setup-bun@v2
      - name: Cache Firebase emulator
        uses: actions/cache@v4
        with:
          path: ~/.cache/firebase/emulators
          key: firebase-emulators-${{ hashFiles('backend/firebase/firebase.json') }}
      - run: bun install --frozen-lockfile
      - run: cd backend/firebase/functions && bun install && bun run build
      - run: bun run test:backend
        env:
          FIREBASE_AUTH_EMULATOR_HOST: 127.0.0.1:9099
          FIRESTORE_EMULATOR_HOST: 127.0.0.1:8080
          GCLOUD_PROJECT: hero-stack-local

  web-e2e:
    runs-on: ubuntu-latest
    name: Web E2E (Playwright)
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: cd app && bun install --frozen-lockfile
      - run: cd backend/firebase/functions && bun install && bun run build
      - run: bunx playwright install --with-deps chromium
      - name: Start emulators + app
        run: |
          cd backend/firebase && bunx firebase emulators:start --only auth,firestore,functions &
          cd app && EXPO_PUBLIC_USE_EMULATOR=true bun run web &
          bun run wait-emulators
      - run: bun run seed
        env:
          FIREBASE_AUTH_EMULATOR_HOST: 127.0.0.1:9099
          FIRESTORE_EMULATOR_HOST: 127.0.0.1:8080
      - run: bun run e2e:web
        env:
          EXPO_PUBLIC_USE_EMULATOR: true
          EXPO_PUBLIC_FUNCTIONS_URL: http://127.0.0.1:5001
          EXPO_PUBLIC_FIREBASE_PROJECT_ID: hero-stack-local
          EXPO_PUBLIC_FIREBASE_API_KEY: demo-key
          EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: hero-stack-local.firebaseapp.com
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

**Step 2: Commit**

```bash
git add .github/
git commit -m "feat: GitHub Actions CI — unit + backend emulator + web e2e"
```

---

## Phase 7 — Final Wiring

### Task 18: Root `bun run dev` verification

**Step 1: Ensure `.env` exists**

```bash
cp .env.example .env
```

**Step 2: Start full environment**

```bash
bun run dev
```

Expected:
- Firebase Emulators start on ports 9099 / 8080 / 5001
- Seed creates 2 users + 3 todos
- Expo app starts at http://localhost:8081
- Expo web starts and key routes (`/login`, `/`) render
- Web login/todos flow is keyboard operable with baseline a11y checks from Task 16
- Login with `test1@example.com / password` works
- Login and todos screens render within safe-area insets (no notch/status overlap)
- UI strings resolve from i18n resources (English or zh-TW fallback path)

**Step 3: Run complete CI pipeline locally**

```bash
bun run ci
```

Expected: All 3 pipelines (unit + backend + web e2e) PASS.

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete skeleton — all tests passing, dev environment verified"
```

---

