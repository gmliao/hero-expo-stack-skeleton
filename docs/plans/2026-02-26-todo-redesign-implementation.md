# Todo 整體重設計（日式小清新 × 旅蛙風）實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 依設計文件 `docs/plans/2026-02-26-todo-redesign-ui-design.md` 實作：**註冊帳號**、功能 1+2+3（description/編輯/刪除、篩選、dueDate）、日式小清新主題、RWD（mobile/tablet/desktop 同一套元件三種排版）。

**Architecture:** API-first 不變；shared types 與 backend 新增 dueDate 與 update/delete 端點；app 端 client-side 篩選、新 theme tokens、篩選 Tab、TodoItem 擴充、新增/編輯共用 Modal、刪除確認；RWD 以 useWindowDimensions/breakpoint 驅動版面。

**Tech Stack:** React Native / Expo、Tamagui、TanStack Query、Zustand、Firebase Auth、Firebase Functions、shared/types。

---

## Phase A0 — Auth 註冊帳號

### Task 0.1: 註冊畫面（sign-up）與 i18n

**Files:**
- Create: `app/app/(auth)/sign-up.tsx`
- Modify: `app/src/i18n/en.ts`
- Modify: `app/src/i18n/zh-TW.ts`（若有）

**Step 1:** 新增 i18n key：`auth.signUpTitle`、`auth.confirmPassword`、`auth.signUp`、`auth.signingUp`、`auth.emailAlreadyInUse`、`auth.weakPassword`、`auth.passwordMismatch`、`auth.goToSignIn`（或「已有帳號？登入」）。

**Step 2:** 建立 `sign-up.tsx`：表單欄位 email、password、confirmPassword；密碼至少 6 字元、兩次密碼一致才送出；使用 `createUserWithEmailAndPassword(firebaseAuth, email, password)`；錯誤處理對應 `auth/email-already-in-use`、`auth/weak-password` 等並顯示 i18n 訊息；成功後 `setUid(cred.user.uid)` 並 `router.replace('/(app)/')`（直接進入 app）。版面與 login 一致（SafeAreaView、YStack、Input、Button），風格沿用現有 theme（之後 Phase B 會套日式小清新）。

**Step 3:** 按鈕與輸入框使用與 login 相同的 testID 風格（如 `sign-up-email-input`、`sign-up-password-input`、`sign-up-confirm-input`、`sign-up-button`），並設 `accessibilityLabel`。

**Step 4: Commit**
```bash
git add app/app/\(auth\)/sign-up.tsx app/src/i18n/en.ts app/src/i18n/zh-TW.ts
git commit -m "feat(auth): sign-up screen with email/password/confirm and i18n"
```

---

### Task 0.2: 登入頁連結到註冊、註冊頁連結到登入

**Files:**
- Modify: `app/app/(auth)/login.tsx`
- Modify: `app/app/(auth)/sign-up.tsx`

**Step 1:** 在 login 頁底部新增連結：「還沒有帳號？註冊」或 `t('auth.goToSignUp')`，點擊 `router.push('/(auth)/sign-up')`；testID 如 `login-link-sign-up`。

**Step 2:** 在 sign-up 頁底部新增連結：「已有帳號？登入」或 `t('auth.goToSignIn')`，點擊 `router.push('/(auth)/login')`；testID 如 `sign-up-link-login`。

**Step 3: Commit**
```bash
git add app/app/\(auth\)/login.tsx app/app/\(auth\)/sign-up.tsx
git commit -m "feat(auth): link login ↔ sign-up"
```

---

## Phase A — 資料與 API

### Task 1: shared/types 新增 dueDate 與 UpdateTodoRequest 欄位

**Files:**
- Modify: `shared/types/api.ts`

**Step 1:** 在 `Todo` 介面新增選填 `dueDate?: string`（ISO 或 date-only）。
**Step 2:** 在 `CreateTodoRequest` 新增選填 `dueDate?: string`。
**Step 3:** 確認 `UpdateTodoRequest` 已有 `title?`, `description?`, `completed?`，並新增 `dueDate?: string`。

**Step 4: Commit**
```bash
git add shared/types/api.ts
git commit -m "feat(types): add dueDate to Todo, CreateTodoRequest, UpdateTodoRequest"
```

---

### Task 2: Backend — Firestore 與 handlers 支援 dueDate、update、delete

**Files:**
- Modify: `backend/firebase/functions/src/types/api.d.ts`（若為手寫則與 shared 對齊，或改為從 shared 匯入）
- Modify: `backend/firebase/functions/src/handlers/todos.ts`
- Modify: `backend/firebase/functions/src/index.ts`

**Step 1:** 確保 backend 使用的 `Todo` 型別含 `dueDate?: string`（若 api.d.ts 自訂，補上 dueDate）。
**Step 2:** `createTodo`：從 `req.body` 讀取 `dueDate`（選填），寫入 Firestore；回傳的 todo 物件包含 `dueDate`。
**Step 3:** `getTodos`：從 doc 讀取 `dueDate`（若有），序列化進回傳陣列；可選：依 dueDate 排序後回傳。
**Step 4:** 新增 `updateTodo(req, res)`：PATCH 語意，從 `req.params.id` 與 `req.uid` 驗證擁有權，body 允許 `title?`, `description?`, `completed?`, `dueDate?`，只更新有送出的欄位，寫入 `updatedAt`。
**Step 5:** 新增 `deleteTodo(req, res)`：DELETE 語意，依 id 與 uid 驗證後刪除文件。
**Step 6:** 在 `index.ts` 註冊 `app.patch('/todos/:id', requireAuth, updateTodo)` 與 `app.delete('/todos/:id', requireAuth, deleteTodo)`。

**Step 7: Commit**
```bash
git add backend/firebase/functions/src
git commit -m "feat(backend): dueDate on create/get, updateTodo and deleteTodo endpoints"
```

---

### Task 3: Backend 單元測試 — updateTodo、deleteTodo、dueDate

**Files:**
- Modify: `backend/firebase/functions/tests/todos.test.ts`

**Step 1:** 新增測試：createTodo 時傳入 dueDate，getTodos 回傳含 dueDate。
**Step 2:** 新增測試：updateTodo 已登入使用者可更新 title/description/dueDate/completed；403 非擁有者；404 無此 id。
**Step 3:** 新增測試：deleteTodo 已登入使用者可刪除自己的 todo；403/404。

**Step 4:** 執行並通過
```bash
bun run test:backend
```

**Step 5: Commit**
```bash
git add backend/firebase/functions/tests/todos.test.ts
git commit -m "test(backend): updateTodo, deleteTodo, dueDate in todos"
```

---

### Task 4: App API 新增 updateTodo、deleteTodo，createTodo 傳 dueDate

**Files:**
- Modify: `app/src/data/api.ts`

**Step 1:** 在 `api` 物件新增：
  - `updateTodo: (id: string, body: UpdateTodoRequest) => request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(body) })`
  - `deleteTodo: (id: string) => request<void>(`/todos/${id}`, { method: 'DELETE' })`
**Step 2:** 在檔案頂部 import `UpdateTodoRequest` from `@shared/types/api`。
**Step 3:** 確認 `createTodo` 的 body 已支援 `description` 與 `dueDate`（型別在 CreateTodoRequest 已含）。

**Step 4: Commit**
```bash
git add app/src/data/api.ts
git commit -m "feat(app): api.updateTodo, api.deleteTodo; createTodo uses CreateTodoRequest with dueDate"
```

---

### Task 5: useTodosQuery 接受 filter，client-side 篩選與排序

**Files:**
- Modify: `app/src/data/hooks/useTodosQuery.ts`
- Modify: `app/app/(app)/index.tsx`

**Step 1:** `useTodosQuery(uid: string, filter: Filter)`：queryKey 使用 `queryKeys.todos.list(uid, filter)`；queryFn 仍呼叫 `api.getTodos(uid)`；在 hook 內對回傳陣列依 filter 篩選（all 不篩、active => !completed、completed => completed），並依 dueDate 升序排序（無 dueDate 可排最後）。
**Step 2:** 在 `index.tsx` 從 `useUIStore` 取 `filter`，傳入 `useTodosQuery(uid, filter)`。

**Step 3: Commit**
```bash
git add app/src/data/hooks/useTodosQuery.ts app/app/\(app\)/index.tsx
git commit -m "feat(app): useTodosQuery(uid, filter) with client-side filter and dueDate sort"
```

---

### Task 6: useUpdateTodoMutation、useDeleteTodoMutation

**Files:**
- Create: `app/src/data/hooks/useUpdateTodoMutation.ts`
- Create: `app/src/data/hooks/useDeleteTodoMutation.ts`

**Step 1:** `useUpdateTodoMutation`：mutate 參數 `{ id: string } & UpdateTodoRequest`，呼叫 `api.updateTodo(id, body)`，onSuccess 時 `queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })`。
**Step 2:** `useDeleteTodoMutation`：mutate 參數 `id: string`，呼叫 `api.deleteTodo(id)`，onSuccess 同上 invalidate。

**Step 3:** 撰寫單元測試：mock api，驗證 success 時 invalidation 被呼叫（可參考 useCreateTodoMutation / useToggleTodoMutation 的測試方式）。

**Step 4: Commit**
```bash
git add app/src/data/hooks/useUpdateTodoMutation.ts app/src/data/hooks/useDeleteTodoMutation.ts app/tests/
git commit -m "feat(app): useUpdateTodoMutation, useDeleteTodoMutation and tests"
```

---

## Phase B — 主題與設計系統

### Task 7: Tamagui tokens 與 theme 日式小清新色系

**Files:**
- Modify: `app/src/ui/theme/tokens.ts`
- Modify: `app/src/ui/theme/themes.ts`

**Step 1:** 在 tokens 的 color 中新增（可與既有並存，用新 key）：`backgroundWarm: '#FDF8F3'`, `surfaceWarm: '#FFFBF7'`, `primarySage: '#7BA05B'`, `primarySageSoft: '#E8F0E3'`, `textWarm: '#4A3728'`, `textWarmSecondary: '#8B7355'`, `borderWarm: '#E8DED5'`, `dangerSoft: '#C45C4A'`。
**Step 2:** 在 lightTheme 中將 background、color、borderColor、primary、danger 等改為使用上述新 token（或直接覆寫為設計文件中的 hex），使列表與按鈕呈現旅蛙風。
**Step 3:** darkTheme 可暫維持原邏輯或微調，以不影響現有 dark 使用為準。

**Step 4: Commit**
```bash
git add app/src/ui/theme/tokens.ts app/src/ui/theme/themes.ts
git commit -m "style(theme): add 日式小清新 color tokens and apply to light theme"
```

---

### Task 8: 字體 Varela Round、Nunito Sans（Web 載入 + Tamagui）

**Files:**
- Modify: `app/src/ui/theme/fonts.ts`
- Modify: `app/src/ui/tamagui.config.ts`
- Modify: `app/app/_layout.tsx` 或 Web entry（若有）以載入 Google Fonts

**Step 1:** 在 `fonts.ts` 新增 `varelaRoundFont` 與 `nunitoSansFont`（createFont），size/lineHeight 可參考現有 interFont。
**Step 2:** 在 `tamagui.config.ts` 的 fonts 中設定 `heading: varelaRoundFont`, `body: nunitoSansFont`。
**Step 3:** Web：在 `_layout.tsx` 或 index.html 中加入 Google Fonts 的 link 或 @import（Varela Round, Nunito Sans），確保 Web 能顯示。

**Step 4: Commit**
```bash
git add app/src/ui/theme/fonts.ts app/src/ui/tamagui.config.ts app/app/_layout.tsx
git commit -m "style(theme): Varela Round heading, Nunito Sans body; load fonts on web"
```

---

## Phase C — 篩選與列表 UI

### Task 9: 篩選 Tab（全部 / 未完成 / 已完成）

**Files:**
- Create: `app/src/features/todos/FilterTabs.tsx`
- Modify: `app/app/(app)/index.tsx`

**Step 1:** `FilterTabs`：接收 `value: Filter`、`onChange: (f: Filter) => void`；三個 Tab 對應 all / active / completed；使用 Tamagui 的 Tab 或自製 XStack + Button，選中態用 primary 色，未選用 text secondary；i18n key 如 `todos.filter.all` / `todos.filter.active` / `todos.filter.completed`。
**Step 2:** 在 `index.tsx` 標題列下方放入 `FilterTabs`，value 來自 `useUIStore(s => s.filter)`，onChange 來自 `setFilter`。

**Step 3: Commit**
```bash
git add app/src/features/todos/FilterTabs.tsx app/app/\(app\)/index.tsx app/src/i18n/
git commit -m "feat(todos): FilterTabs component and wire to useUIStore filter"
```

---

### Task 10: TodoItem 顯示 description、dueDate，編輯與刪除按鈕

**Files:**
- Modify: `app/src/features/todos/TodoItem.tsx`

**Step 1:** 顯示：title（既有）、若有 description 則下方小字顯示、若有 dueDate 則顯示到期日（格式依 i18n 或 YYYY-MM-DD）。
**Step 2:** 新增「編輯」按鈕：點擊時呼叫 `onEdit(todo)`（由父層傳入），用 SVG 圖示（如 Lucide Pencil），觸控目標 ≥ 44pt。
**Step 3:** 新增「刪除」按鈕：點擊時呼叫 `onDelete(todo)`（由父層傳入），用 SVG 圖示（如 Trash2），觸控目標 ≥ 44pt。
**Step 4:** 卡片樣式：圓角、淺陰影（設計文件），背景用 theme surface/background。

**Step 5: Commit**
```bash
git add app/src/features/todos/TodoItem.tsx
git commit -m "feat(todos): TodoItem shows description, dueDate; edit and delete actions"
```

---

### Task 11: 新增/編輯共用 Modal（title、description、dueDate）

**Files:**
- Modify: `app/src/features/todos/CreateTodoModal.tsx`（或更名為 CreateEditTodoModal）

**Step 1:** Modal 依 `selectedTodoId` 區分：null 為新增、有值為編輯。編輯時從 cache 或傳入的 todo 預填 title、description、dueDate。
**Step 2:** 表單欄位：title（必填）、description（選填、多行）、dueDate（選填、date input 或 date picker）。
**Step 3:** 送出：新增時呼叫 `createMutation.mutateAsync({ title, description, dueDate })`；編輯時呼叫 `updateMutation.mutateAsync({ id: selectedTodoId, title, description, dueDate })`；成功後關閉並清空 `selectedTodoId`。
**Step 4:** 關閉時清空表單並 `closeCreateModal` 且 `setSelectedTodoId(null)`。

**Step 5: Commit**
```bash
git add app/src/features/todos/CreateTodoModal.tsx
git commit -m "feat(todos): create/edit modal with title, description, dueDate"
```

---

### Task 12: 編輯與刪除流程、刪除確認

**Files:**
- Modify: `app/app/(app)/index.tsx`
- Modify: `app/src/stores/useUIStore.ts`（若需 openEditModal( todoId ) 等，可沿用 selectedTodoId + openCreateModal 或單獨 openEditModal）

**Step 1:** 列表頁：TodoItem 的 onEdit 設定為開啟編輯（setSelectedTodoId(todo.id) 並 openCreateModal 或統一開同一 Modal）；onDelete 先顯示確認（Alert.alert 或 Tamagui Dialog），確認後呼叫 deleteMutation.mutate(todo.id)。
**Step 2:** 新增按鈕：仍為「新增」，點擊時 setSelectedTodoId(null) 並 openCreateModal。

**Step 3: Commit**
```bash
git add app/app/\(app\)/index.tsx app/src/features/todos/TodoItem.tsx
git commit -m "feat(todos): wire edit/delete with confirmation dialog"
```

---

## Phase D — RWD

### Task 13: 斷點 hook 與列表/Root 版面

**Files:**
- Create: `app/src/lib/useBreakpoint.ts`（或 `app/src/hooks/useBreakpoint.ts`）
- Modify: `app/app/(app)/index.tsx`

**Step 1:** `useBreakpoint()`：使用 `useWindowDimensions()`（React Native）或 Web 上可用的 dimensions，回傳 `'mobile' | 'tablet' | 'desktop'`（&lt;768 → mobile，768–1023 → tablet，≥1024 → desktop）。
**Step 2:** 在 todos 列表外層或 Root 使用 breakpoint：desktop 時內容區 maxWidth 720 置中；tablet 可選雙欄或單欄；mobile 單欄。列表容器 padding 依 breakpoint 調整。

**Step 3: Commit**
```bash
git add app/src/lib/useBreakpoint.ts app/app/\(app\)/index.tsx
git commit -m "feat(rwd): useBreakpoint and apply to todos layout"
```

---

### Task 14: Modal/Sheet 依 breakpoint 調整（選用）

**Files:**
- Modify: `app/src/features/todos/CreateTodoModal.tsx`

**Step 1:** 當 breakpoint 為 desktop 時，Modal 可改為居中、固定寬度，而非全屏 Sheet；mobile 維持 Sheet。可透過 useBreakpoint 在 Modal 內切換呈現方式。

**Step 2: Commit**
```bash
git add app/src/features/todos/CreateTodoModal.tsx
git commit -m "feat(rwd): modal centered on desktop, sheet on mobile"
```

---

## Phase E — 測試與 E2E

### Task 15: queryKeys 與 useTodosQuery 篩選測試

**Files:**
- Modify: `app/tests/data/queryKeys.test.ts`（若有）
- Modify: `app/tests/data/hooks.test.ts`

**Step 1:** 若存在 queryKeys 測試：加入 filter 參數後 key 穩定性測試。
**Step 2:** useTodosQuery：mock api.getTodos 回傳含 completed 混合的資料，驗證傳入 filter 時回傳資料已篩選（或驗證 select 邏輯）。

**Step 3:** 執行 `bun run test`，通過後 commit。

---

### Task 16: E2E 更新（Playwright）

**Files:**
- Modify: `e2e-web/tests/todos.spec.ts`

**Step 1:** 登入後可選：新增一筆含 title、可選 description/dueDate；篩選切換後列表變化；編輯一筆；刪除一筆（含確認）。依現有 E2E 風格撰寫，使用 testID 與可達成的流程。

**Step 2:** 執行 `bun run e2e:web`，通過後 commit。

---

## 完成後

- 執行 `bun run ci` 確認整體通過。
- 設計文件已存在：`docs/plans/2026-02-26-todo-redesign-ui-design.md`。
- 實作計畫即本檔案：`docs/plans/2026-02-26-todo-redesign-implementation.md`。

**執行方式建議：**  
依 Task 1 → Task 16 順序執行；每完成一或數個 task 可 commit，必要時執行對應測試與 E2E。
