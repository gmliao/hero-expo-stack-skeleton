# Apps Client NativeWind + Gluestack Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `apps/client` front-end foundation using NativeWind + Gluestack with centralized tokens and `App*` components, while keeping legacy `app/` untouched during migration.

**Architecture:** Keep backend/shared contracts unchanged and migrate only the front-end runtime target to `apps/client`. Use a strict UI layering model: design tokens -> App components -> feature screens. Enforce boundaries so feature code cannot directly import low-level UI libraries.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, Expo Router, NativeWind v4, Tailwind CSS, Gluestack UI, TanStack Query, Zustand, i18next.

---

## Mandatory Verification On Every Edit

After every code-changing step (not only at the end), run both checks:

1. **Playwright browser console check (CLI)**  
Run: `bun run check:pw:console`  
Expected: PASS with no `console.error` / `pageerror`.

2. **Expo compile/doctor check**  
Run: `bun run check:expo`  
Expected: PASS (`expo-doctor` clean and web export succeeds).

If either check fails, stop and fix before the next task.

### Task 1: Create `apps/client` baseline and route root scripts to it

**Files:**
- Create: `apps/client/**` (copied from current `app/**` baseline)
- Modify: `package.json`
- Modify: `README.md`

**Step 1: Verify `apps/client` does not exist yet**

Run: `test -d apps/client && echo exists || echo missing`
Expected: `missing`

**Step 2: Create baseline app directory**

Run:
```bash
mkdir -p apps
rsync -a --exclude node_modules --exclude .expo app/ apps/client/
```

Expected: `apps/client` contains app runtime files.

**Step 3: Rewire root scripts to `apps/client`**

Modify `package.json` scripts:
- `app`: `cd apps/client && dotenv -e ../../.env -- bun run start`
- `test`: `cd apps/client && bun run test`
- `e2e:ios`: `cd apps/client && bun run e2e:ios`
- `check:web`: `cd apps/client && bun run build:web`

Update README references from `app/` to `apps/client/` for runtime commands.

**Step 4: Verify script rewiring compiles**

Run: `bun run app -- --help`
Expected: command resolves and launches Expo CLI help output (no path errors).

Run:
```bash
bun run check:pw:console
bun run check:expo
```
Expected: both PASS.

**Step 5: Commit**

```bash
git add apps/client package.json README.md
git commit -m "chore: introduce apps/client runtime target"
```

### Task 2: Replace Tamagui toolchain in `apps/client` with NativeWind + Gluestack

**Files:**
- Modify: `apps/client/package.json`
- Modify: `apps/client/babel.config.js`
- Modify: `apps/client/metro.config.js`
- Modify: `apps/client/app/_layout.tsx`
- Create: `apps/client/tailwind.config.js`
- Create: `apps/client/global.css`
- Delete: `apps/client/src/ui/tamagui.config.ts`
- Delete: `apps/client/src/ui/theme/fonts.ts`
- Delete: `apps/client/src/ui/theme/themes.ts`
- Delete: `apps/client/src/ui/theme/tokens.ts`

**Step 1: Write failing smoke check before migration**

Run: `cd apps/client && bun run build:web`
Expected: FAIL or warnings due old Tamagui configuration still present.

**Step 2: Install and configure NativeWind + Gluestack**

Run:
```bash
cd apps/client
bun add nativewind tailwindcss @gluestack-ui/themed @gluestack-ui/config @gluestack-style/react
bun remove tamagui @tamagui/core @tamagui/config @tamagui/font-inter @tamagui/animations-react-native @tamagui/babel-plugin @tamagui/metro-plugin
```

Configure Babel with `nativewind/babel`, Metro with `withNativeWind`, and ensure `global.css` is imported once from root layout.

**Step 3: Initialize Gluestack configuration**

Run in `apps/client`:
```bash
bunx gluestack-ui@latest init
```

Use Expo + NativeWind-compatible defaults when prompted.

**Step 4: Replace root provider wiring**

Remove `TamaguiProvider` and keep: `SafeAreaProvider`, `QueryClientProvider`, `I18nextProvider`, `Stack`.

**Step 5: Verify base runtime**

Run:
```bash
cd apps/client
bun run type-check
bun run build:web
bun run check:pw:console
bun run check:expo
```

Expected: PASS without Tamagui imports.

**Step 6: Commit**

```bash
git add apps/client/package.json apps/client/babel.config.js apps/client/metro.config.js apps/client/app/_layout.tsx apps/client/tailwind.config.js apps/client/global.css apps/client/src/ui
git commit -m "refactor(client): switch to nativewind and gluestack foundation"
```

### Task 3: Build centralized UI tokens and App component layer

**Files:**
- Create: `apps/client/src/ui/tokens.ts`
- Create: `apps/client/src/ui/theme/colorScheme.ts`
- Create: `apps/client/src/ui/components/AppText.tsx`
- Create: `apps/client/src/ui/components/AppButton.tsx`
- Create: `apps/client/src/ui/components/AppInput.tsx`
- Create: `apps/client/src/ui/components/AppStack.tsx`
- Create: `apps/client/src/ui/components/index.ts`
- Modify: `apps/client/tailwind.config.js`

**Step 1: Add typed token source of truth**

Implement semantic tokens only: `bg`, `surface`, `text`, `muted`, `primary`, `danger`, `success`, `border`, plus spacing/radius/font scales.

**Step 2: Map tokens into Tailwind + Gluestack theme**

Ensure Tailwind theme keys consume token values and Gluestack uses matching semantics.

**Step 3: Implement constrained `App*` APIs**

- `AppButton`: `variant`, `size`, `isLoading`, `disabled`
- `AppText`: `tone`, `weight`, `size`
- `AppInput`: `invalid`, `size`
- `AppStack`: controlled vertical/horizontal spacing utilities

**Step 4: Verify component exports**

Run:
```bash
cd apps/client && bun run type-check
bun run check:pw:console
bun run check:expo
```
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/client/src/ui apps/client/tailwind.config.js
git commit -m "feat(client-ui): add centralized tokens and app components"
```

### Task 4: Enforce agent-facing style/component boundaries

**Files:**
- Modify: `AGENTS.md`
- Create: `scripts/check-client-ui-usage.sh`
- Create: `scripts/check-playwright-console.mjs`
- Modify: `package.json`

**Step 1: Add explicit agent rules**

In `AGENTS.md`, define:
- feature/routes must import from `@/ui/components` only
- no direct `@gluestack-ui/*` imports outside `src/ui/**`
- no inline `style={{ ... }}` outside whitelisted files

**Step 2: Add boundary check script**

`check-client-ui-usage.sh` should fail if:
- forbidden imports found in `apps/client/app` or `apps/client/src/features`
- inline style literals found outside allowlist

**Step 3: Wire check into CI command chain**

Add scripts to root `package.json`:
- `check:client:ui`
- `check:pw:console` (Playwright CLI console/pageerror guard)
- `check:expo` (`expo-doctor` + `build:web` under `apps/client`)

Include these in `ci` before tests.

**Step 4: Verify guardrails**

Run:
```bash
bun run check:client:ui
bun run check:pw:console
bun run check:expo
```
Expected: PASS (or intentional fail during test proving guard works).

**Step 5: Commit**

```bash
git add AGENTS.md scripts/check-client-ui-usage.sh package.json
git commit -m "chore: enforce client ui boundaries for agent outputs"
```

### Task 5: Migrate auth + todos screens in `apps/client` to `App*` components

**Files:**
- Modify: `apps/client/app/(auth)/login.tsx`
- Modify: `apps/client/app/(auth)/sign-up.tsx`
- Modify: `apps/client/app/(app)/index.tsx`
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`
- Modify: `apps/client/src/features/todos/FilterTabs.tsx`
- Modify: `apps/client/src/features/todos/TodoItem.tsx`

**Step 1: Replace low-level UI imports**

Remove direct Tamagui references and use `App*` components + allowed Gluestack wrappers where needed.

**Step 2: Preserve behavior and test IDs**

Keep all existing `testID`, i18n key usage, safe-area edges, and accessibility semantics.

**Step 3: Verify migrated client runtime**

Run:
```bash
bun run check:client:ui
bun run check:pw:console
bun run check:expo
bun run test
bun run check:web
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/client/app apps/client/src/features
git commit -m "refactor(client): migrate auth and todos to app component layer"
```

### Task 6: Full verification and handoff

**Files:**
- Modify: `README.md` (final migration notes)
- Modify: `docs/plans/2026-02-27-apps-client-nativewind-gluestack-foundation.md` (status section)

**Step 1: Execute full required validation matrix**

Run:
```bash
bun run check:pw:console
bun run check:expo
bun run test
bun run check:web
bun run test:backend
bun run e2e:web
bun run ci
```

Expected: all PASS.

**Step 2: Document any residual gaps**

If a command cannot run, record exact reason and blocking dependency.

**Step 3: Commit final docs update**

```bash
git add README.md docs/plans/2026-02-27-apps-client-nativewind-gluestack-foundation.md
git commit -m "docs: finalize apps/client migration notes and validation evidence"
```
