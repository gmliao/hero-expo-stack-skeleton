# Feature: Todo Tags — Scope & Design

**Feature slug:** todo-tags  
**Started:** 2026-03-02

---

## 1. 需求摘要

- 使用者可**自訂 tag**（預先建立清單 + 建立/編輯 todo 時可輸入新 tag 並加入清單）。
- 每個 todo 可**多個 tag**（多選）。
- **依 tag 篩選**：與現有「全部 / 進行中 / 已完成」**分開兩區、同時生效**（例如：進行中 + 選「工作」= 未完成且帶「工作」tag 的 todo）。
- Tag 支援**重新命名**與**刪除**（刪除時從所有 todo 的 tagIds 移除該 id）。

---

## 2. 資料模型與架構

### Tag（獨立資源）

- 儲存：`users/{uid}/tags/{tagId}`（或專用 `tags` 集合帶 `uid`）。
- 欄位：`id`、`name`、`uid`、`createdAt`、`updatedAt`。
- 僅能操作自己的 tags。

### Todo 與 Tag

- Todo 新增：`tagIds: string[]`（可為空陣列）。
- List/Get 回傳 `tagIds`；可選由 backend 組好 `tags: { id, name }[]`。

### API

- App 不直連 Firestore；所有讀寫經 Firebase Functions HTTP。
- 篩選：後端可回傳全部 todos，由 client 依 `filter` + `selectedTagId` 過濾；或後端支援 `filter` + `tagId` 參數。

---

## 3. 後端 API 與權限

- 所有 endpoint 驗證 Firebase Auth token；僅允許操作自己的資源（uid 來自 token），否則 401/403。

### Tag API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/users/:uid/tags` 或 `/api/tags` | 回傳該使用者 tag 列表 `{ id, name, createdAt, updatedAt }[]` |
| POST | `/api/users/:uid/tags` 或 `/api/tags` | Body: `{ name }`；驗證非空、長度上限；建立後回傳新 tag |
| PATCH | `/api/tags/:tagId` | Body: `{ name }`；重新命名，僅更新 tag 文件 |
| DELETE | `/api/tags/:tagId` | 刪除 tag，並在同一 transaction/batch 內從所有 todo 的 `tagIds` 移除此 id |

### Todo API 變更

- Create：body 可選 `tagIds?: string[]`；驗證每個 tagId 屬於該 uid。
- Update：可選 `tagIds?: string[]`；同上；支援清空為 `[]`。
- List/Get：回傳每筆 todo 含 `tagIds`（可選帶出 `tags: { id, name }[]`）。

### 錯誤

- 沿用 `FailureDto`；tag 不存在或非本人 → 403/400，明確 `code`。

---

## 4. Client：狀態、資料流、篩選

### Query keys

- 新增 `tags`：`tags.all(uid)`、`tags.list(uid)`。
- Todos：`queryKeys.todos.list(uid, filter, selectedTagId)`；若後端不支援 tag 篩選，則在 `select` 內依 `selectedTagId` 過濾。

### Zustand

- `useUIStore` 新增：`selectedTagId: string | null`（預設 `null`）、`setSelectedTagId(id: string | null)`。

### 篩選

- 第一排：FilterTabs（全部 / 進行中 / 已完成）。
- 第二排：Tag 篩選 —「全部」+ 使用者所有 tag 的 chip；選「全部」= `selectedTagId === null`。
- `useTodosQuery`：queryKey 含 `selectedTagId`；若後端不支援則在 select 中依 `tagIds.includes(selectedTagId)` 過濾。

### 建立/編輯 Todo 的 tag 選擇

- 多選既有 tag +「新增標籤」輸入框；輸入後呼叫 create tag API，成功後加入列表並可勾選。
- Create/Update todo 的 body 帶 `tagIds`。

### Invalidation

- Tag 建立/更新/刪除後：`invalidateQueries(queryKeys.tags.all(uid))`；刪除 tag 後另 `invalidateQueries(queryKeys.todos.all(uid))`。

---

## 5. UI/UX

- **兩排篩選**：第一排狀態、第二排 tag，視覺區隔，行為同時生效。
- **Tag 管理**：建立 tag 在建立/編輯 todo 時；重新命名與刪除入口為「設定 → 管理標籤」（或同級入口），每筆可重新命名 / 刪除，刪除前確認。
- **i18n**：`todos.tags.*` 等 key，中英齊全；`testID` 與語系無關。
- **空狀態**：無 tag 時第二排只顯示「全部」；選某 tag 無結果時可顯示「沒有帶此標籤的項目」。
- **a11y**：Tag chip 與「全部」具 `accessibilityLabel`；鍵盤/焦點與刪除確認流程明確。

---

## 6. 錯誤處理與測試驗收

### 錯誤

- API 錯誤經現有 api client 映射後以 banner 或 inline 顯示；tag create/PATCH/DELETE 失敗同上。

### Client 單元測試

- queryKeys 穩定、可序列化。
- useTagsQuery、useCreateTagMutation、useUpdateTagMutation、useDeleteTagMutation：success/error/loading 與 invalidate 正確。
- useUIStore selectedTagId 行為。
- useTodosQuery / filterAndSortTodos 在 selectedTagId 不為 null 時正確過濾。

### Backend 測試

- Tag：GET/POST/PATCH/DELETE 的 401、403、happy path；DELETE 後 todo 的 tagIds 已更新（integration）。
- Todo：create/update 帶 tagIds 的 happy path 與非法 tagId（400/403）；tagIds 邊界（[]、省略）。

### E2E（Web）

- 登入 → 建立 tag / 建立帶 tag 的 todo → 依 tag 篩選 → 可選：編輯 tag、管理標籤重新命名與刪除。

### 驗收前指令

- `bun run test`、`bun run test:backend:unit`、`bun run test:backend`、`bun run e2e:web`；`check:client:ui`、`check:pw:console`、`check:expo`、`check:web`；必要時 `bun run ci`。

---

## 7. 邊界與取捨

- **同 uid 下 tag name 是否唯一**：可選；若採用則 POST 重複 name 回 409 或 400。
- **後端 list 是否支援 ?tagId=**：可先 client 過濾，之後再擴充後端以減少傳輸。
- **管理標籤入口**：約定為設定頁「Manage tags」；點擊後以 **modal/sheet** 開啟（與 Create Todo Modal 同款），不跳整頁。建立 tag 僅在建立/編輯 todo 時於 modal 內就地新增。
- **「+ Add tag」在 Modal 內（重要）：** 建立/編輯 todo 的 modal 裡點「+ Add tag」**不得**跳轉到整頁「管理標籤」，否則會打斷流程。應**就地**處理：例如在 tag 列下方展開一個輸入框「新標籤名稱」+ 確認，或彈出小 overlay/dialog，建立成功後新 tag 出現在同 modal 的 tag 多選列並可勾選，**不離開 modal**。整頁「管理標籤」僅從 Options 進入，用於重新命名、刪除、檢視清單。
