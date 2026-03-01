# 極簡 Route Builder 微框架設計（整合版）

> 在不導入 Nest / 完整框架的前提下，提供「宣告式 Endpoint + 自動組裝 middleware + 統一 DTO/錯誤 + DI + 可測試」的微框架。

---

## 設計決策紀錄

| 決策               | 選項                           | 理由                                                               |
| ------------------ | ------------------------------ | ------------------------------------------------------------------ |
| Error Model        | **B: AppError 取代 HttpError** | ErrorCode enum 讓前端可窮舉處理；status 從 code 自動推導，不手動傳 |
| Client Error Alert | **Alert.alert()**              | E2E 零 timing issue；系統級通知不屬於 design system                |
| Scope              | **Server + Client 一起改**     | 伺服器改 error 格式後客戶端必須跟著改，否則半完成                  |

---

## 1. Server：AppError 取代 HttpError

### 1.1 ErrorCode + AppError

```ts
export type ErrorCode =
  | "VALIDATION_ERROR" // 400
  | "UNAUTHENTICATED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "INTERNAL"; // 500

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
};

export class AppError extends Error {
  public readonly status: number;
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    this.status = ERROR_STATUS_MAP[code];
  }
}
```

- `status` 由 `code` 自動推導，不可手動傳
- `details` 放 sub-code（`TOKEN_EXPIRED`）或 Zod issues
- 舊的 `HttpError`/`NotFoundError`/`ForbiddenError` 等全部移除

### 1.2 統一 FailureDto 出口

所有 HTTP 錯誤回應都是 `FailureDto`：

```ts
// shared/types/api.ts — 已有，不變
interface FailureDto {
  success: false;
  error: string; // ← 改為放 ErrorCode（UNAUTHENTICATED, NOT_FOUND...）
  code?: string; // ← 放 sub-code（TOKEN_EXPIRED, MISSING_AUTH_HEADER...）
  message?: string; // ← 人可讀訊息
}
```

**語意變更**：`error` 欄位從自由字串改為 `ErrorCode` enum 值，`code` 欄位降級為可選的 sub-code。

mapError 函式：

```ts
export function mapErrorToFailureDto(err: unknown): {
  status: number;
  body: FailureDto;
} {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        success: false,
        error: err.code, // ErrorCode
        ...(err.details &&
        typeof err.details === "object" &&
        "subCode" in err.details
          ? { code: (err.details as any).subCode }
          : {}),
        message: err.message,
      },
    };
  }
  // ZodError → VALIDATION_ERROR
  // Unknown → INTERNAL
  return {
    status: 500,
    body: { success: false, error: "INTERNAL", message: "Internal error" },
  };
}
```

---

## 2. Server：Route Builder DSL

### 2.1 EndpointDef + defineEndpoint

```ts
interface EndpointDef<TBody, TQuery, TParams, TResult> {
  id: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  auth?: boolean; // 預設 true
  schemas?: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema };
  execute: (args: ExecuteArgs<TBody, TQuery, TParams>) => Promise<TResult>;
}
```

### 2.2 wrapEndpoint 管線

```
req → createRequestContext → auth guard → Zod validate → execute → SuccessDto
                                                                  ↘ catch → FailureDto
```

- auth guard：用注入的 `IAuthVerifier`，失敗 throw `AppError('UNAUTHENTICATED', ...)`
- Zod 失敗 → `AppError('VALIDATION_ERROR', ...)`
- execute throw → `mapErrorToFailureDto()`
- 正常回傳 → `{ success: true, data: result }`

### 2.3 RouteBuilder

```ts
const builder = createRouteBuilder(deps);
builder.add(createTodoEndpoint);
builder.add(listTodosEndpoint);
builder.mount(app);
```

### 2.4 RequestContext

```ts
interface RequestContext {
  requestId: string;
  uid?: string;
  logger: Logger;
  now: Date;
}
```

### 2.5 Deps

```ts
interface Deps {
  todosRepo: ITodosRepository;
  auth: IAuthVerifier;
  logger: Logger;
}
```

---

## 3. Server：組裝點

### 3.1 deps.ts

```ts
export function createDeps(): Deps {
  return {
    todosRepo: new TodosFirestoreRepository(),
    auth: new FirebaseAuthVerifier(),
    logger: new ConsoleLogger(),
  };
}
```

### 3.2 app.ts

```ts
export function buildApp(deps: Deps) {
  const app = express()
  app.use(preflightMiddleware)
  app.use(cors({...}))
  app.use(express.json())

  const builder = createRouteBuilder(deps)
  registerEndpoints(builder)
  builder.mount(app)

  app.use(notFoundHandler)   // 404 → FailureDto
  return app
}
```

### 3.3 index.ts

```ts
initializeApp();
export const api = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60 },
  buildApp(createDeps()),
);
```

---

## 4. Server：目錄結構

```
backend/firebase/functions/src/
├── index.ts                    # Firebase Functions entry
├── app.ts                      # buildApp(deps)
├── deps.ts                     # createDeps()
│
├── http/                       # ★ 微框架核心
│   ├── endpoint.ts             # defineEndpoint / types
│   ├── builder.ts              # createRouteBuilder
│   ├── wrap.ts                 # wrapEndpoint
│   ├── context.ts              # createRequestContext
│   └── errors.ts               # AppError / ErrorCode / mapErrorToFailureDto
│
├── endpoints/                  # ★ 端點宣告
│   └── todos/
│       ├── createTodo.endpoint.ts
│       ├── listTodos.endpoint.ts
│       ├── updateTodo.endpoint.ts
│       ├── toggleTodo.endpoint.ts
│       └── deleteTodo.endpoint.ts
│
├── routes/
│   └── index.ts                # registerEndpoints(builder)
│
├── handlers/                   # （遷移期保留，逐步清空）
├── middleware/                  # preflight 等通用 middleware
├── schemas/
├── repositories/
├── services/
└── lib/
```

---

## 5. Client：request() 改讀 FailureDto

### 5.1 改造 toHttpError → toApiError

```ts
import type { FailureDto } from "@shared/types/api";

function toApiError(dto: FailureDto): Error {
  const message = dto.message ?? dto.error;
  switch (dto.error) {
    case "UNAUTHENTICATED":
      return new AuthError(message, 401);
    case "FORBIDDEN":
      return new PermissionError(message, 403);
    default:
      return new ApiError(message, /* status from response */ 400);
  }
}
```

### 5.2 request() 改造

```ts
if (!response.ok) {
  const body = await response.json().catch(() => null);

  if (response.status === 401) {
    await handleUnauthorized();
  }

  // 結構化 FailureDto
  if (body && body.success === false) {
    throw toApiError(body as FailureDto);
  }

  // fallback（非 FailureDto 格式）
  throw new ApiError(`HTTP ${response.status}`, response.status);
}
```

---

## 6. Client：全域 mutation onError Alert

### 6.1 \_layout.tsx

```ts
import { Alert } from 'react-native'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { ... },  // 不變
    mutations: {
      retry: 0,
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        Alert.alert('Error', message)
      },
    },
  },
})
```

- **只對 mutation**：query error 由各頁面自行處理
- **E2E 可偵測**：web 走 `window.alert()`（Playwright `page.on('dialog')`），native 走原生 alert

---

## 7. AGENTS.md 更新

在 `## Non-Negotiable Architecture` 段落新增：

```md
- **Backend error model (required):** All backend errors must use `AppError` from `src/http/errors.ts`
  with constrained `ErrorCode` enum (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`,
  `NOT_FOUND`, `INTERNAL`). Do not throw raw `Error` or legacy `HttpError`; do not use freeform
  string error codes. All HTTP error responses must conform to `FailureDto` format from
  `shared/types/api.ts`: `{ success: false, error: ErrorCode, code?: subCode, message?: string }`.
  The `error` field is always an `ErrorCode` value; optional `code` is for sub-classification
  (e.g. `TOKEN_EXPIRED`).
- **Backend endpoint DSL (required):** New endpoints must use `defineEndpoint()` from `src/http/endpoint.ts`.
  Do not register routes manually in `index.ts`. Auth, validation, error handling, and DTO wrapping
  are handled by `wrapEndpoint()` automatically.
- **Client API error handling (required):** `data/api.ts` must parse `FailureDto` from response body
  and construct typed errors using `ErrorCode`. Global mutation `onError` in `_layout.tsx` surfaces
  errors via `Alert.alert()` so E2E tests can detect failures instead of seeing silent timeouts.
```

---

## 8. 遷移策略

### Phase 1（本次 PR）

1. 建立 `http/` 微框架核心（endpoint, builder, wrap, context, errors）
2. AppError 取代 HttpError，遷移所有 throw 的地方
3. 用 DSL 重寫 5 個 todos endpoints
4. 更新 `exceptionMiddleware` → 用 `mapErrorToFailureDto`
5. Client `request()` 改讀 FailureDto
6. Client 全域 mutation onError Alert
7. 更新 AGENTS.md
8. 更新 unit tests + integration tests

### Phase 2（未來）

- 新 domain（users, etc.）直接用 DSL
- 舊 handlers/ 目錄清空
- 考慮 Toast 替代 Alert（品牌化）

---

## 9. 測試策略

### Unit Tests

- `http/wrap.ts`：mock deps，驗證 auth/validate/error/SuccessDto 管線
- `http/errors.ts`：AppError 建構、mapErrorToFailureDto
- Endpoint execute：mock deps，驗證業務邏輯
- Client `toApiError`：各 ErrorCode → 正確的 Error 子類

### Integration Tests（Emulator）

- 每個 endpoint：happy path + 401 + 403
- 驗證回應格式一律為 SuccessDto / FailureDto
