---
module: Todos / CreateTodoModal
date: 2025-03-07
problem_type: ui_bug
component: frontend
symptoms:
  - "On mobile, when focusing text input in CreateTodoModal or TagFormModal, keyboard covers the description/due-date inputs"
  - "User cannot see what they are typing when editing lower fields in center-placed modal"
root_cause: incomplete_implementation
resolution_type: code_fix
severity: high
tags: [react-native, expo, keyboard-avoidance, modal, mobile-ui]
---

# Mobile Modal Keyboard Covers Input

## Problem Summary

Center-placed form modals (`CreateTodoModal`, `TagFormModal`) on mobile do not avoid the software keyboard. When the user focuses the description or due-date input, the keyboard covers the active field and content below.

## Root Cause Analysis

**Architectural gap in `ModalFormSheet`:**

`ModalFormSheet` has two placement modes with **different body implementations**:

| Placement | Body Component | Keyboard Avoidance |
|-----------|----------------|-------------------|
| `bottom` | `KeyboardAwareScrollContainer` | ✅ Yes |
| `center` | `ScrollView` only | ❌ No |

Both `CreateTodoModal` and `TagFormModal` use `placement="center"` for all breakpoints (including mobile). The center path uses a plain `ScrollView` without `KeyboardAvoidingView`, so keyboard avoidance is never applied.

```tsx
// ModalFormSheet.tsx (lines 51-64) - current center path
const body =
  placement === 'center' ? (
    <ScrollView
      className="bg-bg"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <View className="pb-2">{children}</View>
    </ScrollView>
  ) : (
    <KeyboardAwareScrollContainer className="flex-1" contentClassName="pb-2">
      ...
    </KeyboardAwareScrollContainer>
  )
```

**Why this is an architectural issue:**

- The fix belongs in the **shared** `ModalFormSheet` component, not in each modal that uses it.
- Per-feature fixes (e.g. swapping `placement` only in CreateTodoModal) would be band-aids; `TagFormModal` and future center modals would still have the bug.
- The gap exists because center placement was implemented without keyboard handling, while bottom placement correctly uses `KeyboardAwareScrollContainer`.

## Does the Current Branch Fundamentally Solve the Architecture Problem?

**Status: Depends on implementation.**

- **If the fix is only in CreateTodoModal/TagFormModal** (e.g. switching to `placement="bottom"` on mobile): ❌ **Band-aid** — does not solve the architecture. Future center modals would still lack keyboard avoidance.
- **If the fix is in `ModalFormSheet`** (center path uses `KeyboardAwareScrollContainer`): ✅ **Architectural fix** — all center modals gain keyboard avoidance automatically.

**Recommended architectural fix:**

Unify the center placement body to use `KeyboardAwareScrollContainer`, so both placements get keyboard avoidance:

```tsx
// ModalFormSheet.tsx - unified body (architectural fix)
const body =
  placement === 'center' ? (
    <KeyboardAwareScrollContainer
      className="flex-1 max-h-[80%]"
      contentClassName="pb-2"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View className="flex-1">{children}</View>
    </KeyboardAwareScrollContainer>
  ) : (
    <KeyboardAwareScrollContainer className="flex-1" contentClassName="pb-2">
      <View className="flex-1">{children}</View>
    </KeyboardAwareScrollContainer>
  )
```

`KeyboardAwareScrollContainer` already uses `KeyboardAvoidingView` on iOS and relies on native resize behavior on Android (`adjustResize` / `softwareKeyboardLayoutMode`), so this works for both platforms.

## Working Solution (Architectural Approach)

**File:** `apps/client/src/ui/components/ModalFormSheet.tsx`

1. Replace the center placement `ScrollView` body with `KeyboardAwareScrollContainer`.
2. Optionally add `keyboardVerticalOffset` for center modals if header/overlay height causes offset (e.g. 40–80px on iOS).

**Existing infrastructure used:**

- `KeyboardAwareScrollContainer` — already in `@/ui/components`
- iOS: `KeyboardAvoidingView` with `behavior="padding"`
- Android: `softwareKeyboardLayoutMode: "resize"` in `app.json`, `windowSoftInputMode="adjustResize"` in `AndroidManifest.xml`

## Prevention

1. **Parity rule:** Any modal that can contain form inputs should use a body that supports keyboard avoidance, regardless of placement.
2. **Shared component responsibility:** Keyboard avoidance for modals should live in `ModalFormSheet`, not in each feature modal.
3. **Testing:** Add Maestro or manual test: open CreateTodoModal on mobile → focus description → assert description remains visible above keyboard.

## Related

- `KeyboardAwareScrollContainer` — `apps/client/src/ui/components/KeyboardAwareScrollContainer.tsx`
- `FormScreenContainer` — uses same pattern for full-screen forms (Login, SignUp)
- `ModalFormSheet` — `apps/client/src/ui/components/ModalFormSheet.tsx`
