# AGENTS.md — Hero Expo Stack Skeleton

Read this before editing code or docs in this repository.

## Required Startup

1. Run: `~/.codex/superpowers/.codex/superpowers-codex bootstrap`
2. Read `CLAUDE.md`
3. Follow this file for agent-specific execution rules

## Package Manager

- Use `bun` only.
- Do not use `npm`, `yarn`, or `pnpm` for repo tasks.

## Non-Negotiable Architecture

- API-first: app code never reads/writes Firestore directly.
- Query/state split:
  - TanStack Query for server state.
  - Zustand for UI state only.
- Query keys must come from `app/src/data/queryKeys.ts` factory.
- `shared/types/api.ts` is the API contract source of truth.

## UI Baseline Rules

- i18n is required from initial implementation; do not hardcode user-facing strings in screens/components.
- Safe area support is required for all full-screen mobile routes:
  - Root must include `SafeAreaProvider`.
  - Route screens should use `SafeAreaView` with explicit edges.
- Keep test selectors (`testID`) locale-independent.
- For iOS/Android native parity and E2E reliability, use Expo Dev Client (`expo start --dev-client`); do not treat Expo Go as the default runtime.
- Web is a first-class target: run `cd app && bun run web` for feature smoke checks and avoid web assertions that depend on localized text.
- Web a11y baseline is required for feature completion:
  - Keyboard operable core flow (login/create/toggle).
  - Inputs/actions expose accessible names.
  - Error feedback is announced via live-region style semantics.

## Firebase CLI + LLM Operations

- Prefer root scripts and wrappers over raw global CLI:
  - `bun run firebase ...`
  - `bash scripts/firebase/check-project.sh`
- Emulator-first for all development and tests.
- Never run `firebase deploy` without explicit user instruction in the active thread.
- For non-emulator Firebase commands, pass explicit project targeting.
- Use `docs/runbooks/llm-firebase-cli-ops.md` process when LLM is assisting CLI operations.
- Record CLI sessions with `docs/runbooks/firebase-cli-session-template.md`.

## Testing and Verification

Run relevant checks before claiming completion:

- `bun run test`
- `bun run test:backend`
- `bun run e2e:web`
- `bun run ci`

If you cannot run a check, explicitly state what was not run and why.

## Guardrails

- Do not commit secrets or modify real `.env` values.
- Do not deploy to production by default.
- Do not add `any` types when shared/app types can be defined.
- Do not use `console.log` in committed app/backend code; use project logger utilities.
