# Todo Tags — Implementation Plan (Phase 3)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓使用者能自訂 tag、為 todo 綁多個 tag、依 tag 篩選；並在設定頁以 modal 管理 tag（重新命名、刪除）。建立/編輯 todo 時可在 modal 內就地新增 tag，不跳頁。

**Architecture:** API-first（app 只經 Firebase Functions HTTP）；TanStack Query 管 server state（todos、tags），Zustand 管 UI state（filter、selectedTagId、modals）。Backend 新增 `modules/tags`（Controller → Service → Repository），Todo 的 create/update 支援 `tagIds`；Tag DELETE 在 transaction 內同步移除所有 todo 的該 tagId。

**Tech Stack:** Expo/React Native、TanStack Query、Zustand、Firebase Auth + Functions、Firestore；shared types 在 `shared/types/api.ts`；Pen 對應見 `docs/plans/2026-03-02-todo-tags/ui-design.md`、`screenshots/README.md`。

**參考規格：** `scope.md`、`ui-design.md`；驗收指令見 scope §6。

---

## 一、Shared types（API 合約）

### Task 1: 新增 Tag 與 Todo.tagIds 型別

**Files:**
- Modify: `shared/types/api.ts`
- Test: （型別無單測，由後續 API/整合測試覆蓋）

**Step 1: 在 `shared/types/api.ts` 新增 Tag、ListTagsResponse、CreateTagRequest、UpdateTagRequest；Todo 新增可選 `tagIds`；CreateTodoRequest / UpdateTodoRequest 新增可選 `tagIds`。**

```ts
// 在 Todo interface 新增
tagIds?: string[];

// 新增
export interface Tag {
  id: string;
  name: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
}

export type ListTagsResponse = Tag[];

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
}

// CreateTodoRequest 新增
tagIds?: string[];

// UpdateTodoRequest 新增
tagIds?: string[];  // 或明確支援清空為 []
```

**Step 2: 存檔後執行 `bun run check:client:ui` 或 TypeScript 編譯，確認無型別錯誤。**

**Step 3: Commit**

```bash
git add shared/types/api.ts
git commit -m "feat(tags): add Tag types and Todo.tagIds in shared api"
```

---

## 二、Backend — Tags 模組

### Task 2: Tags Firestore repository

**Files:**
- Create: `backend/firebase/functions/src/modules/tags/tags.firestore.repository.ts`
- Create: `backend/firebase/functions/tests/modules/tags/tags.repository.test.ts`（可選，或由 integration 覆蓋）

**Step 1: 撰寫 tags repository（依專案 Firestore 慣例：users/{uid}/tags/{tagId}）。**

- `list(uid)`、`create(uid, name)`、`getById(tagId)`、`update(tagId, { name })`、`delete(tagId)`。
- 使用 `firebase-admin/firestore` 的 `getFirestore()`、`FieldValue` 等（modular imports）。

**Step 2: 若有單元測試，執行 `bun run test:backend:unit`，預期通過。**

**Step 3: Commit**

```bash
git add backend/firebase/functions/src/modules/tags/tags.firestore.repository.ts
git commit -m "feat(tags): add tags Firestore repository"
```

### Task 3: Tags 型別與 schema（Zod）

**Files:**
- Create: `backend/firebase/functions/src/modules/tags/tags.types.ts`
- Create: `backend/firebase/functions/src/modules/tags/tags.schema.ts`

**Step 1: tags.types.ts 定義 DTO/介面（可從 shared 型別 re-export 或對齊）。tags.schema.ts 用 Zod 定義 body/params（create: name 非空、長度上限；update: name 同上；params: tagId）。**

**Step 2: 執行 `bun run test:backend:unit`，通過。**

**Step 3: Commit**

```bash
git add backend/firebase/functions/src/modules/tags/tags.types.ts backend/firebase/functions/src/modules/tags/tags.schema.ts
git commit -m "feat(tags): add tags types and Zod schemas"
```

### Task 4: Tags service

**Files:**
- Create: `backend/firebase/functions/src/modules/tags/tags.service.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.service.test.ts`（可選）

**Step 1: TagsService 依賴 tags repository；提供 list(uid)、create(uid, name)、update(tagId, uid, name)、delete(tagId, uid)。update/delete 前驗證 tag 屬於 uid（403）。**

**Step 2: 執行 `bun run test:backend:unit`，通過。**

**Step 3: Commit**

```bash
git add backend/firebase/functions/src/modules/tags/tags.service.ts
git commit -m "feat(tags): add tags service"
```

### Task 5: Tags controller 與路由註冊

**Files:**
- Create: `backend/firebase/functions/src/modules/tags/tags.controller.ts`
- Modify: `backend/firebase/functions/src/core/routes/index.ts`
- Modify: `backend/firebase/functions/src/core/deps.types.ts` 與 `deps.ts`（注入 TagsService）

**Step 1: 使用 defineEndpoint，auth 必驗。路徑：GET /tags、POST /tags、PATCH /tags/:tagId、DELETE /tags/:tagId。params 含 tagId；body 用 Zod schema。Controller 呼叫 TagsService，回傳 SuccessDto 格式。**

**Step 2: 在 registerControllers 註冊 TagsController；在 Deps 加入 tagsService。**

**Step 3: 執行 `bun run test:backend`（emulator），先寫一個 GET /tags 的 integration 測試（401 / 200 + 空陣列）。**

**Step 4: Commit**

```bash
git add backend/firebase/functions/src/modules/tags/tags.controller.ts backend/firebase/functions/src/core/routes/index.ts backend/firebase/functions/src/core/deps.types.ts backend/firebase/functions/src/core/deps.ts
git commit -m "feat(tags): add tags HTTP endpoints and register routes"
```

### Task 6: Todo 支援 tagIds（create/update）與 Tag DELETE 時清除 todo.tagIds

**Files:**
- Modify: `backend/firebase/functions/src/modules/todos/todos.schema.ts`（create/update body 加 tagIds 可選陣列）
- Modify: `backend/firebase/functions/src/modules/todos/todos.service.ts`（create/update 寫入 tagIds；驗證每個 tagId 屬於 uid）
- Modify: `backend/firebase/functions/src/modules/tags/tags.service.ts`（delete 時在 transaction 內：刪除 tag 文件 + 所有 todos 的 tagIds 移除該 id）

**Step 1: Todo create/update 驗證 tagIds 皆屬於該 uid（可呼叫 tags 取得現有 id 或 repository 查詢）。**

**Step 2: Tag delete：在 Firestore transaction 內刪除 tag 並更新所有含該 tagId 的 todo 文件（arrayRemove 或讀出後寫回）。**

**Step 3: 撰寫 backend 測試：todo create/update 帶 tagIds 的 happy path；tagIds 含他人 tagId 回 403；DELETE tag 後 todo 的 tagIds 已更新。執行 `bun run test:backend`。**

**Step 4: Commit**

```bash
git add backend/firebase/functions/src/modules/todos/todos.schema.ts backend/firebase/functions/src/modules/todos/todos.service.ts backend/firebase/functions/src/modules/tags/tags.service.ts
git commit -m "feat(tags): todo create/update tagIds; tag delete clears todo tagIds"
```

---

## 三、Client — API、Query keys、Hooks

### Task 7: queryKeys.tags 與 api 的 tag 方法

**Files:**
- Modify: `apps/client/src/data/queryKeys.ts`
- Modify: `apps/client/src/data/api.ts`
- Test: `apps/client/tests/data/queryKeys.test.ts`（擴充 tags 鍵穩定性）

**Step 1: queryKeys 新增 tags.all(uid)、tags.list(uid)。**

**Step 2: api 新增 getTags()、createTag(body)、updateTag(tagId, body)、deleteTag(tagId)。路徑對應 backend：/tags、POST /tags、PATCH /tags/:tagId、DELETE /tags/:tagId。使用 shared 型別。**

**Step 3: 在 queryKeys.test.ts 新增 tags 鍵的穩定序測試。執行 `bun run test`。**

**Step 4: Commit**

```bash
git add apps/client/src/data/queryKeys.ts apps/client/src/data/api.ts apps/client/tests/data/queryKeys.test.ts
git commit -m "feat(tags): add tags queryKeys and api methods"
```

### Task 8: useTagsQuery、useCreateTagMutation、useUpdateTagMutation、useDeleteTagMutation

**Files:**
- Create: `apps/client/src/data/hooks/useTagsQuery.ts`
- Create: `apps/client/src/data/hooks/useCreateTagMutation.ts`
- Create: `apps/client/src/data/hooks/useUpdateTagMutation.ts`
- Create: `apps/client/src/data/hooks/useDeleteTagMutation.ts`
- Test: `apps/client/tests/data/hooks/useTagsQuery.test.ts`、mutations 對應 test（success/error/loading 與 invalidateQueries）

**Step 1: useTagsQuery(uid) 使用 queryKeys.tags.list(uid)。Mutations 成功後 invalidateQueries(queryKeys.tags.all(uid))；delete 另 invalidateQueries(queryKeys.todos.all(uid))。**

**Step 2: 撰寫 hooks 單元測試（mock api），包含 invalidate 正確 key。執行 `bun run test`。**

**Step 3: Commit**

```bash
git add apps/client/src/data/hooks/useTagsQuery.ts apps/client/src/data/hooks/useCreateTagMutation.ts apps/client/src/data/hooks/useUpdateTagMutation.ts apps/client/src/data/hooks/useDeleteTagMutation.ts apps/client/tests/data/hooks/
git commit -m "feat(tags): add tags query and mutation hooks"
```

### Task 9: useUIStore selectedTagId 與 queryKeys.todos.list 含 selectedTagId

**Files:**
- Modify: `apps/client/src/stores/useUIStore.ts`
- Modify: `apps/client/src/data/queryKeys.ts`
- Modify: `apps/client/src/data/hooks/useTodosQuery.ts`

**Step 1: useUIStore 新增 selectedTagId: string | null、setSelectedTagId(id: string | null)。**

**Step 2: queryKeys.todos.list(uid, filter, selectedTagId?) 增加第三參數（可選）；若省略則不納入 key 以維持既有行為過渡。useTodosQuery(uid, filter, selectedTagId) 使用此 key；select 內依 selectedTagId 過濾（data.filter(t => !selectedTagId || t.tagIds?.includes(selectedTagId))）。**

**Step 3: 撰寫 useTodosQuery 與 filter 的測試（selectedTagId 過濾）。執行 `bun run test`。**

**Step 4: Commit**

```bash
git add apps/client/src/stores/useUIStore.ts apps/client/src/data/queryKeys.ts apps/client/src/data/hooks/useTodosQuery.ts apps/client/tests/data/hooks/useTodosQuery.test.ts
git commit -m "feat(tags): add selectedTagId to UI store and todos query filter"
```

---

## 四、Client — UI 元件（TagBadge、篩選列、TodoItem tagsRow）

### Task 10: AppTagBadge 元件（對應 Pen TagBadge X5rfy）

**Files:**
- Create: `apps/client/src/ui/components/AppTagBadge.tsx`
- Test: `apps/client/tests/ui/components/AppTagBadge.test.tsx`
- Modify: `apps/client/src/ui/components/index.ts`（export）

**Step 1: 實作 AppTagBadge：小 pill、約 24px 高、primarySoft 底、border、muted 字；僅顯示用（children 為 tag name）。對齊 Pen 與 ui-design 方案 A。**

**Step 2: 撰寫 render 與 accessibility 測試。執行 `bun run test`、`bun run check:client:ui`。**

**Step 3: Commit**

```bash
git add apps/client/src/ui/components/AppTagBadge.tsx apps/client/src/ui/components/index.ts apps/client/tests/ui/components/AppTagBadge.test.tsx
git commit -m "feat(tags): add AppTagBadge component"
```

### Task 11: Tag 篩選列（第二排：SectionLabel「Tags」+ All + TagBadge，橫向捲動）

**Files:**
- Create: `apps/client/src/features/todos/TagFilters.tsx`（或擴充現有篩選區）
- Modify: `apps/client/src/features/todos/` 中負責 Todos 畫面篩選的父元件（例如整合兩排：FilterTabs + TagFilters）
- Test: `apps/client/tests/features/todos/TagFilters.test.tsx`

**Step 1: 第二排：SectionLabel「Tags」+「All」連結/按鈕 + 使用 useTagsQuery 的 tag 列表，以 ScrollView horizontal 包住（對應 Pen czbJE tagFiltersScrollRow）。點「All」setSelectedTagId(null)；點某 tag setSelectedTagId(id)。選中態用 primary 填滿（TagBadgeSelected 或同款樣式）。**

**Step 2: 與第一排 Status 篩選視覺區隔（矩形 vs pill）、padding/gap 對齊 ui-design。執行 `bun run test`、`bun run check:client:ui`。**

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/TagFilters.tsx apps/client/tests/features/todos/TagFilters.test.tsx
git commit -m "feat(tags): add tag filter row with horizontal scroll"
```

### Task 12: TodoItem 顯示 tagIds（tagsRow，TagBadge 橫向）

**Files:**
- Modify: `apps/client/src/features/todos/TodoItem.tsx`
- Test: `apps/client/tests/features/todos/TodoItem.test.tsx`（可擴充含 tag 的 render）

**Step 1: 在 due 下方新增一列：若 todo.tagIds 有值且具 tags 資料（可由父層傳入 tags: Tag[] 或從 cache 取得），顯示一排 AppTagBadge（僅顯示名稱）。若 tag 多可包在 ScrollView horizontal。對應 Pen yHt9x tagsRow。**

**Step 2: 執行 `bun run test`。**

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/TodoItem.tsx
git commit -m "feat(tags): show tag badges on TodoItem"
```

---

## 五、Client — Create/Edit Modal 內 Tags 區塊

### Task 13: CreateTodoModal — Tags 區（headerRow + addTagInline + picker 橫向捲動）

**Files:**
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`
- Test: `apps/client/tests/features/todos/CreateTodoModal.test.tsx`（擴充 tags 區與新增 tag 行為）

**Step 1: 在 Due date 與按鈕列之間新增 Tags 區。版面：同一行左「Tags」、右「+ Add tag」（對應 mogtM tagsHeaderRow）。點「+ Add tag」展開 addTagInline：單行左輸入、右 [Add] 按鈕（對應 sVg67）。下方為已選/可選 tag 的 badge 列，橫向捲動（mgt40 tagsPickerScrollRow）。**

**Step 2: 狀態：selectedTagIds: string[]、addTagInlineVisible: boolean、newTagName: string。useTagsQuery(uid) 取列表；勾選/取消更新 selectedTagIds。點 [Add] 呼叫 useCreateTagMutation，成功後將新 tag 加入 selectedTagIds、清空輸入、收起 addTagInline（自動收起）。create/update mutation 的 body 帶 tagIds: selectedTagIds。**

**Step 3: modal 內容區可縱向捲動（ScrollView 或 ScrollView 包住 qbeyO 對應區），Save/Cancel 在底部。執行 `bun run test`、`bun run check:client:ui`。**

**Step 4: Commit**

```bash
git add apps/client/src/features/todos/CreateTodoModal.tsx
git commit -m "feat(tags): add Tags block and inline add-tag in CreateTodoModal"
```

### Task 14: CreateTodoModal — create/update 帶 tagIds

**Files:**
- Modify: `apps/client/src/data/hooks/useCreateTodoMutation.ts`
- Modify: `apps/client/src/data/hooks/useUpdateTodoMutation.ts`
- Modify: `shared/types/api.ts`（若 CreateTodoRequest/UpdateTodoRequest 尚未加 tagIds，已在 Task 1 完成）

**Step 1: useCreateTodoMutation 與 useUpdateTodoMutation 的 mutation 參數支援 tagIds；傳給 api.createTodo / api.updateTodo。確保 invalidate 仍含 queryKeys.todos。**

**Step 2: 執行 `bun run test`。**

**Step 3: Commit**

```bash
git add apps/client/src/data/hooks/useCreateTodoMutation.ts apps/client/src/data/hooks/useUpdateTodoMutation.ts
git commit -m "feat(tags): pass tagIds in create/update todo mutations"
```

---

## 六、Client — Options 與 Manage Tags Modal

### Task 15: Options 畫面新增「Manage tags」連結

**Files:**
- Modify: `apps/client/app/(app)/options.tsx`
- Test: `apps/client/tests/app/app/options.test.tsx`（可擴充：存在 manage-tags 連結、點擊導向）

**Step 1: 在 Options 標題與 Log out 之間加入「Manage tags」連結（Pressable + AppText 或 AppLinkAction）。onPress 導向 `/(app)/manage-tags` 或以 state 開啟 Manage Tags Modal（若採 modal 則見下任務）。對應 Pen 3MWNY。**

**Step 2: 執行 `bun run test`。**

**Step 3: Commit**

```bash
git add apps/client/app/(app)/options.tsx apps/client/tests/app/app/options.test.tsx
git commit -m "feat(tags): add Manage tags link on Options screen"
```

### Task 16: Manage Tags 畫面（modal/sheet）

**Files:**
- Create: `apps/client/app/(app)/manage-tags.tsx`（或以 Modal 元件呈現，依路由方式）
- 若為 sheet：與 CreateTodoModal 同款（SheetHandle、圓角、高度約 520）；內容：標題「Manage tags」+ 列表（每行 TagBadge + Rename + Delete）。對應 Pen CSLAp。

**Step 1: 使用 useTagsQuery(uid) 取得列表。每行：AppTagBadge(name)、OutlineButton「Rename」、Primary/Outline「Delete」。Rename 可內聯輸入或小 modal；Delete 前確認（Alert 或確認 dialog）。useUpdateTagMutation、useDeleteTagMutation；delete 後 invalidate todos。**

**Step 2: 執行 `bun run test`、`bun run check:client:ui`。**

**Step 3: Commit**

```bash
git add apps/client/app/(app)/manage-tags.tsx
git commit -m "feat(tags): add Manage Tags modal/screen with list, Rename, Delete"
```

---

## 七、i18n、E2E、驗收

### Task 17: i18n keys（todos.tags.*、options.manageTags 等）

**Files:**
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`

**Step 1: 新增 todos.tags.*（tags、addTag、manageTags、rename、delete、noTags、filterAll 等）、options.manageTags、manageTags.title 等。testID 與語系無關。**

**Step 2: 執行 `bun run test`、`bun run check:client:ui`。**

**Step 3: Commit**

```bash
git add apps/client/src/i18n/en.ts apps/client/src/i18n/zh-TW.ts
git commit -m "feat(tags): add i18n keys for tags"
```

### Task 18: E2E（Web）— 登入、建立 tag、建立帶 tag 的 todo、依 tag 篩選

**Files:**
- Modify: `e2e-web/tests/` 中現有或新增 todo-tags 流程

**Step 1: 依 scope §6 E2E：登入 → 建立 tag（或在 Create Todo 內新增）→ 建立帶 tag 的 todo → 依 tag 篩選；可選：管理標籤 Rename/Delete。使用 seeded 帳號。**

**Step 2: 執行 `bun run e2e:web`。**

**Step 3: Commit**

```bash
git add e2e-web/tests/
git commit -m "test(e2e): add todo-tags flow for web"
```

### Task 19: 驗收與文件

**Step 1: 依 scope §6 執行：`bun run test`、`bun run test:backend:unit`、`bun run test:backend`、`bun run e2e:web`；`bun run check:client:ui`、`bun run check:pw:console`、`bun run check:expo`、`bun run check:web`；必要時 `bun run ci`。**

**Step 2: 更新 `docs/design-system/pen-code-component-mapping.md` 若有必要（AppTagBadge、Manage Tags 路由）。更新 `docs/plans/2026-03-02-todo-tags/status.md` Phase 3 → 4 或完成。**

**Step 3: Commit**

```bash
git add docs/
git commit -m "docs: update pen-code mapping and todo-tags status"
```

---

## 執行方式

計畫已存至 `docs/plans/2026-03-02-todo-tags/implementation-plan.md`。兩種執行方式：

1. **Subagent-Driven（本 session）** — 使用 @superpowers:subagent-driven-development，每任務派子 agent，完成後審查再下一任務。
2. **Parallel Session（另開）** — 新 session 使用 @superpowers:executing-plans，依本計畫逐任務執行並在檢查點驗證。

完成後可依 @superpowers:finishing-a-development-branch 決定合併或 PR。
