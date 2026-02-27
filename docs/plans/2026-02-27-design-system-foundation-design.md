# Design System Foundation Design (2026-02-27)

## Scope
- Goal: Full design system refactor direction.
- Phase selected: Foundation-first.
- Visual direction: High-end brand style.
- Delivery priority: Build DS foundation first, then migrate feature screens incrementally.

## Decision Summary
1. Start in `.pen` to lock visual language, component variants, and state behavior.
2. Implement source code after visual spec is stable.
3. Keep feature-level changes minimal in this phase.

## Architecture
1. Design Tokens (single source of primitive values)
- Path: `apps/client/src/ui/theme/tokens.ts`
- Includes: color, spacing, radius, typography, shadow, zIndex, motion.
- Rule: feature code must not use raw color or hardcoded spacing values.

2. Semantic Theme (brand meaning layer)
- Paths:
  - `apps/client/src/ui/theme/semantic.ts`
  - `apps/client/src/ui/theme/colorScheme.ts`
- Semantic keys: `bg`, `surface`, `text`, `muted`, `primary`, `success`, `danger`, `border`, `focus`.
- Strategy: implement light first, keep dark scaffold ready.

3. Component Primitives (composable base UI)
- Path: `apps/client/src/ui/components/primitives/*`
- First set:
  - `Text`
  - `Stack`
  - `Button`
  - `Input`
  - `Surface`
  - `IconButton`
  - `Field`
  - `Divider`
  - `Badge`
- Rule: state handling lives in primitives (hover/focus/disabled/loading/invalid).

4. Recipes (UI-only composition)
- Path: `apps/client/src/ui/components/recipes/*`
- Examples:
  - `AuthCard`
  - `TodoRow`
  - `FilterChipGroup`
  - `ModalSection`
- Rule: no business logic, no store/api dependencies.

5. Migration Boundary
- Path: `apps/client/src/ui/components/index.ts`
- Keep compatibility re-exports so legacy `App*` APIs can map to new primitives.

## Naming and API Contract
1. Shared enums
- `size`: `sm | md | lg`
- `variant`: `primary | secondary | ghost | destructive`
- `tone`: `default | muted | success | danger | inverse`
- `state`: `default | hover | focus | disabled | loading | invalid`

2. Core component contracts
- `Button`: `variant`, `size`, `isLoading`, `disabled`, `leftIcon`, `rightIcon`
- `Input`: `size`, `invalid`, `leading`, `trailing`
- `Text`: `tone`, `size`, `weight`, `truncate`
- `Surface`: `elevation`, `padding`, `bordered`
- `IconButton`: `variant`, `size`, `selected`
- `Field`: `label`, `hint`, `error`, `required`

3. UI boundary rules
- Route/feature layers import only from `@/ui/components`.
- Avoid direct ad-hoc styling for semantic color/spacing in feature files.
- Keep old exports as aliases temporarily for controlled migration.

## Brand Direction
- Palette: premium blue-gray foundation with restrained gold accent.
- Typography: separate display/body scales in tokens.
- Depth model: fixed 3-level radius and shadow hierarchy.

## Implementation Plan (Foundation Phase)
1. Create theme foundation files (`tokens`, `semantic`, `colorScheme`).
2. Build primitives in this order:
- `Text`
- `Stack`
- `Button`
- `Input`
- `Surface`
- `IconButton`
- `Field`
- `Divider`
- `Badge`
3. Wire compatibility exports in `ui/components/index.ts`.
4. Keep feature migration minimal in this phase.

## Verification Plan
Run after each milestone:
1. `bun run check:client:ui`
2. `bun run test`
3. `bun run check:web`
4. Optional full confidence pass: `bun run check:expo`

## Risks and Mitigations
1. Risk: visual drift between `.pen` and code.
- Mitigation: treat `.pen` states/variants as the source of truth and compare after each primitive batch.

2. Risk: breaking existing screens during migration.
- Mitigation: maintain compatibility aliases and migrate incrementally.

3. Risk: style sprawl from mixed conventions.
- Mitigation: enforce import boundary and semantic-token-only usage.
