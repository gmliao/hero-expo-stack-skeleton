# Testing

> **入口**：[README Test Commands](../README.md#test-commands)  
> **CI**：`.github/workflows/ci.yml`  
> **Web E2E 細則**：[Playwright Web E2E](./runbooks/playwright-web-e2e.md)  
> **Mobile E2E 細則**：[Maestro Mobile E2E](./runbooks/maestro-mobile-e2e.md)

---

## Test Matrix

### App Unit/Integration（Jest + RNTL）

| 測試項目 | 驗證內容 |
|----------|----------|
| `queryKeys` | 穩定、可序列化、無隨機值 |
| `api client` | token 注入、401/403 mapping、timeout/retry |
| `useTodosQuery` | success / error / loading 狀態 |
| `useCreateTodoMutation` | 成功後 invalidate 正確 key |
| **Edit 表單預填** | 若有「編輯」modal/表單（如 CreateTodoModal edit 模式），單元測試需涵蓋：從 cache 讀取既有資料並帶入欄位；包含 cache key 變體（如 `selectedTagId: null` vs `undefined`），並斷言 title、description、due date 等初始值正確。 |
| `zustand stores` | UI store reducer-like 行為（純函式測） |

### Backend Tests（Jest）

| 類型 | 執行方式 | 驗證內容 |
|------|----------|----------|
| Unit（`*.unit.test.ts`） | `bun run test:backend:unit`，不需 Emulator | mocks 注入、handler 邏輯 |
| Integration（`auth.test.ts`、`todos.test.ts`） | `bun run test:backend`（emulators:exec） | 未登入 → 401；錯 uid → 403；getTodos / createTodo / toggleTodo 行為 |

Backend test tree 應 mirror source layout：

- `tests/core/**`
- `tests/infrastructure/**`
- `tests/modules/**`
- `tests/integration/**`
- `tests/mocks/**` for shared test doubles

Repository implementations that depend directly on Firestore emulator behavior can stay primarily covered by integration tests, while core glue, services, schemas, and mockable infrastructure adapters should have direct unit coverage.

### Web E2E（Playwright）

> 詳細準則：[`docs/runbooks/playwright-web-e2e.md`](./runbooks/playwright-web-e2e.md)

#### 目錄結構

| 路徑 | 用途 |
|------|------|
| `e2e-web/tests/todos.spec.ts` | Todos flow + a11y 測試 |
| `e2e-web/tests/console.spec.ts` | 瀏覽器 console 錯誤檢查 |
| `e2e-web/playwright.console.config.ts` | check:pw:console 專用 config |
| `playwright.config.ts`（根目錄） | e2e:web 主 config，含 webServer |

#### 指令

| 指令 | 用途 |
|------|------|
| `bun run e2e:web` | 執行 Web E2E（自動起 Emulators + seed + Expo web + Playwright） |
| `bun run check:pw:console` | 檢查 browser console 無 `console.error` / `pageerror`（CI guard） |

#### 執行流程（e2e:web）

1. `firebase emulators:exec` 啟動 Auth / Firestore / Functions
2. `bun run seed` 寫入測試帳號與 todos
3. Playwright `webServer` 起 Expo web（port 8099）
4. 執行 `e2e-web/tests/`（排除 `console.spec.ts`）
5. baseURL：`http://127.0.0.1:8099`

#### Playwright 瀏覽器安裝

首次執行 `e2e:web` 或 `check:pw:console` 前：

```bash
bunx playwright install --with-deps chromium
```

#### 測試涵蓋

| 類別 | 情境 |
|------|------|
| Todos flow | login → create → toggle → edit → delete、filter tabs |
| **Edit 預填** | 凡有「編輯」表單（如 edit todo），E2E 需涵蓋：建立一筆已知資料 → 點編輯 → **斷言各欄位已帶入正確值**（title、description、due date、tags 等），避免 cache key 或 null/undefined 導致表單空白之 regression。 |
| Accessibility | 鍵盤操作、錯誤顯示、role/name 可發現 |

### Mobile E2E（Maestro）

Happy path（iOS 優先）：

```
login → create todo → toggle todo
```

指令：

- `bun run e2e:ios`

> Mobile E2E 目前為本地執行，不進 CI（成本考量）。

---

## Verification Policy

- 不要在未執行相關指令前宣稱完成
- 做完 feature 後，依改動類型執行對應驗證
- 若有未執行的檢查，必須明確說明原因

### Common verification commands

- `bun run test:client`
- `bun run test:backend:unit`
- `bun run check:client:ui`
- `bun run check:pw:console`
- `bun run check:expo`
- `bun run test`
- `bun run check:web`
- `bun run test:backend`
- `bun run e2e:web`
- `bun run ci`
