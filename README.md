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

> **Documentation Index**：詳見 [docs/README.md](docs/README.md)

---

## Tech Stack

| 層級 | 技術 |
|------|------|
| App | [Expo](https://expo.dev) + [expo-router](https://expo.github.io/router) |
| UI | [NativeWind](https://www.nativewind.dev) + [Gluestack UI](https://gluestack.io) + App components |
| Server State | [TanStack Query](https://tanstack.com/query) |
| UI State | [Zustand](https://zustand-demo.pmnd.rs) |
| Backend | Firebase Functions + Firestore |
| Unit Test | Jest + React Native Testing Library |
| Web E2E | Playwright |
| Mobile E2E | Detox |
| Design | [Pencil](https://pencil.so) + `.pen` files + MCP |
| CI | GitHub Actions |

---

## Quickstart

```bash
# 0. 安裝 fnm，並切到 repo 指定的 Node 20
brew install fnm
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
fnm install 20
fnm use 20

# 0b. 安裝本機必要工具（bun / Java / Firebase emulator smoke）
#    腳本會自動安裝 openjdk 並寫入 shell profile（~/.zshrc 或 ~/.bash_profile）
bash scripts/setup-prerequisites.sh

# 0c. 重新載入 shell，讓 Java PATH 生效（或開新 Terminal）
source ~/.zshrc   # zsh 用戶
# source ~/.bash_profile  # bash 用戶

# 1. 確認 Node 版本
node -v   # 預期 v20.x

# 2. 安裝依賴
bun install

# 3. 複製環境變數
cp .env.example .env

# 4. 一鍵起環境（app + emulators + seed）
bun run dev
```

> **注意：** Firebase Emulators 需要 Java。`setup-prerequisites.sh` 會自動安裝並設定 PATH。
> 若跳過 setup 腳本手動安裝，需確保 `java` 在 PATH 中（參見下方 Prerequisites）。
> Backend Functions `engines.node` 固定為 `20`。repo 根目錄已提供 `.node-version`，建議用 `fnm` 進 repo 自動切到 Node 20。

詳細安裝流程請看：`docs/runbooks/local-prerequisites-setup.md`

---

## Prerequisites

### 必要安裝（系統工具與 CLI）

| 工具 | 版本需求 | 安裝方式 |
|------|----------|----------|
| [Homebrew](https://brew.sh) | 最新 | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| [fnm](https://github.com/Schniz/fnm) | 最新 | `brew install fnm` |
| Node.js | 20.x | `fnm install 20 && fnm use 20` |
| [Bun](https://bun.sh) | ≥ 1.1 | `brew install bun` |
| Java (JDK) | ≥ 11 | `brew install openjdk` |
| Firebase CLI | 透過 bunx | 專案內 `bunx firebase --version` 即可（`bun install` 後） |

先把 `fnm` 掛進 shell，讓進入 repo 時會自動套用 `.node-version`：

```bash
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
fnm install 20
fnm use 20
node -v   # 預期 v20.x
```

一鍵安裝與驗證：

```bash
bash scripts/setup-prerequisites.sh
source ~/.zshrc   # 讓 Java PATH 生效
```

### 必要套件（專案依賴）

根目錄 `bun install` 會安裝所有依賴，包含：

| 套件 | 用途 |
|------|------|
| `firebase-tools` | Firebase CLI（Emulators、deploy） |
| `@playwright/test` | Web E2E 測試 |
| `dotenv-cli` | 載入 `.env` |
| `tsx` | 執行 TypeScript（seed 腳本） |
| `concurrently` | 並行執行 dev 腳本 |
| `wait-on` | 等待 Emulator 埠就緒 |

子專案（`apps/client`、`backend/firebase/functions`）會由 monorepo 或 `bun install` 一併處理。

### Web E2E 所需（Playwright 瀏覽器）

執行 `bun run e2e:web` 或 `bun run check:pw:console` 前，需安裝 Chromium：

```bash
bunx playwright install --with-deps chromium
```

### 選用（Mobile E2E）

執行 `bun run e2e:ios` 需 Detox 與 Xcode；詳見 `apps/client` 內設定。不進 CI。

### Java PATH 設定（macOS Homebrew）

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
├── apps/
│   └── client/                  # Expo App (iOS/Android/Web)
│       ├── app/                 # expo-router routes
│   ├── src/
│   │   ├── ui/                  # tokens + app components + providers
│   │   ├── data/                # api client, query keys, hooks
│   │   ├── stores/              # zustand UI-only stores
│   │   ├── features/            # feature modules (todos, auth, settings)
│   │   ├── lib/                 # helpers (logger, env, error mapping)
│   │   └── types/               # app-only types
│       ├── tests/               # unit/integration (Jest + RNTL)
│       └── e2e/                 # Detox (mobile)
│
├── backend/
│   └── firebase/
│       ├── functions/
│       │   ├── src/
│       │   ├── tests/           # unit + integration（integration 需 emulator）
│       │   └── package.json
│       ├── firestore.rules
│       ├── firebase.json
│       └── .firebaserc.example
│
├── e2e-web/                     # Playwright (web e2e)
│   ├── tests/
│   └── playwright.config.ts
│
├── pencil/                      # Pencil 設計檔（.pen）
│   └── app/
│       └── app-core-screens.pen # UI 設計稿 + DS 元件
│
├── docs/
│   ├── design-system/           # Pen ↔ Code mapping、color-scheme、pen-gap-spec
│   └── runbooks/                # pen-add-card-input-stack 等操作手冊
│
├── .vscode/
│   └── settings.json            # Jest virtualFolders、cSpell 等
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

### iOS Dev Client（必要一次安裝）

本專案使用 **Expo Dev Client**（不是 Expo Go）。在 **這台 Mac / 模擬器第一次跑專案時**，需要先安裝 iOS 開發版 App 一次：

```bash
cd apps/client
bunx expo run:ios
```

成功後會在 iOS Simulator 中看到 `HeroStack` App（bundle id `com.example.herostack`）。

之後日常開發流程：

```bash
# 在 repo root
bun run dev
```

再到 iOS 模擬器中打開已安裝的 `HeroStack` App，它會自動連上目前的 Metro dev server。

若你重置模擬器或把 App 刪掉，需要再跑一次 `bunx expo run:ios` 重新安裝 Dev Client。

### 測試帳號（Emulator）

| Email | Password |
|-------|----------|
| test1@example.com | password |
| test2@example.com | password |

---

## Test Commands

```bash
# Full test suite（client + backend unit + backend emulator + web e2e）
bun run test

# App unit/integration tests（apps/client）
bun run test:client

# Backend unit tests（no emulator）
bun run test:backend:unit

# Backend integration tests（需 Emulator）
bun run test:backend

# Web E2E（Playwright）
bun run e2e:web          # 自己起一組「e2e 專用」Emulator（port 9199/8180/5011）→ seed → 跑測試；與 dev 並存，無需關閉開發用 Emulator

# Mobile E2E（Detox，本地執行）
bun run e2e:ios

# 完整 CI pipeline（含各項 check）
bun run ci
```

### 子專案測試（Watch 模式）

```bash
# 僅 client（watch）
cd apps/client && bun run test:watch

# 僅 backend（watch，單元測試可直接跑；整合測試需 Emulator）
cd backend/firebase/functions && bun run test -- --watch
```

### IDE 設定（Jest）

本專案在 monorepo 內有兩個 Jest 專案，透過 `.vscode/settings.json` 的 `jest.virtualFolders` 讓 VS Code / Cursor 的 Jest 擴充同時跑 client 與 backend：

| Virtual Folder | rootPath | 說明 |
|----------------|----------|------|
| client | apps/client | React Native / Expo 單元測試（watch） |
| backend | backend/firebase/functions | Firebase Functions 單元/整合測試（watch） |

後端整合測試需 Emulator；若未起 Emulator，watch 時會顯示部分失敗。整合測試請用 `bun run test:backend`，unit tests 請用 `bun run test:backend:unit`。

### CI 相關 Check 指令

```bash
bun run check:client:ui    # 檢查 UI 元件使用規範
bun run check:pw:console   # Playwright 檢查 console 錯誤
bun run check:expo         # Expo doctor + 編譯
bun run check:web          # Web 打包
```

---

## Pencil 整合

本專案使用 [Pencil](https://pencil.so) 作為 UI 設計工具，`.pen` 檔案與 Code 元件雙向對應。設計檔：`pencil/app/app-core-screens.pen`。詳細流程、Pen ↔ Code mapping、Pencil MCP 見 [docs/design-system/pencil-integration.md](docs/design-system/pencil-integration.md)。

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

### State 分層

- **Server State** → TanStack Query（todos / profile / settings）
- **UI State** → Zustand（filter / modal / selected / banner）
- **禁止**將可重抓的 server data 放進 Zustand

### 架構詳細說明

| 層級 | 文件 |
|------|------|
| Client | [docs/architecture/client.md](docs/architecture/client.md)（目錄、API、State、QueryKey、UI 邊界） |
| Server | [docs/architecture/server.md](docs/architecture/server.md)（Repository、DTO、Zod、middleware） |

### Test Matrix

詳見 [docs/testing.md](docs/testing.md)（App / Backend / Web E2E / Mobile E2E 測試項目與執行方式）。

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

- **開發用（預設）**：Auth `9099`、Firestore `8080`、Functions `5001`
- **e2e 專用**（`bun run e2e:web`）：Auth `9199`、Firestore `8180`、Functions `5011`（與開發並存）

所有 E2E 測試打 emulator endpoint，確保可重現且不影響正式環境。**e2e:web** 使用專用 port（Auth 9199、Firestore 8180、Functions 5011），與 **dev** 的預設 port（9099/8080/5001）分開，可同時跑開發與 e2e。
