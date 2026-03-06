# Keyboard-Aware Form Infrastructure Design

**Feature:** keyboard-aware-form-infrastructure

**Date:** 2026-03-06

**Status:** Approved

---

## Context

The current client has partial keyboard handling, but the behavior is inconsistent across platforms and form surfaces:

- Full-screen auth forms rely on a basic `KeyboardAvoidingView`, with limited Android behavior.
- Bottom-sheet style modals can scroll, but primary actions can still fall below the fold when the keyboard is open.
- Android back / keyboard-dismiss behavior can conflict with modal close behavior.
- Web does not need the same virtual-keyboard handling, but shared form APIs should degrade safely instead of branching feature code.

This surfaced in mobile E2E runs where modal actions became unreachable or keyboard-dismiss behavior closed the modal unexpectedly.

---

## Goals

- Provide shared keyboard-aware infrastructure for form screens and form modals.
- Handle iOS and Android together, with platform-specific behavior hidden behind shared primitives.
- Keep web on the same component API with safe no-op / low-intervention behavior.
- Make primary form actions reachable on small mobile viewports while the keyboard is open.
- Remove keyboard-avoidance logic from feature-level forms where possible.

## Non-Goals

- Rebuild all modal primitives in the app.
- Add custom animated bottom-sheet behavior.
- Introduce screen-specific keyboard hacks in route or feature files.
- Over-optimize for web virtual keyboards beyond safe fallback behavior.

---

## Approaches Considered

### Approach 1: Tune Existing `KeyboardAvoidingView` Usage

Adjust existing `KeyboardAvoidingView` props and keep current feature-level modal/screen implementations.

**Pros**

- Smallest code diff.
- Lowest short-term migration effort.

**Cons**

- Does not solve modal footer actions falling below the fold.
- Keeps keyboard logic duplicated across features.
- Android and iOS behavior remains inconsistent.
- Harder to test and maintain over time.

### Approach 2: Shared Keyboard-Aware Infrastructure

Create shared primitives for keyboard-aware scroll containers and modal sheets, then migrate the high-risk form surfaces to them.

**Pros**

- Centralizes platform differences.
- Solves both screen-level and modal-level keyboard avoidance.
- Gives a reusable foundation for future forms.
- Aligns with DS-first and shared-component architecture.

**Cons**

- Requires new component APIs and migration work.
- Needs careful testing across iOS, Android, and web.

### Approach 3: Patch Individual Features

Individually fix auth forms, todo modal, tag modal, and future forms case by case.

**Pros**

- Fastest for one isolated bug.

**Cons**

- Recreates the same problem repeatedly.
- Produces feature-level divergence and hidden platform bugs.
- Conflicts with shared-component direction.

### Recommendation

Adopt **Approach 2**.

This is the only option that solves the current bug class at the right layer and prevents repeated keyboard regressions across mobile form surfaces.

---

## Proposed Design

### 1. Shared Primitive: `KeyboardAwareScrollContainer`

This is the base primitive for keyboard-aware form content.

**Responsibilities**

- Wrap scrollable content for form-heavy surfaces.
- Normalize `ScrollView` behavior such as tap persistence and keyboard dismissal.
- Apply platform-aware keyboard avoidance internally.
- Provide a safe web fallback using the same API.

**Behavior**

- iOS: use keyboard avoidance that pushes content above the keyboard.
- Android: use container behavior that keeps form content scrollable and reachable when the keyboard is open.
- Web: degrade to standard scroll container behavior without mobile-only keyboard hacks.

**Why this layer**

Keyboard + scroll behavior is cross-cutting infrastructure, not feature logic. This belongs in shared UI.

### 2. Shared Screen Container: `FormScreenContainer`

Keep the public component name, but re-implement it on top of `KeyboardAwareScrollContainer`.

**Responsibilities**

- Preserve existing API used by auth screens.
- Centralize full-screen form behavior.
- Avoid feature-level keyboard configuration in auth components.

**Initial consumers**

- `LoginForm`
- `SignUpForm`

### 3. Shared Modal Primitive: `ModalFormSheet`

Add a shared bottom-sheet form primitive for modal forms.

**Responsibilities**

- Overlay + bottom-sheet layout.
- Max-height handling for small screens.
- Scrollable form body.
- Optional sticky footer actions.
- Android `onRequestClose` behavior: dismiss keyboard first, then close modal.

**Why this matters**

Form modals need a stable way to keep primary actions reachable. This cannot be guaranteed by scattered `ScrollView` + `KeyboardAvoidingView` usage.

**Initial consumers**

- `CreateTodoModal`
- `TagFormModal`

### 4. Footer Strategy

Sticky footer actions should be optional, not mandatory.

**Rationale**

- Some form modals need persistent Save / Cancel actions.
- Other modals may not want a pinned footer.
- Keyboard avoidance and modal layout should stay composable.

So the shared modal primitive should support:

- scrollable body content
- optional footer slot
- footer rendered outside the scroll body when needed

### 5. Web Strategy

Web should use the same component APIs but with minimal keyboard-specific behavior.

**Expected behavior**

- Shared containers render safely on web.
- No mobile-only dismissal hacks.
- No web bundle regressions from platform branching in feature code.

---

## Data Flow And Interaction Model

### Full-Screen Forms

1. Feature form renders inside `FormScreenContainer`.
2. `FormScreenContainer` uses `KeyboardAwareScrollContainer`.
3. Keyboard visibility changes only affect shared infrastructure behavior.
4. Feature form keeps only field state, submit handlers, and local validation.

### Modal Forms

1. Feature modal owns visibility and submit logic.
2. Modal shell uses `ModalFormSheet`.
3. `ModalFormSheet` manages overlay, body scroll, footer placement, and request-close behavior.
4. Feature modal provides body fields and optional footer actions.

---

## Error Handling

- Android request-close while keyboard is open should dismiss keyboard first instead of closing the modal immediately.
- Shared primitives should avoid platform-specific assumptions in feature code.
- Web should never depend on native keyboard events to remain functional.

---

## Testing Strategy

### Unit / Component Coverage

- `KeyboardAwareScrollContainer`
  - platform-specific prop behavior for iOS / Android / web
  - safe render fallback on web

- `FormScreenContainer`
  - continues to render children through the new shared container

- `ModalFormSheet`
  - body remains scrollable
  - footer slot renders correctly
  - Android request-close dismisses keyboard before close when keyboard is visible

### Flow Verification

- `LoginForm` / `SignUpForm`
  - keyboard does not prevent form progression or submit

- `CreateTodoModal` / `TagFormModal`
  - primary actions remain reachable on small mobile screens
  - keyboard dismissal does not unexpectedly close the modal

### E2E Verification

- `bun run e2e:android`
- `bun run e2e:ios`
- at minimum `bun run check:web` to ensure web-safe shared primitive integration

---

## Risks

### Risk 1: Primitive API Becomes Too Large

If keyboard avoidance, scroll rules, modal behavior, and footer rendering are bundled too tightly, migration gets harder and reuse gets worse.

**Mitigation**

- Keep a thin base primitive for keyboard-aware scrolling.
- Put modal-specific concerns in a separate primitive.

### Risk 2: Sticky Footer Becomes Mandatory Everywhere

Some forms need it, some do not.

**Mitigation**

- Footer support must be optional.
- Body scrolling should work independently from footer presence.

### Risk 3: Web Regressions From Mobile-Centric Logic

Shared mobile fixes can accidentally leak platform assumptions into web.

**Mitigation**

- Keep web behavior simple and explicit.
- Verify at least bundle health after migration.

---

## Rollout Plan

1. Build `KeyboardAwareScrollContainer`.
2. Refactor `FormScreenContainer` to use it.
3. Build `ModalFormSheet`.
4. Migrate `CreateTodoModal` and `TagFormModal`.
5. Migrate auth forms through the updated `FormScreenContainer`.
6. Add unit coverage for shared primitives.
7. Run Android and iOS E2E verification.

---

## Acceptance Criteria

- Full-screen forms use shared keyboard-aware infrastructure instead of ad hoc keyboard setup.
- Form modals keep primary actions reachable on iOS and Android.
- Android keyboard dismissal no longer closes form modals unexpectedly.
- Web remains functional with the same shared component APIs.
- Android and iOS E2E pass after migration.
