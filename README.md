# Hero Expo Stack Skeleton

Production-ready reference skeleton for React Native / Expo projects with Firebase backend.
**不是 Todo App 示範，是每次開新案子直接 fork 的起點。**

---

## What is this

這個 repo 是三端一致（iOS / Android / Web）的 production skeleton。設計原則：

- **Clone 就能跑**：一條指令起 app + emulators + seed data
- **API-first**：App 不直連 Firestore，一律打 Firebase Functions
- **測試完整**：unit / backend / web e2e 都有最小可跑的測試集
- **Emulator-first**：本地與 CI 一律用 Firebase Emulators，不碰正式雲端

---

## Tech Stack

| 層級 | 技術 |
|------|------|
| App | [Expo](https://expo.dev) + [expo-router](https://expo.github.io/router) |
| UI | [Tamagui](https://tamagui.dev) + animations |
| Server State | [TanStack Query](https://tanstack.com/query) |
| UI State | [Zustand](https://zustand-demo.pmnd.rs) |
| Backend | Firebase Functions + Firestore |
| Unit Test | Jest + React Native Testing Library |
| Web E2E | Playwright |
| Mobile E2E | Detox |
| CI | GitHub Actions |

---

## Quickstart

```bash
# 0. 安裝本機必要工具（bun / Java / Firebase emulator smoke）
#    腳本會自動安裝 openjdk 並寫入 shell profile（~/.zshrc 或 ~/.bash_profile）
bash scripts/setup-prerequisites.sh

# 0b. 重新載入 shell，讓 Java PATH 生效（或開新 Terminal）
source ~/.zshrc   # zsh 用戶
# source ~/.bash_profile  # bash 用戶

# 1. 安裝依賴
bun install

# 2. 複製環境變數
cp .env.example .env

# 3. 一鍵起環境（app + emulators + seed）
bun run dev
```

> **注意：** Firebase Emulators 需要 Java。`setup-prerequisites.sh` 會自動安裝並設定 PATH。
> 若跳過 setup 腳本手動安裝，需確保 `java` 在 PATH 中（參見下方 Prerequisites）。

詳細安裝流程請看：`docs/runbooks/local-prerequisites-setup.md`

---

## Prerequisites

| 工具 | 版本需求 | 安裝方式 |
|------|----------|----------|
| [Homebrew](https://brew.sh) | 最新 | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| [Bun](https://bun.sh) | ≥ 1.1 | `brew install bun` |
| Java (JDK) | ≥ 11 | `brew install openjdk` |

**Java PATH 設定（macOS Homebrew）**

Homebrew 的 `openjdk` 是 keg-only，需手動加入 PATH：

```bash
# zsh（macOS 預設）
echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 驗證
java -version
```

`bash scripts/setup-prerequisites.sh` 會自動完成以上步驟。

---

## Environment Variables

複製 `.env.example` 並填入以下變數：

```bash
# 建議用腳本設定雲端 Firebase project id
bash scripts/firebase/setup-cloud-project.sh <your-project-id>
```

```
# Firebase（Emulator 模式下可用預設值）
FIREBASE_PROJECT_ID=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=

# App runtime（必填，給 Expo 用）
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=

# Emulator endpoints（本地開發）
EXPO_PUBLIC_USE_EMULATOR=true
```

> 若未設定 host/url，App 會自動用平台預設：Android `10.0.2.2`，其他平台 `localhost`。
> 可手動覆蓋：`EXPO_PUBLIC_AUTH_EMULATOR_HOST`、`EXPO_PUBLIC_FUNCTIONS_URL`。

---

## Project Structure

```
hero-stack-skeleton/
├── app/                         # Expo App (iOS/Android/Web)
│   ├── app/                     # expo-router routes
│   ├── src/
│   │   ├── ui/                  # Tamagui components/theme + animations
│   │   ├── data/                # api client, query keys, hooks
│   │   ├── stores/              # zustand UI-only stores
│   │   ├── features/            # feature modules (todos, auth, settings)
│   │   ├── lib/                 # helpers (logger, env, error mapping)
│   │   └── types/               # app-only types
│   ├── tests/                   # unit/integration (Jest + RNTL)
│   └── e2e/                     # Detox (mobile)
│
├── backend/
│   └── firebase/
│       ├── functions/
│       │   ├── src/
│       │   ├── tests/           # emulator integration tests
│       │   └── package.json
│       ├── firestore.rules
│       ├── firebase.json
│       └── .firebaserc.example
│
├── e2e-web/                     # Playwright (web e2e)
│   ├── tests/
│   └── playwright.config.ts
│
├── shared/
│   └── types/
│       └── api.ts               # shared API contracts (strongly typed)
│
├── scripts/
│   ├── seed-emulator.ts         # seed test users + todos
│   ├── wait-on-emulators.ts     # wait for ports ready
│   └── clean-emulator.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml               # unit + backend + web e2e
│
├── .env.example
├── package.json                 # root orchestration
└── README.md
```

---

## Local Dev Flow

### 啟動完整環境

```bash
bun run dev
# 同時啟動：Expo app + Firebase Emulators + seed script
```

### 各別啟動

```bash
# 只起 Emulators
bun run emulators

# 只起 App
bun run app

# Seed emulator 資料
bun run seed
```

### 測試帳號（Emulator）

| Email | Password |
|-------|----------|
| test1@example.com | password |
| test2@example.com | password |

---

## Test Commands

```bash
# App unit/integration tests
bun run test

# Backend emulator tests
bun run test:backend

# Web E2E（Playwright，自動起 Emulators）
bun run e2e:web

# Mobile E2E（Detox，本地執行）
bun run e2e:ios

# 完整 CI pipeline
bun run ci
```

---

## Architecture

### API-first（核心規約）

```
App → Firebase Functions (HTTP) → Firestore
       ↑
  data/api.ts
```

- App **不直連** Firestore，不做任何直接讀寫
- 所有 data fetching 透過 `data/api.ts` → Functions endpoint
- 好處：security rules 極簡、App 層不感知 DB schema

### State 分層

```
Server State  →  TanStack Query   (todos / profile / settings)
UI State      →  Zustand          (filter / modal / selected / banner)
```

**禁止**將可重抓的 server data 放進 Zustand。

### QueryKey Factory

```ts
// ❌ 禁止
useQuery({ queryKey: ['todos', uid, filter] })

// ✅ 正確
useQuery({ queryKey: queryKeys.todos.list(uid, filter) })
```

所有 query key 從 `data/queryKeys.ts` 集中管理，確保 invalidation 正確。

---

## Test Matrix

### App Unit/Integration（Jest + RNTL）

| 測試項目 | 驗證內容 |
|----------|----------|
| `queryKeys` | 穩定、可序列化、無隨機值 |
| `api client` | token 注入、401/403 mapping、timeout/retry |
| `useTodosQuery` | success / error / loading 狀態 |
| `useCreateTodoMutation` | 成功後 invalidate 正確 key |
| `zustand stores` | UI store reducer-like 行為（純函式測） |

### Backend Emulator Tests（Jest）

| 測試項目 | 驗證內容 |
|----------|----------|
| `getTodos` | 只能讀自己 uid 的資料 |
| `createTodo` | 未登入 → 401；錯 uid → 403 |
| `toggleTodo` | transaction 正確 + updatedAt 正確 |

### Web E2E（Playwright）

| 測試情境 | 步驟 |
|----------|------|
| Login | emulator auth 登入 |
| Create Todo | 建立新項目 |
| Toggle Todo | 切換完成狀態 |
| List Update | 驗證 TanStack Query invalidate/refetch |

### Mobile E2E（Detox）

Happy path（iOS 優先）：

```
login → create todo → toggle todo
```

> Mobile E2E 目前為本地執行，不進 CI（成本考量）。

---

## CI Pipeline

`.github/workflows/ci.yml` 包含三段：

```
1. App unit tests
2. Backend emulator tests
3. Web E2E (headless Playwright)
```

---

## Deployment

### Firebase Functions

```bash
# 使用 wrapper，且在 .env 設定 FIREBASE_PROJECT_ID
bun run firebase deploy --only functions
```

### App

```bash
# EAS Build (Expo)
eas build --platform all
eas submit
```

---

## Firebase Emulators

本地開發使用 Firebase Local Emulator Suite：

- **Auth Emulator**：`localhost:9099`
- **Firestore Emulator**：`localhost:8080`
- **Functions Emulator**：`localhost:5001`

所有 E2E 測試打 emulator endpoint，確保可重現且不影響正式環境。
