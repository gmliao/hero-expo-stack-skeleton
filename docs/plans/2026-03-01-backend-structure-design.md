# Backend Structure Redesign

**Date:** 2026-03-01

## Problem

目前 `backend/firebase/functions/src` 同時把框架核心、基礎設施實作、以及業務模組放在同一層平行目錄：

- `http/`, `routes/`, `app.ts`, `deps.ts` 屬於架構核心
- `services/auth.firebase.service.ts`, `repositories/todos.firestore.repository.ts` 屬於基礎設施
- `controllers/todos.controller.ts`, `services/todos.service.ts`, `schemas/todos.schema.ts` 屬於 `todos` 業務模組

這在單一 domain 時還可接受，但一旦新增第二個以上的 domain，`src/` 很快會變成「分層存在，但業務歸屬不明」的平面結構。後果是：

- 新 domain 沒有清楚落點
- 搬遷與擴充需要跨多個平行資料夾同步修改
- agent 與開發者難以一眼分辨「架構 code」和「業務 code」
- `AGENTS.md` 與 `docs/architecture/server.md` 難以用一句話講清楚規範方向

## Goals

1. 將 backend source 拆成明確的 `core / infrastructure / modules` 三個責任區。
2. 讓新增 domain 時，controller / service / schema / repository implementation 都能落在同一個 module 內。
3. 保留現有三層架構規則：Controller -> Service -> Repository。
4. 同步更新 tests、import paths、以及文檔規範，避免目錄變了但規範還停在舊模型。

## Non-Goals

- 不引入完整 DDD 術語與多層 application/domain/presentation 套件結構。
- 不在這次重構中改變 API 行為或 Firestore schema。
- 不重寫測試策略；只做必要的路徑與命名調整。

## Options Considered

### Option A: 維持平行目錄，只補少量子資料夾

例如保留 `controllers/ services/ repositories/ schemas/`，僅新增更細的子層。

優點：

- 風險最低
- 搬遷量最小

缺點：

- 根本問題沒解決，業務與架構仍混在 `src/` 頂層
- 新 domain 仍需跨 4 到 5 個資料夾找檔案

### Option B: `core / infrastructure / modules`

推薦。

優點：

- 架構核心、外部依賴、業務模組的責任切分清楚
- 新增 domain 有固定位置
- 符合現有 MVC/service/repository 規則，但比全 DDD 更務實

缺點：

- 需要一起改 imports、tests、docs
- 這次重構範圍比輕量整理大

### Option C: 完整 DDD 分層

例如 `application/ domain/ infrastructure/ presentation/`.

優點：

- 理論上最純

缺點：

- 目前 repo 不需要這麼重的結構
- 會放大命名與遷移成本

## Recommended Design

採用 Option B：`core / infrastructure / modules`.

### Target Structure

```text
backend/firebase/functions/src/
  core/
    app.ts
    deps.ts
    routes/
      index.ts
    http/
      builder.ts
      context.ts
      endpoint.ts
      errors.ts
      wrap.ts
  infrastructure/
    auth/
      auth.firebase.service.ts
      auth.types.ts
    firestore/
      repositories/
        repository.types.ts
  modules/
    todos/
      todos.controller.ts
      todos.service.ts
      todos.types.ts
      todos.schema.ts
      todos.firestore.repository.ts
  middleware/
    preflight.ts
  types/
    api.d.ts
  index.ts
```

### Why this split

- `core/` 只放框架與組裝邏輯，不放業務規則。
- `infrastructure/` 只放外部依賴實作與抽象，例如 Firebase Auth verifier、Firestore repository contracts/shared infra types。
- `modules/<domain>/` 收斂單一 domain 的 controller、service、types、schema、repository implementation。
- `middleware/` 先保持頂層，因為目前只有 preflight，且它不屬於單一 domain。
- `index.ts` 保持入口點在 `src/` 根，避免 Functions export 路徑額外繞一層。

## Design Rules To Encode In Docs

這次重構後，規範應明確寫成：

1. Backend source 必須區分 `core`、`infrastructure`、`modules`。
2. 新 domain 不得再把 controller/service/schema/repository implementation 散落到平行頂層資料夾。
3. `core` 不得依賴特定 domain module。
4. `modules/<domain>` 可以依賴 `core` 定義與 `infrastructure` 實作抽象，但不得反向讓 `core` 依賴它。
5. `AGENTS.md` 只保留摘要紅線；詳細結構規則放 `docs/architecture/server.md`。

## Migration Plan

建議分四段：

1. 先搬 `core/` 與 `infrastructure/`，保持行為不變。
2. 再建立 `modules/todos/`，搬 `todos` 相關 controller/service/schema/repository implementation。
3. 更新 tests 與 mocks import path。
4. 最後更新 `AGENTS.md`、`docs/architecture/server.md`、`docs/README.md`。

## Risks

### Import churn

大量搬檔會導致 import path 變更多，若一次改太多且沒有分段驗證，容易留下壞引用。

Mitigation:

- 分 commit 做
- 每段搬遷後跑最小單元測試與 type-check / backend tests

### Core/domain boundary leakage

如果把 `todos` 型別或 controller 細節放進 `core/`，新結構只會換皮不換骨。

Mitigation:

- 在 `core/` 只允許放 HTTP DSL、route builder、deps、error/context 等通用機制

### Docs drift

如果只搬目錄不改規範，後續 agent 會繼續照舊結構新增檔案。

Mitigation:

- 同步更新 `AGENTS.md`
- 同步更新 `docs/architecture/server.md`

## Acceptance Criteria

- `src/` 目錄具備 `core/`, `infrastructure/`, `modules/`
- `todos` domain 全部集中到 `modules/todos/`
- 核心 HTTP 與 route 組裝集中到 `core/`
- Firebase/Auth/Firestore 基礎設施移到 `infrastructure/`
- 測試全部通過且 import path 正常
- `AGENTS.md` 與 `docs/architecture/server.md` 明確要求後續沿用此結構
