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

- API-first: app code never reads/writes Firestore directly.
- **Backend abstraction layer (required):** All external I/O (Firestore, Auth) must be isolated behind interfaces. Handlers and middleware depend on injected abstractions (e.g. `ITodosRepository`, `IAuthVerifier`), not on `firebase-admin` directly. This enables unit tests with mock implementations, similar to NestJS/ORM repository injection. See `backend/firebase/functions/src/repositories/` and `src/services/`; unit tests live in `tests/*.unit.test.ts` and use mocks from `tests/mocks/`.
- **Backend MVC layers (required):** The backend follows a strict three-layer architecture. Each layer has a single responsibility and must only call the layer directly below it:
  - **Endpoint (Controller)** — `src/endpoints/<domain>/`: HTTP input/output only. Extract validated input, call the Service method, return the result. Must NOT import or reference any Repository interface or implementation. No business logic, no `findById`, no uid checks here.
  - **Service** — `src/services/<domain>.service.ts`: Business logic and authorization rules. Owns all uid ownership checks (`requireOwned`). Calls Repository for data access. Every public Service method takes `uid` as first parameter when operating on user-owned data. Must NOT have any HTTP or Express concepts.
  - **Repository** — `src/repositories/`: Pure data access (Firestore CRUD). No business logic, no uid ownership checks. Generic operations only.
- **No direct Endpoint → Repository access (required):** Endpoints must never call `deps.todosRepo` or any Repository method directly. All data access flows through the Service layer. The `Deps` interface exposes only `todosService: ITodosService`, not the Repository. Adding `todosRepo` back to `Deps` is prohibited.
- **Service interface for testability (required):** Every Service must have a corresponding `I<Domain>Service` interface (e.g. `ITodosService` in `src/services/todos.types.ts`). Endpoint unit tests inject a mock service (`tests/mocks/<domain>.service.mock.ts`); Service unit tests inject a mock repository. This ensures each layer is tested in isolation without the layer below.
- **Backend error model (required):** All backend errors must use `AppError` from `src/http/errors.ts` with constrained `ErrorCode` enum (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL`). Do not throw raw `Error` or legacy `HttpError`; do not use freeform string error codes. All HTTP error responses must conform to `FailureDto` format from `shared/types/api.ts`: `{ success: false, error: ErrorCode, code?: subCode, message?: string }`. The `error` field is always an `ErrorCode` value; optional `code` is for sub-classification (e.g. `TOKEN_EXPIRED`).
- **Backend endpoint DSL (required):** New endpoints must use `defineEndpoint()` from `src/http/endpoint.ts`. Do not register routes manually in `index.ts`. Auth, validation, error handling, and DTO wrapping are handled by `wrapEndpoint()` automatically. Endpoint declarations live in `src/endpoints/<domain>/`. Route registration lives in `src/routes/index.ts`.
- **Client API error handling (required):** `data/api.ts` must parse `FailureDto` from response body and construct typed errors using `ErrorCode`. Global mutation `onError` in `_layout.tsx` surfaces errors via `Alert.alert()` so E2E tests can detect failures instead of seeing silent timeouts.
- **Backend validation (required):** Validate request input with **Zod** schemas declared in `defineEndpoint({ schemas: { body, query, params } })`. Schemas live in `src/schemas/` (e.g. `todos.schema.ts`). `wrapEndpoint` handles parsing and returns `FailureDto` with `error: 'VALIDATION_ERROR'` on failure.
- **DTO base types (required):** Use `SuccessDto<T>`, `FailureDto`, and `ApiResponseDto<T>` from `shared/types/api.ts` for typed success/failure responses. Validation errors return `{ success: false, error: string, message?: string }`; success responses may return raw data or wrap in `{ success: true, data: T }` as needed.
- **Server-side Firebase modular imports (required):** All server-side Firebase modules must use direct subpath imports (e.g. `import { FieldValue } from 'firebase-admin/firestore'`, `import { ... } from 'firebase-admin/auth'`) — never access via `admin.firestore.*`, `admin.auth.*`, etc. The Functions emulator patches `firebase-admin` at runtime and can make these namespace accessors `undefined`.

```typescript
// ❌ WRONG — admin.firestore namespace can be undefined inside the emulator
import * as admin from 'firebase-admin'
admin.firestore.FieldValue.delete()
admin.firestore.Timestamp.now()

// ✅ CORRECT — modular imports are always stable
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
FieldValue.delete()
Timestamp.now()
```

- Query/state split:
  - TanStack Query for server state.
  - Zustand for UI state only.
- Query keys must come from `apps/client/src/data/queryKeys.ts` factory.
- `shared/types/api.ts` is the API contract source of truth.

## UI Baseline Rules

- i18n is required from initial implementation; do not hardcode user-facing strings in screens/components.
- Safe area support is required for all full-screen mobile routes:
  - Root must include `SafeAreaProvider`.
  - Route screens should use `SafeAreaView` with explicit edges.
- Keep test selectors (`testID`) locale-independent.
- For iOS/Android native parity and E2E reliability, use Expo Dev Client (`expo start --dev-client`); do not treat Expo Go as the default runtime.
- Web is a first-class target: run `cd apps/client && bun run web` for feature smoke checks and avoid web assertions that depend on localized text.
- **Web bundling**: Any package imported by app code must be listed in `apps/client/package.json` (not only in root), or Web build may fail with "Unable to resolve". After adding new app imports, run `bun run check:web` to verify the web bundle builds.
- **Client UI boundary (required):**
  - Route/feature layer (`apps/client/app/**`, `apps/client/src/features/**`) must import UI from `@/ui/components` only.
  - Do not import `@gluestack-ui/*` directly in route/feature files.
  - Do not add inline `style={{...}}` literals in route/feature files.
  - Run `bun run check:client:ui` after UI changes.
- **NativeWind / styling (best practice):**
  - Prefer `className` with Tailwind tokens (e.g. `flex-1 px-5 py-8`); avoid `StyleSheet.create` when equivalent.
  - Use `StyleSheet` only when: dynamic values, platform-specific styles, or styles NativeWind cannot express.
  - Keep StyleSheet for: `insets`/breakpoint-driven values, `ScrollView.contentContainerStyle` (NativeWind's `contentContainerClassName` has unstable layout support; `contentContainerStyle` is more reliable), `AppStatusBar`, `AppScreenContainer` maxWidth.
- Web a11y baseline is required for feature completion:
  - Keyboard operable core flow (login/create/toggle).
  - Inputs/actions expose accessible names.
  - Error feedback is announced via live-region style semantics.
- **Screen and route structure (best practice):**
  - Keep route files thin: orchestration only (hooks, a few handlers, composition of feature components). Avoid long JSX and inline layout in the route file.
  - Extract screen-specific UI into feature components under `src/features/<feature>/` (e.g. `TodosScreenHeader`, `TodosList`). Reuse shared UI from `@/ui/components`.
  - Root route files (e.g. `app/index.tsx`) may be a single redirect; nested route files compose feature components and data hooks only.

## Design System First Workflow (Required)

- **UI feature workflow (order is fixed):**
  1. **Confirm Pen UI first**: Finalize or confirm screens/components in `.pen` (layout, semantic color variables, reusable components). Use Pencil MCP to query or adjust if needed.
  2. **Plan**: Write an implementation plan from Pen output (files to touch, Pen component IDs, i18n keys).
  3. **Implement**: Follow the plan in Code (`@/ui/components`, route/feature, design-tokens if synced), and update `docs/design-system/pen-code-component-mapping.md`.
  - Do not build screens in Code first and backfill Pen later; do not skip planning and edit Code directly.
- **DS-first for all UI work**:
  - Start from design-system primitives/tokens, then compose features/screens.
  - Do not build ad-hoc screen styles first and “backfill” DS later.
- **Pen componentization for global consistency**:
  - In `.pen`, promote reusable UI blocks to `reusable: true` components.
  - Use `ref` instances in screens instead of duplicating raw frames.
  - For variants/states (default/hover/focus/error/disabled), prefer component variants or instance overrides over duplicated standalone copies.
  - Cross-screen UI must reuse shared components from a single DS/component area whenever possible.
  - Before creating new screen-level structure, check whether an equivalent reusable component already exists and use it via `ref`.
  - If no suitable reusable component exists, explicitly report the gap first, then add a new reusable component in the shared DS/component area, and finally consume it from screens via `ref`.
- **Variable-driven theming in pen**:
  - Colors/typography/spacing/radius must come from document `variables` wherever possible.
  - Avoid hardcoded one-off values in screen-level nodes.
  - If a style should update globally, it must be represented as a variable or reusable component.
- **Definition of “auto-adjustable”**:
  - A global style change is considered auto-adjustable only when:
    1. The changed value is a shared variable, or
    2. The changed structure/style lives in a reusable component consumed via `ref`.
  - If a screen is not wired via variable/ref, assume manual updates are required.
- **Client implementation mapping**:
  - `apps/client/src/ui/components/**` must expose DS primitives and stateful variants that map to pen DS boards.
  - Route/feature layers consume these APIs only; do not recreate visual tokens/states inline.
- **Pen ↔ Code sync (required):**
  - When adding a reusable component in `.pen`: implement the corresponding component in `@/ui/components` and update the mapping table.
  - When adding a reusable component in `@/ui/components`: add the corresponding component in `.pen` (DS area) and update the mapping table.
  - Do not leave components in only one side; pen and code must remain bidirectional.
  - Any `.pen` updates must conform to the `.pen` schema and MCP workflow rules (valid node types/properties, variable-driven styling, placeholder lifecycle, and no ad-hoc non-spec properties).
- **Component mapping reference:**
  - The canonical Pen ↔ Code mapping table lives at `docs/design-system/pen-code-component-mapping.md`.
  - Use it to look up which pen component maps to which code component (and vice versa).
  - Must be updated whenever a new reusable component is added to either pen or code.
  - For Code components that lack Pen equivalents: add them in Pencil per `docs/design-system/pen-gap-spec.md`, then update the mapping table with the new Pen ID. When Pencil is open, use `docs/runbooks/pen-add-card-input-stack.md` to add Card/Input/Stack via MCP.
  - Color/scheme: components must use semantic tokens from `docs/design-system/color-scheme.md`; do not hardcode hex in components.
- **Recommended rollout order**:
  1. Update tokens/semantic variables.
  2. Update reusable components (pen + `@/ui/components`).
  3. Migrate screens to `ref`/shared components.
  4. Remove duplicated legacy styling patterns.

## Firebase CLI + LLM Operations

- Prefer root scripts and wrappers over raw global CLI:
  - `bun run firebase ...`
  - `bash scripts/firebase/check-project.sh`
- Emulator-first for all development and tests.
- Never run `firebase deploy` without explicit user instruction in the active thread.
- For non-emulator Firebase commands, pass explicit project targeting.
- Cloud project id must come from local `.env` (`FIREBASE_PROJECT_ID`), not from `.firebaserc` default.
- If `FIREBASE_PROJECT_ID` is missing, proactively help set it:
  - `bash scripts/firebase/setup-cloud-project.sh <project-id>`
- Use `docs/runbooks/llm-firebase-cli-ops.md` process when LLM is assisting CLI operations.
- Record CLI sessions with `docs/runbooks/firebase-cli-session-template.md`.

### AI Deploy Workflow (Required)

- Before any cloud Firebase command:
  - Verify login: `firebase login:list`
  - Verify target project exists: `firebase projects:list`
- If `.env` is missing `FIREBASE_PROJECT_ID` (or is `hero-stack-local`), assist immediately:
  - `bash scripts/firebase/setup-cloud-project.sh <project-id>`
- If user does not have a cloud project yet, assist creation first:
  - `firebase projects:create <project-id> --display-name "Hero Stack"`
- For cloud actions, always run through wrapper with explicit or env project:
  - `bun run firebase functions:log`
  - `bun run firebase deploy --only functions`
- Never rely on `.firebaserc` default for cloud deploy target.

## Testing and Verification

- **Feature development verification (required):**
  - **All feature development** (client, backend, shared) must be verified by unit tests and, where applicable, E2E tests. Do not claim a feature complete until the relevant tests pass.
  - **Client:** Add or extend unit tests in `apps/client/tests/` (Jest + React Native Testing Library for components and routes; data/hooks/stores per existing conventions). User-facing flows must pass E2E: `bun run e2e:web` for web; `bun run e2e:ios` when the feature touches mobile.
  - **Backend:** Add or extend tests in `backend/firebase/functions/tests/`; run `bun run test:backend` (emulator). Must cover authenticated happy path, unauthenticated (401), wrong uid (403). **Also cover edge / boundary cases for every optional field:** for any field that supports a "clear" or "reset" semantic (e.g. `dueDate: null`, `description: ''`), add an explicit test that sends the null/clear value and asserts the field is absent or empty in the response. These paths invoke distinct code branches (e.g. `FieldValue.delete()`) that happy-path tests never hit. If a bug occurs here, it is not because of local vs CI differences: both run via `emulators:exec`. The real causes are: (1) missing backend test coverage (e.g. no `dueDate: null` test case), and (2) E2E hitting the path first (e.g. seeded todo without dueDate → edit sends null). Add explicit backend tests so these paths are exercised in the emulator.
  - **If something cannot be verified** (e.g. no feasible unit test for a piece of code, or E2E not applicable), **report it explicitly** in the same thread or in the PR: what was not verified and why. Do not silently skip verification.
- **Client unit test scope:** Include `@/ui/components` (design-system components) as well as features and routes. Tests live in `apps/client/tests/` mirroring `src/` (e.g. `tests/ui/components/AppButton.test.tsx`).
- **Coverage threshold (client):** `apps/client/jest.config.js` defines a **global** minimum (statements 55%, branches 40%, functions 55%, lines 55%) and **per-path** minimums: `src/features/**` 50/30/55/50, `src/data/hooks/**` 85/65/80/85, `src/stores/**` 90/85/90/90, `src/ui/utils/**` 90/85/90/90, `src/ui/components/**` 80/50/80/80, `app/**` 50/0/50/50. CI fails if coverage drops below. **Policy:** Do **not** arbitrarily lower thresholds when they fail. Instead, **analyze the cause** (which lines/branches are uncovered) and add the **necessary unit tests** to reach the thresholds.
- **Coverage threshold (backend):** `backend/firebase/functions/jest.config.js` collects coverage; thresholds apply to `src/handlers/**` (65/45/65/65) and `src/middleware/**` (65/55/65/65). Unit tests (`*.unit.test.ts`) inject mock `ITodosRepository` and `IAuthVerifier` — no emulator needed. Integration tests (`auth.test.ts`, `todos.test.ts`) run via `bun run test:backend` (emulator). Same policy: add tests rather than lower thresholds.

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
