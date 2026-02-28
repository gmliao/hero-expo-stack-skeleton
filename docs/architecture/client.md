# Client 設計架構

> **入口**：[README Architecture](../README.md#architecture)

`apps/client` 為 Expo（React Native）三端 App，架構遵循 API-first、State 分層、UI 邊界。

---

## 目錄分層

| 目錄 | 用途 | 規則 |
|------|------|------|
| `app/` | expo-router 路由、畫面入口 | 薄層，只做 hooks + 組合 |
| `src/ui/` | tokens、theme、`@/ui/components` | 共用 UI，無業務邏輯 |
| `src/data/` | `api.ts`、`queryKeys.ts`、TanStack Query hooks | 唯一對外 data 入口 |
| `src/stores/` | Zustand（filter、modal、selected） | 僅 UI state |
| `src/features/` | 功能模組（todos、auth、settings） | 畫面與元件、使用 data + ui |
| `src/lib/` | logger、env、error mapping | 純 helper，無 React |
| `src/types/` | App 層專用型別 | 非 shared 者 |

---

## API-first

```
App → data/api.ts → Firebase Functions (HTTP) → Firestore
```

- **禁止**在 App 內直接呼叫 Firestore（`getDoc`、`setDoc`、`onSnapshot` 等）
- **禁止**在 `app/src/` 內 `import 'firebase/firestore'`
- 所有 data 存取經由 `data/api.ts` 打 Functions HTTP endpoint
- 型別以 `shared/types/api.ts` 為準

---

## State 分層

| 類型 | 工具 | 範例 |
|------|------|------|
| Server State（可重抓） | TanStack Query | todos、profile、settings |
| UI State | Zustand | filter、modal open、selected、banner |

- **禁止**把 server data 存進 Zustand
- **禁止**用 `useState` 快取 API 回傳 → 用 `useQuery`

---

## QueryKey Factory

所有 query key 來自 `data/queryKeys.ts`，不允許 inline array。

```ts
// ❌ 禁止
useQuery({ queryKey: ['todos', uid, filter] })

// ✅ 正確
useQuery({ queryKey: queryKeys.todos.list(uid, filter) })
queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(uid) })
```

---

## UI 邊界（Client UI boundary）

- route / feature 層只能 `import` `@/ui/components`
- **禁止**在 route / feature 內 `import '@gluestack-ui/*'`
- **禁止**在 route / feature 內使用 inline `style={{...}}` 字面量
- 執行 `bun run check:client:ui` 驗證 UI 規範

---

## API Client（`data/api.ts`）

- 自動注入 Firebase Auth token：`Authorization: Bearer <token>`
- 錯誤對應：`401 → AuthError`、`403 → PermissionError`、4xx → `ApiError`
- Timeout（預設 10s）與 retry（網路錯誤 2 次，4xx 不 retry）
- 回傳型別使用 `shared/types/api.ts`
