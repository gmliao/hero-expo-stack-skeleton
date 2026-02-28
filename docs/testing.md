# Testing

> **入口**：[README Test Commands](../README.md#test-commands)  
> **CI**：`.github/workflows/ci.yml`

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

### Backend Tests（Jest）

| 類型 | 執行方式 | 驗證內容 |
|------|----------|----------|
| Unit（`*.unit.test.ts`） | 直接 `jest`，不需 Emulator | mocks 注入、handler 邏輯 |
| Integration（`auth.test.ts`、`todos.test.ts`） | `bun run test:backend`（emulators:exec） | 未登入 → 401；錯 uid → 403；getTodos / createTodo / toggleTodo 行為 |

### Web E2E（Playwright）

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
3. Playwright `webServer` 起 Expo web（port 8081）
4. 執行 `e2e-web/tests/`（排除 `console.spec.ts`）
5. baseURL：`http://127.0.0.1:8081`

#### Playwright 瀏覽器安裝

首次執行 `e2e:web` 或 `check:pw:console` 前：

```bash
bunx playwright install --with-deps chromium
```

#### 測試涵蓋

| 類別 | 情境 |
|------|------|
| Todos flow | login → create → toggle → edit → delete、filter tabs |
| Accessibility | 鍵盤操作、錯誤顯示、role/name 可發現 |

### Mobile E2E（Detox）

Happy path（iOS 優先）：

```
login → create todo → toggle todo
```

> Mobile E2E 目前為本地執行，不進 CI（成本考量）。
