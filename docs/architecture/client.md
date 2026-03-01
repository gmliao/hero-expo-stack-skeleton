# Client Architecture Rules

> **入口**：[README Architecture](../README.md#architecture)
>  
> **相關規範**：
> [Testing](../testing.md),
> [Playwright Web E2E](../runbooks/playwright-web-e2e.md),
> [Design System Workflow](../design-system/workflow.md)

`apps/client` 是 Expo app 的實作邊界。這份文件是 client 端必守規範，不是建議清單。

## Directory Boundaries

| 路徑 | 用途 | 硬規則 |
|------|------|------|
| `app/` | expo-router route files | 薄層，只做 hooks、handler、組合 |
| `src/features/` | feature screen UI 與 feature components | 可用 `data`、`stores`、`ui`，避免重新發明 DS |
| `src/ui/` | design tokens、theme、`@/ui/components` | 共用 UI，無業務邏輯 |
| `src/data/` | `api.ts`、query key factory、TanStack Query hooks | 唯一 server data 入口 |
| `src/stores/` | Zustand UI state | 只放 UI state，不放 server state |
| `src/lib/` | helper、env、logger、error mapping | 純工具，不放 React flow |
| `shared/types/` | app/backend shared contract | API 契約單一來源 |

## API-First Is Mandatory

資料流固定是：

```text
App -> data/api.ts -> Firebase Functions (HTTP) -> Firestore
```

規則：

- app code 不得直接讀寫 Firestore
- 不得在 app code 引入 `firebase/firestore`
- app 的 API contract 以 `shared/types/api.ts` 為準
- `data/api.ts` 必須解析 `FailureDto`，並映射成 typed errors

## State Split

| 類型 | 工具 | 範例 |
|------|------|------|
| Server state | TanStack Query | todos、profile、settings |
| UI state | Zustand | filter、modal、selectedTodoId、banner |

規則：

- server state 不得存入 Zustand
- 不要用 `useState` 快取 API data
- query keys 一律來自 `apps/client/src/data/queryKeys.ts`
- 不允許在 hooks 或 components 內手寫 query key array

## API Client Rules

`apps/client/src/data/api.ts` 必須：

- 自動注入 Firebase Auth token
- 映射 `401 -> AuthError`、`403 -> PermissionError`
- 為網路/timeout 類錯誤做有限 retry，不對 4xx retry
- 對 mutation fail path 提供可觀察的 error surface，避免 E2E 只能靠 timeout 推測失敗

## UI Boundary Rules

route / feature 層：

- 只能從 `@/ui/components` 使用 UI
- 不得直接引入 `@gluestack-ui/*`
- 不得塞 inline `style={{...}}` 字面量
- UI 變更後執行 `bun run check:client:ui`

## UI Baseline Rules

- i18n 從一開始就必須存在，不要硬寫使用者可見字串
- 全螢幕 mobile route 必須有 safe area：
  - root 包 `SafeAreaProvider`
  - screen 用 `SafeAreaView` 並明確設 `edges`
- `testID` 必須與 locale 無關
- Web 是一級目標，做完 feature 要能在 web smoke check
- app code 新增 import 的套件，必須列在 `apps/client/package.json`
- Web 可及性基線必須成立：
  - login/create/toggle 核心 flow 可用鍵盤完成
  - 輸入與動作具有 accessible name
  - 錯誤有可宣告的 UI surface

## Styling Rules

- 優先使用 NativeWind `className`
- 只有在 NativeWind 不適合時才用 `StyleSheet`
- route file 保持薄，不要把大段 layout/樣式直接堆在 route 內
- screen-specific UI 抽到 `src/features/<feature>/`

## Route Structure Rules

- root route file 可以是純 redirect
- nested route file 只負責 orchestrate，不負責大量畫面細節
- 共用畫面 primitives 一律回到 `@/ui/components`

## Verification For Client Work

依改動類型至少執行：

- `bun run check:client:ui`
- `bun run check:web`
- `bun run test`
- `bun run e2e:web`

如果改到 Playwright 測試或 Web 失敗路徑，再讀 [Playwright Web E2E](../runbooks/playwright-web-e2e.md)。
