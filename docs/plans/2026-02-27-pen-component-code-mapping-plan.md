# Pen Component → Source Code Mapping Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Use `pencil/app/app-core-screens.pen` as the source of truth and ensure all reusable components on canvas are mapped to concrete code components in `apps/client/src/ui/components/**`, then migrate route/feature usage through the unified UI boundary.

**Architecture:** Follow DS-first rollout: (1) variables/tokens, (2) reusable component implementations, (3) screen consumption/migration, (4) legacy cleanup. Pen reusable components are mapped one-to-one to source primitives/recipes with clear ownership.

**Tech Stack:** Expo + React Native, TypeScript, UI boundary at `@/ui/components`, Bun checks.

---

## Status of Previous Plan

Previous file: `docs/plans/2026-02-27-design-system-foundation-implementation.md`

Current status: **Partially complete**
- Completed: token/semantic foundation and several UI component files were started/added.
- Not complete: full verification pipeline did not pass (`bun test` failure observed in environment), and there is no explicit final mapping checklist from `.pen` reusable component IDs to source component files.

This plan supersedes the old plan for execution tracking while preserving its direction.

---

## Canonical Pen Reusable Components (Current)

From `app-core-screens.pen`:
- `component/Field` (`ogBSt`)
- `component/PrimaryButton` (`3IKQy`)
- `component/LinkAction` (`9eh24`)
- `component/OutlineButton` (`C1f9F`)
- `component/FilterChipActive` (`edQQ4`)
- `component/FilterChip` (`uSf0r`)
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

---

## Mapping Checklist Template (to fill during execution)

| Pen Component | ID | Source Component | Source File | Status |
|---|---|---|---|---|
| component/Field | ogBSt | TBD | TBD | pending |
| component/PrimaryButton | 3IKQy | TBD | TBD | pending |
| component/LinkAction | 9eh24 | TBD | TBD | pending |
| component/OutlineButton | C1f9F | TBD | TBD | pending |
| component/FilterChipActive | edQQ4 | TBD | TBD | pending |
| component/FilterChip | uSf0r | TBD | TBD | pending |
| component/TodoItem | bEjH4 | TBD | TBD | pending |
| component/TextArea | JEOdo | TBD | TBD | pending |
| component/StatusBar | l5b7W | TBD | TBD | pending |
| component/ScreenTitle | T5cMs | TBD | TBD | pending |
| component/SectionLabel | Z7k3d | TBD | TBD | pending |
| component/SheetHandle | McPgO | TBD | TBD | pending |

## Current Source Snapshot (Actual)

Detected UI component files:
- `apps/client/src/ui/components/AppButton.tsx`
- `apps/client/src/ui/components/AppCard.tsx`
- `apps/client/src/ui/components/AppInput.tsx`
- `apps/client/src/ui/components/AppStack.tsx`
- `apps/client/src/ui/components/AppText.tsx`
- `apps/client/src/ui/components/primitives/Text.tsx`
- `apps/client/src/ui/components/primitives/Stack.tsx`

Current export boundary (`index.ts`):
- `AppButton`, `AppCard`, `AppInput`, `AppStack`, `AppText`

### Mapping Gap (Pen → Source)

Immediate gaps to implement in source code:
- `component/LinkAction`
- `component/OutlineButton`
- `component/FilterChipActive`
- `component/FilterChip`
- `component/TodoItem`
- `component/TextArea`
- `component/StatusBar`
- `component/ScreenTitle`
- `component/SectionLabel`
- `component/SheetHandle`

Partially covered (needs shape verification):
- `component/PrimaryButton` -> likely `AppButton`
- `component/Field` -> likely `AppInput` + label wrapper (missing dedicated `Field` API)
