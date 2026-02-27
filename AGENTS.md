# AGENTS.md — Hero Expo Stack Skeleton

Read this before editing code or docs in this repository.

## Required Startup

1. Run: `~/.codex/superpowers/.codex/superpowers-codex bootstrap`
2. Read `CLAUDE.md`
3. Follow this file for agent-specific execution rules

## Development Workflow

- **Default: develop directly in this repo.** Do not use git worktrees unless the user explicitly requests them.
- If the user asks for worktree isolation, then use `using-git-worktrees` skill and create an isolated worktree.

## Package Manager

- Use `bun` only.
- Do not use `npm`, `yarn`, or `pnpm` for repo tasks.

## Non-Negotiable Architecture

- API-first: app code never reads/writes Firestore directly.
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
- Web a11y baseline is required for feature completion:
  - Keyboard operable core flow (login/create/toggle).
  - Inputs/actions expose accessible names.
  - Error feedback is announced via live-region style semantics.

## Design System First Workflow (Required)

- **UI 功能開發流程（順序不可顛倒）：**
  1. **先確認 Pen UI**：在 `.pen` 內完成或確認畫面／元件（版面、語意色變數、可重用元件）。必要時用 Pencil MCP 查詢或調整。
  2. **再訂計劃**：依據 Pen 結果撰寫實作計劃（要動的檔案、對應的 Pen 元件／ID、i18n keys）。
  3. **最後實作**：依計劃寫 Code（`@/ui/components`、route/feature、design-tokens 若需同步），並更新 `docs/design-system/pen-code-component-mapping.md`。
  - 不要先寫畫面再回頭補 Pen；不要跳過計劃直接改 Code。
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
