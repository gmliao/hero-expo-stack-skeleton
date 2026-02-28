# Server 設計架構

> **入口**：[README Architecture](../README.md#architecture)

`backend/firebase/functions/src` 為 Firebase Functions 後端，採 Repository、DTO、Zod 分層。

---

## 目錄分層

| 目錄 | 用途 | 規則 |
|------|------|------|
| `handlers/` | HTTP 請求處理 | 依賴 repository、parseBody、res.json |
| `middleware/` | auth、cors 等 | 注入 `IAuthVerifier` |
| `repositories/` | 資料存取抽象 | `ITodosRepository`，實作 Firestore |
| `services/` | Auth 驗證等 | `IAuthVerifier`，實作 Firebase Admin |
| `schemas/` | Zod 驗證 schema | 所有 request body 用 Zod |
| `lib/` | validate、parseBody | 共用 helper |
| `types/` | 型別定義 | 對齊 `shared/types/api.ts` |

---

## DTO（Data Transfer Object）

- **契約來源**：`shared/types/api.ts`（App 與 Backend 共用）
- **Success**：`SuccessDto<T>` 或直接回傳 `T`
- **Failure**：`FailureDto`，含 `success: false`、`error`、可選 `message`

```ts
// shared/types/api.ts
export interface SuccessDto<T> { success: true; data: T }
export interface FailureDto { success: false; error: string; message?: string }
```

---

## Zod 驗證

- 所有 request body **必須**以 Zod schema 驗證後再寫入 Firestore
- Schema 定義在 `schemas/`（如 `todos.schema.ts`）
- 使用 `parseBody(res, body, schema)`：驗證失敗自動回 400 + `FailureDto` 並 return

```ts
// schemas/todos.schema.ts
export const createTodoSchema = z.object({
  title: z.string().min(1).transform(s => s.trim()),
  description: z.string().optional().default(''),
  dueDate: z.string().optional(),
})

// handlers/todos.ts
const data = parseBody(res, req.body, createTodoSchema)
if (!data) return  // 已送 400
```

---

## Repository 抽象

- Handler 不直接使用 Firestore，只依賴 `ITodosRepository` 等介面
- 實作（如 `TodosFirestoreRepository`）注入到 handler
- 單元測試可 mock repository，無需 Emulator

```ts
// repositories/types.ts
export interface ITodosRepository {
  findAllByUid(uid: string): Promise<Todo[]>
  create(uid: string, data: CreateTodoInput): Promise<Todo>
  findById(id: string): Promise<Todo | null>
  update(id: string, data: Partial<UpdateTodoRequest>): Promise<Todo | null>
  toggle(id: string, uid: string): Promise<Todo | null>
  delete(id: string): Promise<boolean>
}
```

---

## Auth Middleware

- 每個 endpoint 皆需驗證 Firebase Auth token
- 未登入 → `401`
- 路徑參數（如 todo id）若屬於他人 → `403`
- `IAuthVerifier` 可 mock，方便單元測試

---

## Firestore 寫入規約

- 多 document 寫入使用 transaction
- 寫入時一律設定 `updatedAt`
