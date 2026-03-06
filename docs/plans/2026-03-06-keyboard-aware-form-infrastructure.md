# Keyboard-Aware Form Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce shared keyboard-aware infrastructure for full-screen forms and modal form sheets, then migrate the current auth and todo/tag form surfaces to it without breaking web.

**Architecture:** Add a shared `KeyboardAwareScrollContainer` primitive for cross-platform form scrolling and keyboard avoidance, then layer `FormScreenContainer` and a new `ModalFormSheet` on top of it. Migrate feature forms to these shared containers so platform-specific keyboard behavior no longer lives in feature code.

**Tech Stack:** Expo React Native, React Native `KeyboardAvoidingView` / `ScrollView` / `Modal`, Jest + React Native Testing Library, Maestro Android/iOS E2E.

---

### Task 1: Add `KeyboardAwareScrollContainer`

**Files:**
- Create: `apps/client/src/ui/components/KeyboardAwareScrollContainer.tsx`
- Modify: `apps/client/src/ui/components/index.ts`
- Test: `apps/client/tests/ui/components/KeyboardAwareScrollContainer.test.tsx`

**Step 1: Write the failing tests**

Add tests for:

- rendering children
- iOS keyboard-aware behavior
- Android-safe render behavior
- web-safe fallback behavior

Example assertions:

```tsx
it('renders children inside the scroll container', () => {
  const { getByText } = render(
    <KeyboardAwareScrollContainer>
      <Text>Form body</Text>
    </KeyboardAwareScrollContainer>,
  )

  expect(getByText('Form body')).toBeTruthy()
})
```

```tsx
it('uses keyboard-aware behavior on ios', () => {
  Platform.OS = 'ios'
  const { UNSAFE_getByType } = render(
    <KeyboardAwareScrollContainer>
      <Text>Body</Text>
    </KeyboardAwareScrollContainer>,
  )

  expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding')
})
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
cd apps/client && bun run test KeyboardAwareScrollContainer
```

Expected:

- FAIL because `KeyboardAwareScrollContainer` does not exist yet

**Step 3: Write the minimal implementation**

Create a shared component that:

- wraps content in `KeyboardAvoidingView`
- renders a `ScrollView`
- exposes `children`, `className`, `contentClassName`, and optional `keyboardVerticalOffset`
- uses safe defaults for:
  - `keyboardShouldPersistTaps="handled"`
  - `keyboardDismissMode`
  - `contentContainerStyle={{ flexGrow: 1 }}`
- uses platform-aware behavior:
  - iOS: `behavior="padding"`
  - Android/web: no iOS-only behavior, but still render through the same API

**Step 4: Export the component**

Update:

- `apps/client/src/ui/components/index.ts`

to export the new primitive.

**Step 5: Run the tests to verify they pass**

Run:

```bash
cd apps/client && bun run test KeyboardAwareScrollContainer
```

Expected:

- PASS for the new component tests

**Step 6: Commit**

```bash
git add apps/client/src/ui/components/KeyboardAwareScrollContainer.tsx apps/client/src/ui/components/index.ts apps/client/tests/ui/components/KeyboardAwareScrollContainer.test.tsx
git commit -m "feat(ui): add keyboard-aware scroll container"
```

---

### Task 2: Refactor `FormScreenContainer` to use the shared primitive

**Files:**
- Modify: `apps/client/src/ui/components/FormScreenContainer.tsx`
- Test: `apps/client/tests/ui/components/FormScreenContainer.test.tsx`

**Step 1: Write the failing tests**

Add or extend tests to verify:

- `FormScreenContainer` still renders children
- the component uses `KeyboardAwareScrollContainer`
- the existing `className` and `contentClassName` props still work

Example:

```tsx
it('renders children through the shared keyboard-aware container', () => {
  const { getByText } = render(
    <FormScreenContainer>
      <Text>Login form</Text>
    </FormScreenContainer>,
  )

  expect(getByText('Login form')).toBeTruthy()
})
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
cd apps/client && bun run test FormScreenContainer
```

Expected:

- FAIL until `FormScreenContainer` is migrated

**Step 3: Replace the ad hoc implementation**

Refactor `FormScreenContainer` to:

- use `KeyboardAwareScrollContainer`
- preserve current public props
- keep feature forms unchanged

**Step 4: Run the tests to verify they pass**

Run:

```bash
cd apps/client && bun run test FormScreenContainer
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add apps/client/src/ui/components/FormScreenContainer.tsx apps/client/tests/ui/components/FormScreenContainer.test.tsx
git commit -m "refactor(ui): route form screen container through shared keyboard primitive"
```

---

### Task 3: Add `ModalFormSheet`

**Files:**
- Create: `apps/client/src/ui/components/ModalFormSheet.tsx`
- Modify: `apps/client/src/ui/components/index.ts`
- Test: `apps/client/tests/ui/components/ModalFormSheet.test.tsx`

**Step 1: Write the failing tests**

Add tests for:

- rendering overlay + sheet body
- optional footer slot rendering
- scrollable content body
- Android request-close behavior dismissing keyboard before calling `onClose`

Example:

```tsx
it('renders footer actions outside the scroll body when provided', () => {
  const { getByText } = render(
    <ModalFormSheet visible onClose={jest.fn()} footer={<Text>Save</Text>}>
      <Text>Body</Text>
    </ModalFormSheet>,
  )

  expect(getByText('Body')).toBeTruthy()
  expect(getByText('Save')).toBeTruthy()
})
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
cd apps/client && bun run test ModalFormSheet
```

Expected:

- FAIL because the component does not exist yet

**Step 3: Implement the shared modal primitive**

Build `ModalFormSheet` with:

- `visible`
- `onClose`
- `children`
- optional `footer`
- optional `maxWidth`
- optional `testID`

Implementation requirements:

- use `Modal`
- use bottom-sheet layout with overlay
- keep body content inside a scrollable area
- keep footer outside the scroll body when provided
- on Android, intercept `onRequestClose`:
  - if keyboard is visible, dismiss keyboard and do not close yet
  - otherwise call `onClose`

**Step 4: Export the component**

Update:

- `apps/client/src/ui/components/index.ts`

**Step 5: Run the tests to verify they pass**

Run:

```bash
cd apps/client && bun run test ModalFormSheet
```

Expected:

- PASS

**Step 6: Commit**

```bash
git add apps/client/src/ui/components/ModalFormSheet.tsx apps/client/src/ui/components/index.ts apps/client/tests/ui/components/ModalFormSheet.test.tsx
git commit -m "feat(ui): add modal form sheet primitive"
```

---

### Task 4: Migrate todo and tag form modals

**Files:**
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`
- Modify: `apps/client/src/features/todos/TagFormModal.tsx`
- Test: `apps/client/tests/features/todos/CreateTodoModal.test.tsx`
- Test: `apps/client/tests/features/todos/TagFormModal.test.tsx`

**Step 1: Write the failing tests**

Extend tests to cover:

- modal content still renders through shared sheet
- footer actions remain renderable
- Android request-close does not close immediately when keyboard is visible
- existing edit-mode prefill behavior stays intact

Add a regression test for the create modal layout contract:

```tsx
it('keeps primary actions in the modal footer structure', () => {
  render(<CreateTodoModal />)
  expect(screen.getByTestId('create-todo-save')).toBeTruthy()
})
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
cd apps/client && bun run test CreateTodoModal TagFormModal
```

Expected:

- FAIL until both modals migrate to `ModalFormSheet`

**Step 3: Migrate the feature modals**

For both modals:

- remove duplicated sheet shell structure
- move body content into `ModalFormSheet`
- move action buttons into the shared footer slot where appropriate
- preserve feature logic for submit, cancel, and local validation

For `CreateTodoModal` specifically:

- keep form body scrollable
- ensure Save / Cancel are not part of the scroll body if footer slot is used
- remove feature-level Android keyboard-close handling that is now owned by `ModalFormSheet`

**Step 4: Run the tests to verify they pass**

Run:

```bash
cd apps/client && bun run test CreateTodoModal TagFormModal
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add apps/client/src/features/todos/CreateTodoModal.tsx apps/client/src/features/todos/TagFormModal.tsx apps/client/tests/features/todos/CreateTodoModal.test.tsx apps/client/tests/features/todos/TagFormModal.test.tsx
git commit -m "refactor(todos): migrate form modals to modal form sheet"
```

---

### Task 5: Verify auth forms still behave correctly

**Files:**
- Modify: `apps/client/src/features/auth/LoginForm.tsx`
- Modify: `apps/client/src/features/auth/SignUpForm.tsx`
- Test: `apps/client/tests/features/auth/LoginForm.test.tsx`
- Test: `apps/client/tests/features/auth/SignUpForm.test.tsx`

**Step 1: Write or extend the failing tests**

Cover:

- forms still render inside `FormScreenContainer`
- submit flow remains unchanged
- input refs and submit progression still work

**Step 2: Run the tests to verify they fail if migration breaks behavior**

Run:

```bash
cd apps/client && bun run test LoginForm SignUpForm
```

Expected:

- FAIL only if shared container migration broke current assumptions

**Step 3: Make only the minimal auth updates**

Adjust auth forms only if necessary after the shared container migration. Do not add feature-specific keyboard logic unless the shared primitive cannot express a required behavior.

**Step 4: Run the tests to verify they pass**

Run:

```bash
cd apps/client && bun run test LoginForm SignUpForm
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add apps/client/src/features/auth/LoginForm.tsx apps/client/src/features/auth/SignUpForm.tsx apps/client/tests/features/auth/LoginForm.test.tsx apps/client/tests/features/auth/SignUpForm.test.tsx
git commit -m "test(auth): verify keyboard-aware form screen integration"
```

---

### Task 6: Full verification and mobile E2E

**Files:**
- Modify as needed from prior tasks
- Optional docs update: `docs/testing.md`
- Optional docs update: `docs/runbooks/maestro-mobile-e2e.md`

**Step 1: Run targeted UI and unit verification**

Run:

```bash
bun run test:client
```

Expected:

- PASS

**Step 2: Run web safety verification**

Run:

```bash
bun run check:web
```

Expected:

- PASS

**Step 3: Run iOS mobile E2E**

Run:

```bash
bun run e2e:ios
```

Expected:

- PASS

**Step 4: Run Android mobile E2E**

Run:

```bash
bun run e2e:android
```

Expected:

- PASS

**Step 5: Update docs only if behavior or verification workflow changed materially**

If the shared keyboard-aware primitives change how form/mode surfaces should be built or tested, update:

- `docs/testing.md`
- `docs/runbooks/maestro-mobile-e2e.md`

**Step 6: Final commit**

```bash
git add apps/client/src/ui/components apps/client/src/features/auth apps/client/src/features/todos apps/client/tests docs/testing.md docs/runbooks/maestro-mobile-e2e.md
git commit -m "feat(ui): add shared keyboard-aware form infrastructure"
```
