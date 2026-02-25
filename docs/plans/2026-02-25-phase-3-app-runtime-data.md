# Skeleton Setup — Phase 3 App Runtime + Data Layer

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Expo runtime (dev-client/web), theme/providers, i18n/safe-area baseline, and app data layer.

**Scope:** Original Phase 3 + Phase 4 from the monolithic plan.

---

## Phase 3 — Expo App Setup

### Task 8: Expo app scaffolding

**Files:**
- Create: `app/package.json`
- Create: `app/app.json`
- Create: `app/babel.config.js`
- Create: `app/metro.config.js`
- Create: `app/tsconfig.json`

**Step 1: Create `app/package.json`**

```json
{
  "name": "hero-stack-app",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "start:dev-client": "expo start --dev-client",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "web": "expo start --web",
    "test": "jest --watchAll=false",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit",
    "e2e:ios": "detox test --configuration ios"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-dev-client": "~5.0.0",
    "expo-router": "~4.0.0",
    "expo-font": "~13.0.0",
    "expo-localization": "~16.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.3",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "^4.4.0",
    "i18next": "^24.2.3",
    "react-i18next": "^15.4.0",
    "firebase": "^11.0.0",
    "@tanstack/react-query": "^5.60.0",
    "zustand": "^5.0.0",
    "tamagui": "^1.121.0",
    "@tamagui/core": "^1.121.0",
    "@tamagui/config": "^1.121.0",
    "@tamagui/animations-react-native": "^1.121.0",
    "@tamagui/font-inter": "^1.121.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@tamagui/babel-plugin": "^1.121.0",
    "@tamagui/metro-plugin": "^1.121.0",
    "@types/react": "~18.3.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.8.0",
    "@testing-library/jest-native": "^5.4.3",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: Create `app/app.json`**

```json
{
  "expo": {
    "name": "HeroStack",
    "slug": "hero-stack",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "herostack",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.example.herostack"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.example.herostack"
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 3: Create `app/babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './src/ui/tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
  }
}
```

**Step 4: Create `app/metro.config.js`**

```javascript
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Allow importing from shared/
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './src/ui/tamagui.config.ts',
})
```

**Step 5: Create `app/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

**Step 6: Install deps**

```bash
cd app && bun install
```

**Step 7: Build Dev Client once per platform**

```bash
cd app
bun run ios      # builds and installs iOS dev client
# or
bun run android  # builds and installs Android dev client
```

Expected: local dev client app installed on simulator/device.

**Step 8: Start Metro for Dev Client**

```bash
cd app && bun run start:dev-client
```

Expected: Dev client can open the Metro URL and load the app.

**Step 9: Verify web runtime**

```bash
cd app && bun run web
```

Expected: app boots on `http://localhost:8081`, login/todos routes render, and no platform-specific runtime errors.

**Step 10: Commit**

```bash
git add app/package.json app/app.json app/babel.config.js app/metro.config.js app/tsconfig.json
git commit -m "feat: expo app scaffolding — SDK 52 + expo-router v4 + tamagui + dev client"
```

---

### Task 9: Tamagui theme + TamaguiProvider

> **Invoke ui-ux-pro-max skill here** to design the token values (colors, typography, radius) before implementing.

**Files:**
- Create: `app/src/ui/tamagui.config.ts`
- Create: `app/src/ui/theme/tokens.ts`
- Create: `app/src/ui/theme/fonts.ts`
- Create: `app/src/ui/theme/themes.ts`
- Create: `app/src/i18n/en.ts`
- Create: `app/src/i18n/zh-TW.ts`
- Create: `app/src/lib/i18n.ts`
- Create: `app/app/_layout.tsx`

**Step 1: Create `src/ui/theme/tokens.ts`**

```typescript
import { createTokens } from 'tamagui'

export const tokens = createTokens({
  color: {
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',  gray100: '#f3f4f6', gray200: '#e5e7eb',
    gray300: '#d1d5db', gray400: '#9ca3af', gray500: '#6b7280',
    gray600: '#4b5563', gray700: '#374151', gray800: '#1f2937', gray900: '#111827',
    blue500: '#3b82f6', blue600: '#2563eb', blue700: '#1d4ed8',
    red500: '#ef4444',  green500: '#10b981', yellow500: '#f59e0b',
  },
  space: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
    6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
  },
  size: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
    6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
  },
  radius: {
    0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 12, 6: 16, 10: 24,
  },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
})
```

**Step 2: Create `src/ui/theme/fonts.ts`**

```typescript
import { createFont } from 'tamagui'

export const interFont = createFont({
  family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  size:       { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 32 },
  lineHeight: { 1: 16, 2: 20, 3: 24, 4: 26, 5: 28, 6: 32, 7: 40 },
  weight:     { 4: '400', 5: '500', 6: '600', 7: '700' },
  letterSpacing: { 4: 0, 7: -0.5 },
})
```

**Step 3: Create `src/ui/theme/themes.ts`**

```typescript
import { tokens } from './tokens'

export const lightTheme = {
  background: tokens.color.white,
  backgroundSecondary: tokens.color.gray50,
  color: tokens.color.gray900,
  colorSecondary: tokens.color.gray600,
  borderColor: tokens.color.gray200,
  primary: tokens.color.blue500,
  primaryHover: tokens.color.blue600,
  danger: tokens.color.red500,
  success: tokens.color.green500,
}

export const darkTheme = {
  background: tokens.color.gray900,
  backgroundSecondary: tokens.color.gray800,
  color: tokens.color.white,
  colorSecondary: tokens.color.gray400,
  borderColor: tokens.color.gray700,
  primary: tokens.color.blue500,
  primaryHover: tokens.color.blue600,
  danger: tokens.color.red500,
  success: tokens.color.green500,
}
```

**Step 4: Create `src/ui/tamagui.config.ts`**

```typescript
import { createAnimations } from '@tamagui/animations-react-native'
import { createTamagui } from 'tamagui'
import { tokens } from './theme/tokens'
import { interFont } from './theme/fonts'
import { lightTheme, darkTheme } from './theme/themes'

const animations = createAnimations({
  quick:  { type: 'spring', damping: 20, mass: 1, stiffness: 200 },
  bouncy: { type: 'spring', damping: 10, mass: 1, stiffness: 100 },
  lazy:   { type: 'spring', damping: 20, mass: 1, stiffness: 60 },
})

export const tamaguiConfig = createTamagui({
  animations,
  fonts: { body: interFont, heading: interFont },
  tokens,
  themes: { light: lightTheme, dark: darkTheme },
  shouldAddPrefersColorSchemes: true,
  themeClassNameOnRoot: false,
})

export default tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends typeof tamaguiConfig {}
}
```

**Step 5: Create i18n dictionary files**

```typescript
// app/src/i18n/en.ts
export const en = {
  common: {
    loading: 'Loading...',
    retry: 'Retry',
  },
  auth: {
    signInTitle: 'Sign In',
    email: 'Email',
    password: 'Password',
    invalidCredentials: 'Invalid email or password',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
  },
  todos: {
    title: 'My Todos',
    create: '+ New',
    empty: 'No todos yet. Create one!',
    loadError: 'Failed to load todos',
  },
}
```

```typescript
// app/src/i18n/zh-TW.ts
export const zhTW = {
  common: {
    loading: '載入中...',
    retry: '重試',
  },
  auth: {
    signInTitle: '登入',
    email: '電子郵件',
    password: '密碼',
    invalidCredentials: '帳號或密碼錯誤',
    signingIn: '登入中...',
    signIn: '登入',
  },
  todos: {
    title: '我的待辦',
    create: '+ 新增',
    empty: '目前沒有待辦，先新增一筆吧！',
    loadError: '讀取待辦失敗',
  },
}
```

**Step 6: Create i18n bootstrap**

```typescript
// app/src/lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'
import { en } from '@/i18n/en'
import { zhTW } from '@/i18n/zh-TW'

const languageTag = getLocales()[0]?.languageTag ?? 'en'
const normalizedLanguage = languageTag.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: normalizedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: { translation: en },
      'zh-TW': { translation: zhTW },
    },
  })

export default i18n
```

**Step 7: Create `app/app/_layout.tsx`**

```tsx
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppState } from 'react-native'
import { focusManager } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { tamaguiConfig } from '@/ui/tamagui.config'
import i18n from '@/lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'stale',
      refetchOnMount: 'stale',
    },
    mutations: { retry: 0 },
  },
})

// Keep QueryClient in sync with app foreground/background
AppState.addEventListener('change', state => {
  focusManager.setFocused(state === 'active')
})

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme ?? 'light'}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </TamaguiProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
```

**Step 8: Start app and verify no errors**

```bash
cd app && bun run web
```

Expected: App starts on http://localhost:8081 with no console errors.

**Step 9: Commit**

```bash
git add app/src/ui/ app/src/i18n/ app/src/lib/i18n.ts app/app/_layout.tsx
git commit -m "feat: tamagui + root providers (query, i18n, safe-area)"
```

---

## Phase 4 — App Data Layer

### Task 10: Firebase client init

**Files:**
- Create: `app/src/lib/firebase.ts`
- Create: `app/src/lib/env.ts`

**Step 1: Create `src/lib/env.ts`**

```typescript
// Centralise env access. Throws at startup if required vars missing.
const required = (key: string): string => {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

export const env = {
  FIREBASE_PROJECT_ID: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  FIREBASE_API_KEY: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  USE_EMULATOR: process.env.EXPO_PUBLIC_USE_EMULATOR === 'true',
  FUNCTIONS_URL: process.env.EXPO_PUBLIC_FUNCTIONS_URL ?? 'http://127.0.0.1:5001',
}
```

**Step 2: Create `src/lib/firebase.ts`**

```typescript
import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, connectAuthEmulator, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { env } from './env'

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
}

const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0]!

export const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
})

if (env.USE_EMULATOR) {
  connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
}

export default firebaseApp
```

**Step 3: Commit**

```bash
git add app/src/lib/
git commit -m "feat: firebase auth client with emulator support"
```

---

### Task 11: API client + QueryKey factory (TDD)

**Files:**
- Create: `app/tests/data/queryKeys.test.ts`
- Create: `app/tests/data/api.test.ts`
- Create: `app/src/data/queryKeys.ts`
- Create: `app/src/data/api.ts`

**Step 1: Set up Jest in app**

Create `app/jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@unimodules|tamagui|@tamagui)',
  ],
}
```

Create `app/jest.setup.ts`:

```typescript
import '@testing-library/jest-native/extend-expect'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-uid', getIdToken: jest.fn().mockResolvedValue('mock-token') },
  })),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-uid', getIdToken: jest.fn().mockResolvedValue('mock-token') } },
}))
```

**Step 2: Write failing queryKeys tests**

```typescript
// app/tests/data/queryKeys.test.ts
import { queryKeys } from '@/data/queryKeys'

describe('queryKeys factory', () => {
  it('todos.all() is stable across calls', () => {
    expect(queryKeys.todos.all()).toEqual(queryKeys.todos.all())
    expect(JSON.stringify(queryKeys.todos.all())).toBe(JSON.stringify(queryKeys.todos.all()))
  })

  it('todos.list(uid, filter) is deterministic', () => {
    const a = queryKeys.todos.list('uid-1', 'active')
    const b = queryKeys.todos.list('uid-1', 'active')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('todos.list with different filters produce different keys', () => {
    const active = queryKeys.todos.list('uid-1', 'active')
    const all    = queryKeys.todos.list('uid-1', 'all')
    expect(JSON.stringify(active)).not.toBe(JSON.stringify(all))
  })

  it('todos.lists() is a prefix of todos.list()', () => {
    const lists = queryKeys.todos.lists()
    const list  = queryKeys.todos.list('uid-1', 'all')
    expect(list.slice(0, lists.length)).toEqual(lists)
  })

  it('no key contains undefined or null', () => {
    const serialized = JSON.stringify(queryKeys.todos.list('uid', 'all'))
    expect(serialized).not.toContain('null')
    expect(serialized).not.toContain('undefined')
  })
})
```

**Step 3: Run — expect failure**

```bash
cd app && bun run test tests/data/queryKeys.test.ts
```

Expected: FAIL — `queryKeys` not defined.

**Step 4: Implement `src/data/queryKeys.ts`**

```typescript
export const queryKeys = {
  todos: {
    all:     ()                              => ['todos']                          as const,
    lists:   ()                              => ['todos', 'list']                  as const,
    list:    (uid: string, filter?: string)  => ['todos', 'list', { uid, filter }] as const,
    details: ()                              => ['todos', 'detail']                as const,
    detail:  (id: string)                    => ['todos', 'detail', id]            as const,
  },
  profile: {
    all:     ()              => ['profile']               as const,
    current: (uid: string)   => ['profile', 'current', uid] as const,
  },
} as const
```

**Step 5: Run queryKeys tests — expect pass**

```bash
bun run test tests/data/queryKeys.test.ts
```

Expected: PASS.

**Step 6: Write failing api client tests**

```typescript
// app/tests/data/api.test.ts
import { api } from '@/data/api'

// fetchMock is auto-enabled in jest.setup.ts
global.fetch = jest.fn()

describe('api client', () => {
  beforeEach(() => jest.clearAllMocks())

  it('injects Authorization header on requests', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, json: async () => [],
    })
    await api.getTodos('user-1')
    const [, options] = (global.fetch as jest.Mock).mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer mock-token')
  })

  it('throws on 401', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }),
    })
    await expect(api.getTodos('user-1')).rejects.toThrow('Unauthorized')
  })

  it('throws on 403', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 403, json: async () => ({ error: 'Forbidden' }),
    })
    await expect(api.getTodos('user-1')).rejects.toThrow('Forbidden')
  })
})
```

**Step 7: Implement `src/data/api.ts`**

```typescript
import { firebaseAuth } from '@/lib/firebase'
import { env } from '@/lib/env'
import type { Todo, CreateTodoRequest } from '@shared/types/api'

async function getToken(): Promise<string> {
  const user = firebaseAuth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${env.FUNCTIONS_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getTodos:    (uid: string)                           => request<Todo[]>(`/todos?uid=${uid}`),
  createTodo:  (body: CreateTodoRequest)               => request<Todo>('/todos', { method: 'POST', body: JSON.stringify(body) }),
  toggleTodo:  (id: string)                            => request<Todo>(`/todos/${id}/toggle`, { method: 'PATCH' }),
}
```

**Step 8: Run all app tests**

```bash
bun run test
```

Expected: PASS.

**Step 9: Commit**

```bash
git add app/src/data/ app/tests/data/ app/jest.config.js app/jest.setup.ts
git commit -m "feat: queryKeys factory + api client with token injection and error mapping"
```

---

### Task 12: TanStack Query hooks (TDD)

**Files:**
- Create: `app/tests/data/hooks.test.ts`
- Create: `app/src/data/hooks/useTodosQuery.ts`
- Create: `app/src/data/hooks/useCreateTodoMutation.ts`
- Create: `app/src/data/hooks/useToggleTodoMutation.ts`

**Step 1: Write failing hook tests**

```typescript
// app/tests/data/hooks.test.ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTodosQuery } from '@/data/hooks/useTodosQuery'
import { useCreateTodoMutation } from '@/data/hooks/useCreateTodoMutation'
import * as api from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

jest.mock('@/data/api')

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useTodosQuery', () => {
  afterEach(() => jest.clearAllMocks())

  it('success: returns todos', async () => {
    const mockTodos = [{ id: '1', title: 'Todo', uid: 'user-1', completed: false, createdAt: '', updatedAt: '' }]
    ;(api.api.getTodos as jest.Mock).mockResolvedValueOnce(mockTodos)
    const { result } = renderHook(() => useTodosQuery('user-1'), { wrapper: makeWrapper() })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodos)
  })

  it('error: sets isError', async () => {
    ;(api.api.getTodos as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useTodosQuery('user-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useCreateTodoMutation', () => {
  it('invalidates todos.lists() on success', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries')
    ;(api.api.createTodo as jest.Mock).mockResolvedValueOnce({ id: '2', title: 'New', uid: 'u', completed: false, createdAt: '', updatedAt: '' })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children)

    const { result } = renderHook(() => useCreateTodoMutation(), { wrapper })
    result.current.mutate({ title: 'New' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.todos.lists() })
    )
  })
})
```

**Step 2: Run — expect failure**

```bash
bun run test tests/data/hooks.test.ts
```

Expected: FAIL.

**Step 3: Implement hooks**

```typescript
// app/src/data/hooks/useTodosQuery.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../queryKeys'

export function useTodosQuery(uid: string) {
  return useQuery({
    queryKey: queryKeys.todos.list(uid),
    queryFn: () => api.getTodos(uid),
    enabled: !!uid,
  })
}
```

```typescript
// app/src/data/hooks/useCreateTodoMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../queryKeys'
import type { CreateTodoRequest } from '@shared/types/api'

export function useCreateTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateTodoRequest) => api.createTodo(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.todos.lists() }),
  })
}
```

```typescript
// app/src/data/hooks/useToggleTodoMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../queryKeys'

export function useToggleTodoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.toggleTodo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.todos.lists() }),
  })
}
```

**Step 4: Run all tests — expect pass**

```bash
bun run test
```

**Step 5: Commit**

```bash
git add app/src/data/hooks/ app/tests/data/hooks.test.ts
git commit -m "feat: TanStack Query hooks — useTodosQuery, useCreateTodoMutation, useToggleTodoMutation"
```

---

### Task 13: Zustand UI store (TDD)

**Files:**
- Create: `app/tests/stores/useUIStore.test.ts`
- Create: `app/src/stores/useUIStore.ts`

**Step 1: Write failing store tests**

```typescript
// app/tests/stores/useUIStore.test.ts
import { useUIStore } from '@/stores/useUIStore'

beforeEach(() => useUIStore.setState({
  filter: 'all', selectedTodoId: null,
  isCreateModalOpen: false, banner: null,
}))

describe('useUIStore', () => {
  it('filter defaults to "all"', () => {
    expect(useUIStore.getState().filter).toBe('all')
  })

  it('setFilter updates filter', () => {
    useUIStore.getState().setFilter('active')
    expect(useUIStore.getState().filter).toBe('active')
  })

  it('openCreateModal / closeCreateModal toggle modal', () => {
    useUIStore.getState().openCreateModal()
    expect(useUIStore.getState().isCreateModalOpen).toBe(true)
    useUIStore.getState().closeCreateModal()
    expect(useUIStore.getState().isCreateModalOpen).toBe(false)
  })

  it('showBanner / clearBanner', () => {
    useUIStore.getState().showBanner('Saved!')
    expect(useUIStore.getState().banner).toBe('Saved!')
    useUIStore.getState().clearBanner()
    expect(useUIStore.getState().banner).toBeNull()
  })

  it('setSelectedTodoId', () => {
    useUIStore.getState().setSelectedTodoId('todo-123')
    expect(useUIStore.getState().selectedTodoId).toBe('todo-123')
    useUIStore.getState().setSelectedTodoId(null)
    expect(useUIStore.getState().selectedTodoId).toBeNull()
  })
})
```

**Step 2: Implement store**

```typescript
// app/src/stores/useUIStore.ts
import { create } from 'zustand'

type Filter = 'all' | 'active' | 'completed'

interface UIState {
  filter: Filter
  selectedTodoId: string | null
  isCreateModalOpen: boolean
  banner: string | null
  setFilter: (f: Filter) => void
  setSelectedTodoId: (id: string | null) => void
  openCreateModal: () => void
  closeCreateModal: () => void
  showBanner: (msg: string) => void
  clearBanner: () => void
}

export const useUIStore = create<UIState>(set => ({
  filter: 'all',
  selectedTodoId: null,
  isCreateModalOpen: false,
  banner: null,
  setFilter:          f   => set({ filter: f }),
  setSelectedTodoId:  id  => set({ selectedTodoId: id }),
  openCreateModal:    ()  => set({ isCreateModalOpen: true }),
  closeCreateModal:   ()  => set({ isCreateModalOpen: false }),
  showBanner:         msg => set({ banner: msg }),
  clearBanner:        ()  => set({ banner: null }),
}))
```

**Step 3: Run — expect pass**

```bash
bun run test
```

**Step 4: Commit**

```bash
git add app/src/stores/ app/tests/stores/
git commit -m "feat: zustand UIStore — filter, modal, banner, selectedTodoId"
```

---

