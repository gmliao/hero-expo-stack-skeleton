# AGENTS.md — Hero Expo Stack Skeleton

Read this before editing code or docs in this repository.

## Required Startup

1. Run: `~/.codex/superpowers/.codex/superpowers-codex bootstrap`
2. Read `CLAUDE.md`
3. Follow this file for agent-specific execution rules

## Development Workflow

- **Default: develop directly in this repo.** Do not use git worktrees unless the user explicitly requests them.
- If the user asks for worktree isolation, then use `using-git-worktrees` skill and create an isolated worktree.
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

- Fixed order:
  1. Confirm Pen UI first
  2. Write implementation plan
  3. Implement in code
- UI work is DS-first, not screen-first.
- Reusable UI must stay bidirectional between Pen and code.
- Use variables / reusable components for anything that should update globally.
- Full workflow: `docs/design-system/workflow.md`

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
  - **Client:** Add or extend unit tests in `apps/client/tests/` (Jest + React Native Testing Library for components and routes; data/hooks/stores per existing conventions). User-facing flows must pass E2E: `bun run e2e:web` for web; `bun run e2e:ios` when the feature touches mobile.
  - **Backend:** Add or extend tests in `backend/firebase/functions/tests/`; run `bun run test:backend` (emulator). Must cover authenticated happy path, unauthenticated (401), wrong uid (403). **Also cover edge / boundary cases for every optional field:** for any field that supports a "clear" or "reset" semantic (e.g. `dueDate: null`, `description: ''`), add an explicit test that sends the null/clear value and asserts the field is absent or empty in the response. These paths invoke distinct code branches (e.g. `FieldValue.delete()`) that happy-path tests never hit. If a bug occurs here, it is not because of local vs CI differences: both run via `emulators:exec`. The real causes are: (1) missing backend test coverage (e.g. no `dueDate: null` test case), and (2) E2E hitting the path first (e.g. seeded todo without dueDate → edit sends null). Add explicit backend tests so these paths are exercised in the emulator.
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
