# Design System Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a foundation-first design system for the client app with premium brand styling, semantic theming, reusable primitives, and compatibility exports, without large feature rewrites in this phase.

**Architecture:** We establish a strict UI pipeline: primitive tokens -> semantic theme -> primitive components -> UI export boundary. Feature and route layers remain mostly unchanged and consume UI through `@/ui/components` only. Existing `App*` exports are preserved as compatibility aliases to avoid breaking changes while enabling incremental migration.

**Tech Stack:** Expo/React Native, TypeScript, NativeWind className utilities, existing client test stack (Jest + RNTL), Bun scripts.

---

### Task 1: Baseline and Existing UI Audit

**Files:**
- Inspect: `apps/client/src/ui/tokens.ts`
- Inspect: `apps/client/src/ui/theme/colorScheme.ts`
- Inspect: `apps/client/src/ui/components/index.ts`
- Inspect: `apps/client/src/ui/components/*.tsx`
- Inspect: `apps/client/src/features/**/*.tsx`

**Step 1: Capture current UI surface and dependencies**
- List current exported components and where they are consumed.

**Step 2: Record migration constraints**
- Confirm route/feature imports already go through `@/ui/components` (or identify exceptions).

**Step 3: Document current token gaps**
- Note missing primitives (shadow, zIndex, motion, display/body typography separation).

**Step 4: Commit audit notes**
```bash
git add docs/plans/2026-02-27-design-system-foundation-implementation.md
git commit -m "docs: add design system foundation implementation plan"
```

### Task 2: Create Theme Primitive Tokens

**Files:**
- Create: `apps/client/src/ui/theme/tokens.ts`
- Modify: `apps/client/src/ui/tokens.ts`
- Test: `apps/client/tests/ui/theme/tokens.test.ts`

**Step 1: Write the failing test**
- Assert the new token object exposes expected groups: `colors`, `spacing`, `radii`, `typography`, `shadow`, `zIndex`, `motion`.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/theme/tokens.test.ts`
Expected: FAIL because `theme/tokens.ts` does not exist yet.

**Step 3: Write minimal implementation**
- Create typed token object with premium brand palette (blue-gray + gold accent) and non-breaking defaults.
- Keep legacy exports from `src/ui/tokens.ts` forwarding to new source.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/theme/tokens.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/theme/tokens.ts apps/client/src/ui/tokens.ts apps/client/tests/ui/theme/tokens.test.ts
git commit -m "feat(ui): add primitive theme tokens"
```

### Task 3: Create Semantic Theme Layer

**Files:**
- Create: `apps/client/src/ui/theme/semantic.ts`
- Modify: `apps/client/src/ui/theme/colorScheme.ts`
- Test: `apps/client/tests/ui/theme/semantic.test.ts`

**Step 1: Write the failing test**
- Assert light semantic keys exist: `bg`, `surface`, `text`, `muted`, `primary`, `danger`, `success`, `border`, `focus`.
- Assert dark scaffold exists with same keys.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/theme/semantic.test.ts`
Expected: FAIL due to missing semantic module/keys.

**Step 3: Write minimal implementation**
- Map semantic values from primitive tokens.
- Keep `colorScheme` as the consumable object for components.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/theme/semantic.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/theme/semantic.ts apps/client/src/ui/theme/colorScheme.ts apps/client/tests/ui/theme/semantic.test.ts
git commit -m "feat(ui): add semantic theme layer"
```

### Task 4: Build Primitive Text and Stack

**Files:**
- Create: `apps/client/src/ui/components/primitives/Text.tsx`
- Create: `apps/client/src/ui/components/primitives/Stack.tsx`
- Modify: `apps/client/src/ui/components/AppText.tsx`
- Modify: `apps/client/src/ui/components/AppStack.tsx`
- Test: `apps/client/tests/ui/components/text-stack.test.tsx`

**Step 1: Write the failing test**
- Assert Text supports `tone`, `size`, `weight` and maps to expected class names.
- Assert Stack supports `direction` and `gap` behavior.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/components/text-stack.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Implement primitives and migrate App* wrappers to thin aliases.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/components/text-stack.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/components/primitives/Text.tsx apps/client/src/ui/components/primitives/Stack.tsx apps/client/src/ui/components/AppText.tsx apps/client/src/ui/components/AppStack.tsx apps/client/tests/ui/components/text-stack.test.tsx
git commit -m "feat(ui): add text and stack primitives"
```

### Task 5: Build Primitive Button and Input

**Files:**
- Create: `apps/client/src/ui/components/primitives/Button.tsx`
- Create: `apps/client/src/ui/components/primitives/Input.tsx`
- Modify: `apps/client/src/ui/components/AppButton.tsx`
- Modify: `apps/client/src/ui/components/AppInput.tsx`
- Test: `apps/client/tests/ui/components/button-input.test.tsx`

**Step 1: Write the failing test**
- Button variants, sizes, loading state, disabled behavior.
- Input invalid state and size classes.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/components/button-input.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Implement new primitives and non-breaking App* compatibility.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/components/button-input.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/components/primitives/Button.tsx apps/client/src/ui/components/primitives/Input.tsx apps/client/src/ui/components/AppButton.tsx apps/client/src/ui/components/AppInput.tsx apps/client/tests/ui/components/button-input.test.tsx
git commit -m "feat(ui): add button and input primitives"
```

### Task 6: Build Surface, IconButton, Divider, Badge, Field

**Files:**
- Create: `apps/client/src/ui/components/primitives/Surface.tsx`
- Create: `apps/client/src/ui/components/primitives/IconButton.tsx`
- Create: `apps/client/src/ui/components/primitives/Divider.tsx`
- Create: `apps/client/src/ui/components/primitives/Badge.tsx`
- Create: `apps/client/src/ui/components/primitives/Field.tsx`
- Test: `apps/client/tests/ui/components/primitives-additional.test.tsx`

**Step 1: Write the failing test**
- Verify base render and state/variant props for each primitive.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/components/primitives-additional.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Add primitives with semantic-token usage and accessibility defaults.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/components/primitives-additional.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/components/primitives/*.tsx apps/client/tests/ui/components/primitives-additional.test.tsx
git commit -m "feat(ui): add surface and supporting primitives"
```

### Task 7: Export Boundary and Compatibility Layer

**Files:**
- Modify: `apps/client/src/ui/components/index.ts`
- Test: `apps/client/tests/ui/components/exports.test.ts`

**Step 1: Write the failing test**
- Assert index exports both new primitives and legacy `App*` aliases.

**Step 2: Run test to verify it fails**
Run: `cd apps/client && bun test apps/client/tests/ui/components/exports.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Update index barrel to be the single import surface.

**Step 4: Run test to verify it passes**
Run: `cd apps/client && bun test apps/client/tests/ui/components/exports.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add apps/client/src/ui/components/index.ts apps/client/tests/ui/components/exports.test.ts
git commit -m "refactor(ui): enforce single component export boundary"
```

### Task 8: Validation and Safety Checks

**Files:**
- Optional docs update: `README.md` or `docs/` section if needed

**Step 1: Run required UI boundary check**
Run: `bun run check:client:ui`
Expected: PASS.

**Step 2: Run app test suite**
Run: `bun run test`
Expected: PASS.

**Step 3: Run web bundle check**
Run: `bun run check:web`
Expected: PASS.

**Step 4: Optional expo validation**
Run: `bun run check:expo`
Expected: PASS (or document reason if skipped).

**Step 5: Final commit**
```bash
git add -A
git commit -m "feat(ui): complete design system foundation phase"
```

### Task 9: Optional Next Phase Prep (No Large Rewrite Yet)

**Files:**
- Create: `docs/plans/2026-02-27-design-system-migration-phase2.md`

**Step 1: Create migration queue**
- List highest-value screens/components to migrate first (Auth, Todos).

**Step 2: Define rollout and risk controls**
- Per-screen smoke checks and rollback approach.

**Step 3: Commit**
```bash
git add docs/plans/2026-02-27-design-system-migration-phase2.md
git commit -m "docs: add phase 2 design system migration queue"
```
