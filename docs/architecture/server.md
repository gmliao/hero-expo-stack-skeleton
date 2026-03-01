# Server Architecture Rules

> **入口**：[README Architecture](../README.md#architecture)
>  
> **相關規範**：
> [Firebase CLI Ops](../runbooks/llm-firebase-cli-ops.md),
> [Testing](../testing.md)

`backend/firebase/functions/src` 是 Firebase Functions 後端。這份文件記錄 backend 的非協商規則。

## Required Layering

後端固定三層，且只能向下一層呼叫：

| Layer | 位置 | 職責 | 禁止 |
|------|------|------|------|
| Controller / Endpoint | `src/controllers/**` | HTTP input/output、schema validated input、response wrapping | 不得碰 repository，不得放業務邏輯 |
| Service | `src/services/*.service.ts` | business logic、authorization、ownership checks | 不得依賴 HTTP/Express 概念 |
| Repository | `src/repositories/**` | Firestore CRUD | 不得做 uid ownership / business rules |

規則：

- Endpoint 不得直接存取 repository
- 所有 ownership checks 由 service 負責
- Repository 只做 generic data access

## Controller And Endpoint DSL

- domain routes 必須用 controller class 組織
- controller 必須繼承 `BaseController`
- 每個 controller 定義 `prefix` 與 `endpoints()`
- route path 在 `endpoints()` 內必須是 relative path
- 新 endpoint 必須用 `defineEndpoint()`
- 不要手動在 `app.ts` 或 `routes/index.ts` 註冊 route
- auth 預設為 required，只有刻意公開的 endpoint 才設 `public: true`

## Dependency Injection Rules

- domain services 一律掛在 `Deps.services`
- infrastructure 依賴（`auth`、`logger`）留在 `Deps` top level
- 不得把 repository 暴露回 endpoint 層
- 新 domain service 需要同步更新 `DepsServices` 與 `createDeps()`

## Service Typing Rules

每個 service 都必須有對應的 `<Domain>.types.ts`：

- 放 `I<Domain>Service`
- 放該 service 的 input/output DTO
- service implementation 從 `.types.ts` 引入型別
- 不要把 DTO 分散定義在 `.service.ts`

## Validation And Error Contract

- request input 一律用 Zod，並在 `defineEndpoint({ schemas })` 宣告
- schema 放在 `src/schemas/`
- backend error 一律使用 `AppError`
- `ErrorCode` 只能用：
  - `VALIDATION_ERROR`
  - `UNAUTHENTICATED`
  - `FORBIDDEN`
  - `NOT_FOUND`
  - `INTERNAL`
- HTTP fail response 必須符合 `FailureDto`
- success / failure 基礎型別以 `shared/types/api.ts` 為單一來源

## Firebase Usage Rules

- server-side Firebase imports 必須走 direct subpath imports
- 不要使用 `admin.firestore.*`、`admin.auth.*` namespace accessor
- multi-document write 用 transaction
- writes 要維持 `updatedAt`

## Testing Expectations

- service unit tests 用 mock repository
- endpoint/controller unit tests 用 mock service
- backend integration tests 用 emulator
- authenticated happy path / unauthenticated 401 / wrong uid 403 都必須測
- 支援 clear/reset semantics 的 optional field 必須有明確測試案例

## Cloud And CLI Operations

Firebase CLI、project targeting、deploy guardrails 不放在這份文件，請讀 [Firebase CLI Ops](../runbooks/llm-firebase-cli-ops.md)。
