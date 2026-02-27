# Pen Component → Source Code Mapping Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Use `pencil/app/app-core-screens.pen` as the source of truth and ensure all reusable components on canvas are mapped to concrete code components in `apps/client/src/ui/components/**`, then migrate route/feature usage through the unified UI boundary.

**Architecture:** Follow DS-first rollout: (1) variables/tokens, (2) reusable component implementations, (3) screen consumption/migration, (4) legacy cleanup. Pen reusable components are mapped one-to-one to source primitives/recipes with clear ownership.

**Tech Stack:** Expo + React Native, TypeScript, UI boundary at `@/ui/components`, Bun checks.

---

## Status of Previous Plan

Previous file: `docs/plans/2026-02-27-design-system-foundation-implementation.md`

Current status: **Complete** (2026-02-27)
- All four tasks executed via subagent.
- Mapping matrix filled; missing components implemented; route/feature migrated to DS components; verification gate passed.

This plan supersedes the old plan for execution tracking while preserving its direction.

---

## Canonical Pen Reusable Components (Current)

From `app-core-screens.pen`:
- `component/Card` (`QaOPf`)
- `component/Field` (`ogBSt`)
- `component/Input` (`toRVp`)
- `component/PrimaryButton` (`3IKQy`)
- `component/LinkAction` (`9eh24`)
- `component/OutlineButton` (`C1f9F`)
- `component/FilterChipActive` (`edQQ4`)
- `component/FilterChip` (`uSf0r`)
- `component/Stack` (`S6wSM`)
- `component/TodoItem` (`bEjH4`)
- `component/TextArea` (`JEOdo`)
- `component/StatusBar` (`l5b7W`)
- `component/ScreenTitle` (`T5cMs`)
- `component/SectionLabel` (`Z7k3d`)
- `component/SheetHandle` (`McPgO`)

---

## Task 1: Create Explicit Mapping Matrix (Pen → Source)

**Files:**
- Create/modify: `docs/plans/2026-02-27-pen-component-code-mapping-plan.md`
- Inspect: `apps/client/src/ui/components/**`

**Outcome:** Table that maps each pen reusable component to:
- source file path
- exported API name
- variant/state support
- migration priority (`P0/P1/P2`)

---

## Task 2: Complete Missing Source Components

**Files:**
- Modify/create under: `apps/client/src/ui/components/**`
- Modify export boundary: `apps/client/src/ui/components/index.ts`

**Outcome:** Every pen reusable component has a corresponding source component or clearly documented composition strategy (no ambiguity).

---

## Task 3: Enforce Consumption via UI Boundary

**Files:**
- Route/feature layer: `apps/client/app/**`, `apps/client/src/features/**`
- UI layer only from: `@/ui/components`

**Outcome:** No direct ad-hoc imports for shared UI; route/feature consumption aligns with mapped components.

---

## Task 4: Verification Gate

Run and record:
- `bun run check:client:ui`
- `bun run test`
- `bun run check:web`
- (optional for confidence) `bun run check:expo`, `bun run e2e:web`, `bun run ci`

If failures occur, record root cause and keep plan status as incomplete.

### Verification Results (2026-02-27)

| Check | Result |
|-------|--------|
| `bun run check:client:ui` | PASS |
| `bun run test` | 7 suites, 36 tests passed |
| `bun run check:web` | Web bundle built successfully |

---

## Mapping Matrix (Pen → Source)

| Pen Component | ID | Source Component | Source File | Status | Variant/state support | Priority |
|---------------|-----|------------------|-------------|--------|----------------------|----------|
| component/Field | ogBSt | AppField | AppField.tsx | done | label + children (AppInput/AppTextArea), required, error | P0 |
| component/PrimaryButton | 3IKQy | AppButton | AppButton.tsx | done | variant=primary, size sm/md/lg, states, isLoading | P0 |
| component/LinkAction | 9eh24 | AppLinkAction | AppLinkAction.tsx | done | text-primary, underline | P2 |
| component/OutlineButton | C1f9F | AppButton | AppButton.tsx | done | variant=outline (border-primary, bg-transparent) | P1 |
| component/FilterChipActive | edQQ4 | AppFilterChip | AppFilterChip.tsx | done | active=true | P1 |
| component/FilterChip | uSf0r | AppFilterChip | AppFilterChip.tsx | done | active=false | P1 |
| component/TodoItem | bEjH4 | features/todos/TodoItem.tsx | features/todos/TodoItem.tsx | done | Canonical; uses AppStack, AppText from @/ui | P1 |
| component/TextArea | JEOdo | AppTextArea | AppTextArea.tsx | done | multiline, size, state | P0 |
| component/StatusBar | l5b7W | AppStatusBar | AppStatusBar.tsx | done | safe-area top, bg-surface | P2 |
| component/ScreenTitle | T5cMs | AppText | AppText.tsx | done | size="xl" weight="bold" | P2 |
| component/SectionLabel | Z7k3d | AppText | AppText.tsx | done | size="sm" tone="muted" | P2 |
| component/SheetHandle | McPgO | AppSheetHandle | AppSheetHandle.tsx | done | w-12 h-1 rounded-full bg-muted | P2 |

## Current Source Snapshot (Actual)

Detected UI component files:
- `apps/client/src/ui/components/AppButton.tsx` — AppButton (variants: primary, secondary, ghost, outline, destructive)
- `apps/client/src/ui/components/AppCard.tsx` — AppCard
- `apps/client/src/ui/components/AppField.tsx` — AppField (label + children)
- `apps/client/src/ui/components/AppFilterChip.tsx` — AppFilterChip (active prop)
- `apps/client/src/ui/components/AppInput.tsx` — AppInput (single-line)
- `apps/client/src/ui/components/AppLinkAction.tsx` — AppLinkAction
- `apps/client/src/ui/components/AppSheetHandle.tsx` — AppSheetHandle
- `apps/client/src/ui/components/AppStack.tsx` — AppStack
- `apps/client/src/ui/components/AppStatusBar.tsx` — AppStatusBar
- `apps/client/src/ui/components/AppText.tsx` — AppText
- `apps/client/src/ui/components/AppTextArea.tsx` — AppTextArea (multiline)
- `apps/client/src/ui/components/primitives/Text.tsx`, `Stack.tsx`

Current export boundary (`index.ts`):
- `AppButton`, `AppCard`, `AppField`, `AppFilterChip`, `AppInput`, `AppLinkAction`, `AppSheetHandle`, `AppStack`, `AppStatusBar`, `AppText`, `AppTextArea`

### Migration Summary

- **FilterTabs**: migrated from AppButton to AppFilterChip
- **CreateTodoModal**: description field migrated from AppInput to AppTextArea
