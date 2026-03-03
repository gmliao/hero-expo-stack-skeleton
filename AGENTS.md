# AGENTS.md — Hero Expo Stack Skeleton

Read this before editing code or docs in this repository.

## Required Startup

1. **Superpowers:** Skills must already be installed (Cursor: marketplace or `~/.cursor/skills/superpowers`; Codex: clone repo + symlink to `~/.agents/skills/superpowers` — one-time setup, see that repo’s `.codex/INSTALL.md` if needed).
2. Read `CLAUDE.md`
3. Follow this file for agent-specific execution rules

## Development Workflow

- **Default: develop directly in this repo.** Do not use git worktrees unless the user explicitly requests them.
- **Each feature must start on a dedicated git branch before phase 1 begins.** This includes brainstorming docs, Pen changes, implementation plans, code changes, and tests.
- Branch-per-feature is required. Worktree-per-feature is not required; by default, create the branch in the current repo unless the user explicitly requests worktree isolation.
- If the user asks for worktree isolation, then use `using-git-worktrees` skill and create an isolated worktree.
- **Feature development phases (fixed order):** 1) 概念範疇釐清 (brainstorming) → 2) UI/UX 設計 (Design System workflow) → 3) 轉寫規格 (writing-plans) → 4) 實際可執行規格 → 5) subagent-driven 執行 (executing-plans). 總覽：`.agent/workflows/feature-development.md`.
- **Use Superpowers guidance when developing:** Follow the relevant skills (e.g. brainstorming, writing-plans, test-driven-development, verification-before-completion). For implementation plans with multiple independent tasks, use **subagent-driven development**: one subagent per task, two-stage review after each (spec compliance then code quality), then final review and finishing-a-development-branch. Do not skip plan writing, tests, or reviews; if a step cannot be done, report why.

## Package Manager

- Use `bun` only.
- Do not use `npm`, `yarn`, or `pnpm` for repo tasks.

## Tech stack

- **Client**: Expo (React Native), NativeWind (Tailwind CSS), TanStack Query, Zustand, i18next.
- **Backend**: Firebase (Auth, Functions, Firestore). App talks to Functions over HTTP only; no Firestore SDK in app.
- **Shared**: `shared/types` for API contracts; design tokens in `apps/client/src/ui/theme/design-tokens.js` (consumed by Tailwind, tokens, semantic).
- See `CLAUDE.md` for architecture and directory conventions.

## Non-Negotiable Architecture

- App is API-first: app code never reads/writes Firestore directly.
- Backend must remain Controller -> Service -> Repository; no Endpoint -> Repository access.
- Backend source must be split by responsibility:
  - `src/core/**` for HTTP/app assembly and framework glue
  - `src/infrastructure/**` for external-system implementations
  - `src/modules/<domain>/**` for domain code
- New backend domain code must go under `src/modules/<domain>/`; do not reintroduce flat top-level `controllers/`, `services/`, `repositories/`, or `schemas/` directories for new work.
- Domain services are injected under `Deps.services`; infra deps stay at top level.
- Service interfaces and DTOs live together in `<Domain>.types.ts`.
- Backend endpoints must use `defineEndpoint()` and Zod schemas; auth is required by default.
- Backend errors must use `AppError` + constrained `ErrorCode`, returning `FailureDto`.
- Server-side Firebase imports must use direct subpath imports, never `admin.firestore.*`.
- Query/state split is mandatory:
  - TanStack Query for server state
  - Zustand for UI state only
- Query keys come only from `apps/client/src/data/queryKeys.ts`.
- `shared/types/api.ts` is the API contract source of truth.
- Full details:
  - Client rules: `docs/architecture/client.md`
  - Server rules: `docs/architecture/server.md`

## UI Baseline Rules

- i18n is required from first implementation.
- Safe area support is required for all full-screen mobile routes.
- `testID` must remain locale-independent.
- Web is a first-class target; run web smoke checks and keep web bundle healthy.
- Route/feature files may only consume shared UI via `@/ui/components`.
- Keep route files thin; move screen-specific UI to `src/features/<feature>/`.
- Web a11y baseline is required for core flows.
- Full client/UI details: `docs/architecture/client.md`

## Design System First Workflow (Required)

UI 相關工作（改 screen、design tokens、shared component）必須依下列順序執行，不可跳步。

**Workflow 順序（依序完成）：**

| 步驟 | 動作 | 完成條件 |
|------|------|----------|
| 1 | **Confirm Pen UI** | 在 `.pen` 定稿 layout、semantic variables、reusable components；必要時用 Pencil MCP 查詢/更新。 |
| 2 | **Write implementation plan** | 產出實作計畫（含 Pen–code 對應、要改的檔案、rollout 順序）；使用 `writing-plans` skill。 |
| 3 | **Implement in code** | 依計畫在 code 實作；使用 `executing-plans` skill，必要時 subagent 分工。 |

- **禁止**：先改 code 再回填 Pen、跳過 planning 直接改 screen。
- UI 以 DS-first，不以 screen-first；可重用 UI 須與 Pen 雙向同步；全域樣式用 variables / reusable components。
- 完整規則與細則：`docs/design-system/workflow.md`

## Firebase CLI + LLM Operations

- Prefer wrapper commands over raw global CLI.
- Emulator-first by default.
- Never run `firebase deploy` without explicit user instruction in the active thread.
- Cloud commands must use explicit project targeting from `.env`, not `.firebaserc`.
- Full process: `docs/runbooks/llm-firebase-cli-ops.md`
- Session logging template: `docs/runbooks/firebase-cli-session-template.md`

### AI Deploy Workflow (Required)

- Before cloud commands:
  - `firebase login:list`
  - `firebase projects:list`
  - verify `.env` target project
- If missing project id, use `bash scripts/firebase/setup-cloud-project.sh <project-id>`
- Preferred cloud commands:
  - `bun run firebase functions:log`
  - `bun run firebase deploy --only functions`

## Testing and Verification

- **Feature development verification (required):**
  - **All feature development** (client, backend, shared) must be verified by unit tests and, where applicable, E2E tests. Do not claim a feature complete until the relevant tests pass.
  - **Edit / pre-fill flows (required):** Whenever a screen or modal opens in **edit mode** (e.g. edit todo, edit profile), tests must explicitly cover that the form is **pre-filled with existing data** (title, description, due date, tags, etc.). Otherwise regressions (e.g. wrong cache key, null vs undefined) can leave the form empty and go unnoticed. Add **unit tests** that assert initial field values when opening in edit mode (including cache key variants such as `selectedTagId: null` vs `undefined` if the form reads from list cache). Add **E2E tests** that create an entity with known values, open edit, then assert each relevant input/field shows the correct value before making any change. Do not skip this coverage.
  - **Client:** Add or extend unit tests in `apps/client/tests/` (Jest + React Native Testing Library for components and routes; data/hooks/stores per existing conventions). User-facing flows must pass E2E: `bun run e2e:web` for web; `bun run e2e:ios` when the feature touches mobile.
  - **Backend:** Add or extend tests in `backend/firebase/functions/tests/`; run `bun run test:backend:unit` for unit coverage and `bun run test:backend` for emulator integration coverage. Must cover authenticated happy path, unauthenticated (401), wrong uid (403). **Also cover edge / boundary cases for every optional field:** for any field that supports a "clear" or "reset" semantic (e.g. `dueDate: null`, `description: ''`), add an explicit test that sends the null/clear value and asserts the field is absent or empty in the response. These paths invoke distinct code branches (e.g. `FieldValue.delete()`) that happy-path tests never hit. If a bug occurs here, it is not because of local vs CI differences: both run via `emulators:exec`. The real causes are: (1) missing backend test coverage (e.g. no `dueDate: null` test case), and (2) E2E hitting the path first (e.g. seeded todo without dueDate → edit sends null). Add explicit backend tests so these paths are exercised in the emulator.
  - **Backend test layout:** unit tests should mirror the source layout under `tests/core/**`, `tests/infrastructure/**`, `tests/modules/**`, and integration tests belong under `tests/integration/**`. Shared mocks stay in `tests/mocks/**`.
  - **If something cannot be verified** (e.g. no feasible unit test for a piece of code, or E2E not applicable), **report it explicitly** in the same thread or in the PR: what was not verified and why. Do not silently skip verification.
- Client unit tests include `@/ui/components`, features, and routes.
- Do not lower coverage thresholds to make failures disappear; add the missing tests.
- Before editing Playwright web E2E, read `docs/runbooks/playwright-web-e2e.md`.
- Full testing rules: `docs/testing.md`

Run relevant checks before claiming completion:

- `bun run check:client:ui`
- `bun run check:pw:console` (Playwright CLI must show no browser `console.error` / `pageerror`)
- `bun run check:expo` (Expo doctor + compile/export)
- `bun run test`
- `bun run test:backend:unit`
- `bun run check:web` (web bundle; catches "Unable to resolve" and similar)
- `bun run test:backend`
- `bun run e2e:web`
- `bun run ci`

If you cannot run a check, explicitly state what was not run and why.

## Guardrails

- Do not commit secrets or modify real `.env` values.
- Do not deploy to production by default.
- Do not add `any` types when shared/app types can be defined.
- Do not use `console.log` in committed app/backend code; use project logger utilities.
