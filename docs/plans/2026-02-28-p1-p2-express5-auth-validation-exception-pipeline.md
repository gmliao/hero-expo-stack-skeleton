# P1/P2 + Express 5 Auth/Validation/Exception Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修復 P1/P2 四個問題（Express async 錯誤處理、logout 失敗仍清 state、login/sign-up 空白送出無回饋），並建立「預設全域 auth + Zod 驗證 middleware + 統一 exception middleware → FailureDto」的後端 pipeline。

**Architecture:** Backend 升級 Express 5（原生處理 async promise rejection），採用「CORS/OPTIONS → JSON → requireAuth_global → validateBody(schema) → handlers → exceptionMiddleware」；handlers/middleware 以 throw `HttpError` 表達 4xx/5xx，由 exception middleware 統一轉換為 `FailureDto`。Client 端修正 logout/表單驗證 UX，補 i18n 與單元測試。

**Tech Stack:** Express 5, Firebase Functions v2, Zod, Jest（backend+client）, React Native Testing Library, Expo Router, i18next。

---

### Task 1: 建立後端錯誤型別（HttpError 家族）

**Files:**
- Create: `backend/firebase/functions/src/lib/errors.ts`
- Test: `backend/firebase/functions/tests/lib.errors.unit.test.ts`（新增）

**Step 1: Write the failing test**

建立 `lib.errors.unit.test.ts`，先寫最小測試：`NotFoundError` 應含 `statusCode=404`；`UnauthorizedError` 應支援 `code`。

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（找不到 `errors.ts` 或 import 失敗）。

**Step 3: Write minimal implementation**

在 `errors.ts` 加入最小可用實作（範例骨架）：

```ts
export class HttpError extends Error {
  statusCode: number
  code?: string
  constructor(statusCode: number, message: string, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(400, message, code)
  }
}
export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code)
  }
}
export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code)
  }
}
export class NotFoundError extends HttpError {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(404, message, code)
  }
}
```

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS for `lib.errors.unit.test.ts`。

**Step 5: Commit**

（若要 commit）
- `git add backend/firebase/functions/src/lib/errors.ts backend/firebase/functions/tests/lib.errors.unit.test.ts`
- `git commit -m "test(backend): add HttpError base types"`

---

### Task 2: 新增統一 exception middleware（FailureDto 單一出口）

**Files:**
- Create: `backend/firebase/functions/src/middleware/error.ts`
- Reference: `backend/firebase/functions/src/types/api.d.ts`（後端用的 DTO 型別宣告；需與 `shared/types/api.ts` 同步）
- Test: `backend/firebase/functions/tests/middleware.error.unit.test.ts`（新增）

**Step 1: Write the failing test**

`middleware.error.unit.test.ts` 覆蓋：
- `HttpError(404)` → 回 `status=404` 且 body 符合 `FailureDto`（至少 `success:false` + `error`）
- unknown error → `status=500` + `FailureDto`

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（找不到 middleware 或 export）。

**Step 3: Write minimal implementation**

`middleware/error.ts`（最小可用版）：

```ts
import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../lib/errors'
import type { FailureDto } from '../types/api'

export function exceptionMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    const body: FailureDto = {
      success: false,
      error: err.message,
      code: err.code,
      message: err.message,
    }
    res.status(err.statusCode).json(body)
    return
  }

  const body: FailureDto = {
    success: false,
    error: 'Internal server error',
  }
  res.status(500).json(body)
}
```

（若專案有 logger，unknown error 分支再補 logger；但不要用 `console.log`。）

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 5: Commit**

（若要 commit）
- `git add backend/firebase/functions/src/middleware/error.ts backend/firebase/functions/tests/middleware.error.unit.test.ts`
- `git commit -m "test(backend): add exception middleware for FailureDto"`

---

### Task 3: Zod validateBody middleware（Nest-like ValidationPipe）

**Files:**
- Modify: `backend/firebase/functions/src/lib/validate.ts`（新增 `validateBody`，之後可移除 `parseBody`）
- Test: `backend/firebase/functions/tests/middleware.validateBody.unit.test.ts`（新增）
- Modify: `backend/firebase/functions/src/schemas/todos.schema.ts`（沿用既有 schema）

**Step 1: Write the failing test**

`middleware.validateBody.unit.test.ts` 覆蓋：
- body 不符合 schema → middleware **reject/throw `BadRequestError`**
- body 符合 schema → `req.validatedBody` 存在且為 schema transform 後的值（例如 `title.trim()`）

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（`validateBody` 尚未存在）。

**Step 3: Write minimal implementation**

在 `lib/validate.ts` 新增（概念版）：

```ts
import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { BadRequestError } from './errors'

export type ValidatedBodyRequest<T> = Request & { validatedBody: T }

export function validateBody<T>(schema: ZodSchema<T>) {
  return function _validateBody(req: Request, _res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      const message = first?.message ?? 'Validation failed'
      throw new BadRequestError(message)
    }
    ;(req as any).validatedBody = parsed.data
    next()
  }
}
```

（後續再把 `(req as any)` 改成在 handler 端用 `AuthenticatedRequest & ValidatedBodyRequest<T>` 做型別收斂。）

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 5: Commit**

（若要 commit）
- `git add backend/firebase/functions/src/lib/validate.ts backend/firebase/functions/tests/middleware.validateBody.unit.test.ts`
- `git commit -m "test(backend): add validateBody middleware with zod"`

---

### Task 4: requireAuth 改為「全域 middleware」且失敗改 throw（B 策略）

**Files:**
- Modify: `backend/firebase/functions/src/index.ts`
- Modify: `backend/firebase/functions/src/middleware/auth.ts`
- Modify: `backend/firebase/functions/tests/middleware.auth.unit.test.ts`

**Step 1: Write the failing test**

更新 `middleware.auth.unit.test.ts`：\n
- 缺 Authorization header → `requireAuth(...)` 應 **reject/throw `UnauthorizedError`**（不再呼叫 `res.status/json`）\n
- verifier throws → `UnauthorizedError` 且 `code` 應為 `TOKEN_EXPIRED` 或 `INVALID_TOKEN`\n
- token valid → `next()` 被呼叫且 `req.uid/email` 被設定\n

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（現行 requireAuth 還是直接回 res 401）。

**Step 3: Write minimal implementation**

`middleware/auth.ts` 改為 throw：

```ts
import { UnauthorizedError } from '../lib/errors'
// ...existing imports...

if (!header?.startsWith('Bearer ')) {
  throw new UnauthorizedError('Missing Authorization header', 'MISSING_AUTH_HEADER')
}

try { /* verify */ } catch (err) {
  const code = /* TOKEN_EXPIRED or INVALID_TOKEN */
  throw new UnauthorizedError('Unauthorized', code)
}
```

`index.ts` 改為（順序很重要）：
- `cors(...)`
- `express.json()`
- `app.options('*', ...)`（preflight 必須在 auth 前）
- `app.use(requireAuth)`（你選 B：**預設全部都要 auth**，含 `/health`）
- routes（`/health`, `/todos...`）
- `app.use(exceptionMiddleware)`（最後掛）

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS for auth unit test。

**Step 5: Commit**

（若要 commit）
- `git add backend/firebase/functions/src/index.ts backend/firebase/functions/src/middleware/auth.ts backend/firebase/functions/tests/middleware.auth.unit.test.ts`
- `git commit -m "test(backend): make requireAuth throw and mount globally"`

---

### Task 5: Todos handlers：改用 validateBody + throw HttpError（FailureDto 統一）

**Files:**
- Modify: `backend/firebase/functions/src/handlers/todos.ts`
- Modify: `backend/firebase/functions/src/index.ts`
- Modify: `backend/firebase/functions/tests/handlers.todos.unit.test.ts`

**Step 1: Write the failing test**

更新 `handlers.todos.unit.test.ts`：\n
- 404/403 情境改為 `await expect(handlers.toggleTodo(...)).rejects.toBeInstanceOf(NotFoundError/ForbiddenError)`\n
- createTodo/updateTodo 不再依賴 `req.body + parseBody`，改用 `req.validatedBody`（測試 req 直接提供 validatedBody）。\n

**Step 2: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（現行 handler 還在 `res.status().json({error})` 與 `parseBody`）。

**Step 3: Write minimal implementation**

在 `handlers/todos.ts`：\n
- 403/404 改 throw `ForbiddenError/NotFoundError`。\n
- `createTodo`、`updateTodo` 從 `req.validatedBody` 取得 DTO（型別用 `AuthenticatedRequest & ValidatedBodyRequest<CreateTodoInput>` / `UpdateTodoInput`）。\n
- 移除 `parseBody` 呼叫。\n

在 `index.ts`：\n
- `POST /todos` 掛 `validateBody(createTodoSchema)`\n
- `PATCH /todos/:id` 掛 `validateBody(updateTodoSchema)`\n

**Step 4: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 5: Commit**

（若要 commit）
- `git add backend/firebase/functions/src/handlers/todos.ts backend/firebase/functions/src/index.ts backend/firebase/functions/tests/handlers.todos.unit.test.ts`
- `git commit -m "test(backend): use validateBody and throw HttpError in todos handlers"`

---

### Task 6: Backend：補「async rejection 不會掛住」的 app-level unit test（Express 5 目標）

**Files:**
- Modify: `backend/firebase/functions/package.json`（新增 dev deps）
- Create: `backend/firebase/functions/tests/app.async-errors.unit.test.ts`

**Step 1: Write the failing test**

用 `supertest` 建一個最小 express app：\n
- 掛 `express.json()`、`app.use(requireAuth_mock)`（直接 `next()` 並寫 uid）\n
- `GET /todos` handler 內 `await Promise.reject(new Error('db'))` 或呼叫會 reject 的 repo\n
- 掛 `exceptionMiddleware`\n
- 以 supertest 打 `GET /todos`，斷言 `status=500` 且 body `success:false`\n

**Step 2: Install dev deps**

Run:
- `cd backend/firebase/functions && bun add -d supertest @types/supertest`

**Step 3: Run test to verify it fails**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: FAIL（尚未有 express 5 / middleware 接好時）。

**Step 4: Implement minimal fixes until it passes**

確保：
- Express 升級到 5\n
- exceptionMiddleware 掛在最後\n
- handler rejection 能被 express 5 捕獲並交給 exception middleware\n

**Step 5: Run test to verify it passes**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 6: Commit**

（若要 commit）
- `git add backend/firebase/functions/package.json backend/firebase/functions/tests/app.async-errors.unit.test.ts`
- `git commit -m "test(backend): cover async rejection handling with express5"`

---

### Task 7: Client：Options logout 失敗不可假登出 + 顯示錯誤（P1）

**Files:**
- Modify: `apps/client/app/(app)/options.tsx`
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Modify: `apps/client/tests/app/app/options.test.tsx`

**Step 1: Write the failing test**

新增/更新測試：\n
- `firebaseAuth.signOut` mock 為 reject\n
- press logout 後：**uid 不應變成 null**、**router.replace 不應被呼叫**、畫面應顯示 `options.logoutFailed`（用 testID 或文字 key）\n

**Step 2: Run test to verify it fails**

Run:
- `cd apps/client && bun run test -- tests/app/app/options.test.tsx`

Expected: FAIL（目前 catch 會 setUid(null)+redirect）。\n

**Step 3: Write minimal implementation**

`options.tsx`：catch 分支改為 setError state（`AppText tone="danger" accessibilityLiveRegion="polite"`），並新增 i18n key `options.logoutFailed`。\n

**Step 4: Run test to verify it passes**

Run:
- `cd apps/client && bun run test -- tests/app/app/options.test.tsx`

Expected: PASS。\n

**Step 5: Commit**

（若要 commit）
- `git add apps/client/app/(app)/options.tsx apps/client/src/i18n/en.ts apps/client/src/i18n/zh-TW.ts apps/client/tests/app/app/options.test.tsx`
- `git commit -m "fix(client): show logout error and keep auth state on failure"`

---

### Task 8: Client：LoginForm 空白送出要有回饋 + email trim（P2）

**Files:**
- Modify: `apps/client/src/features/auth/LoginForm.tsx`
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Modify: `apps/client/tests/features/auth/LoginForm.test.tsx`

**Step 1: Write the failing test**

更新/新增測試：\n
- 空白 submit：不呼叫 onSubmit 且顯示 `auth.fieldsRequired`（或 `auth.emailRequired`）\n
- 有輸入時：`onSubmit` 應收到 `email.trim()`\n

**Step 2: Run test to verify it fails**

Run:
- `cd apps/client && bun run test -- tests/features/auth/LoginForm.test.tsx`

Expected: FAIL。\n

**Step 3: Write minimal implementation**

`handleSubmit`：\n
- 空白時 `setError(t('auth.fieldsRequired'))` 後 return\n
- 呼叫 `onSubmit(email.trim(), password)`\n
\n
新增 i18n key（建議用通用的 `auth.fieldsRequired`）：\n
- en: `Please enter email and password.`\n
- zh-TW: `請輸入電子郵件與密碼。`\n

**Step 4: Run test to verify it passes**

Run:
- `cd apps/client && bun run test -- tests/features/auth/LoginForm.test.tsx`

Expected: PASS。\n

**Step 5: Commit**

（若要 commit）
- `git add apps/client/src/features/auth/LoginForm.tsx apps/client/src/i18n/en.ts apps/client/src/i18n/zh-TW.ts apps/client/tests/features/auth/LoginForm.test.tsx`
- `git commit -m "fix(client): show required-field error and trim login email"`

---

### Task 9: Client：SignUpForm 空白 email 要有回饋（P2）

**Files:**
- Modify: `apps/client/src/features/auth/SignUpForm.tsx`
- Modify: `apps/client/tests/features/auth/SignUpForm.test.tsx`

**Step 1: Write the failing test**

新增測試：\n
- email 空白按 submit：不呼叫 onSubmit，顯示 `auth.fieldsRequired`（或你選的 key）\n

**Step 2: Run test to verify it fails**

Run:
- `cd apps/client && bun run test -- tests/features/auth/SignUpForm.test.tsx`

Expected: FAIL。\n

**Step 3: Write minimal implementation**

`handleSubmit` 開頭：\n
- `if (!email.trim()) { setError(t('auth.fieldsRequired')); return }`\n

**Step 4: Run test to verify it passes**

Run:
- `cd apps/client && bun run test -- tests/features/auth/SignUpForm.test.tsx`

Expected: PASS。\n

**Step 5: Commit**

（若要 commit）
- `git add apps/client/src/features/auth/SignUpForm.tsx apps/client/tests/features/auth/SignUpForm.test.tsx`
- `git commit -m "fix(client): show required-field error on empty sign-up email"`

---

### Task 10: 全量驗證（最少集）

**Files:** N/A

**Step 1: Backend unit tests**

Run:
- `cd backend/firebase/functions && bun run test:unit`

Expected: PASS。

**Step 2: Client tests**

Run:
- `bun run test`

Expected: PASS。

**Step 3: Client web build + UI boundary**

Run:
- `bun run check:web`
- `bun run check:client:ui`

Expected: PASS。

**Step 4: (Optional) Backend emulator integration tests**

Run:
- `bun run test:backend`

Expected: PASS（若本機有 Java + emulator 可跑）。

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-28-p1-p2-express5-auth-validation-exception-pipeline.md`.

Two execution options:

**1. Subagent-Driven (this session)** — 每個 Task 派一個子代理、每步 review，再整合。\n
**2. Parallel Session (separate)** — 開新 session 用 `superpowers:executing-plans` 逐 task 執行。\n

你要我用哪個方式開始執行？

