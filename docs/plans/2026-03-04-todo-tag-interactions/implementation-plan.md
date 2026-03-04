# Todo Tag Interactions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade todo tag UX so todo-list badges drive filtering, create/edit todo uses tag selection only, quick tag creation happens in a child modal, and tags gain DS-controlled emoji/color identity.

**Architecture:** Keep the existing API-first shape. Extend the shared `Tag` contract with visual metadata (`emoji`, `colorToken`), validate that metadata in backend schemas/services, and expose it through the existing tags endpoints. On the client, split tag UI into two explicit primitives: interactive filter/selection chips and compact badges, then wire the two interaction modes to different state paths: todo-list badges update `selectedTagId`, while create/edit modal chips update local `selectedTagIds`.

**DS lock:** Reusable primitives alone are not sufficient. All screen-level tag surfaces must actually render `emoji + label + colorToken`:
- todo list badge rows
- create/edit todo picker row
- tag filter row
- manage-tags preview rows
- tag form preview

**Tech Stack:** Expo / React Native, NativeWind, TanStack Query, Zustand, i18next, Firebase Functions HTTP API, Firestore, Pencil `.pen` design source.

---

## Scope Lock

These behaviors are fixed by phase 1/2 and must not drift during implementation:

- Todo-list badges are a filter entry point.
- Tapping an already-active todo-list badge clears back to `All`.
- Create/Edit Todo modal tag chips are only for selecting/unselecting tags for that todo.
- `New tag` in Create/Edit Todo opens a lightweight child modal.
- `Manage Tags` is the full editor for name / emoji / color token / delete.
- Tag colors come only from the DS token allowlist.

---

## Task 1: Extend shared tag contract for emoji and color tokens

**Files:**
- Modify: `shared/types/api.ts`
- Test: `apps/client/tests/data/queryKeys.test.ts` (if query key shape or tag fixtures need updates)
- Test: `apps/client/tests/data/hooks.test.ts`

**Plan:**
- Add `TagColorToken` as a literal union, derived from the approved DS palette:
  - `tagTeal`
  - `tagBlue`
  - `tagGreen`
  - `tagAmber`
  - `tagRose`
- Extend `Tag` with:
  - `emoji: string`
  - `colorToken: TagColorToken`
- Extend `CreateTagRequest` with:
  - `name: string`
  - `emoji: string`
  - `colorToken: TagColorToken`
- Extend `UpdateTagRequest` with the same fields so Manage Tags can perform full edits instead of rename-only updates.
- Keep `Todo.tagIds` and todo request shapes unchanged except for fixtures that need the richer `Tag`.

**Verification target for later execution:**
- `bun run test apps/client/tests/data/hooks.test.ts`

---

## Task 2: Update backend tag schemas, types, repository, and service flow

**Files:**
- Modify: `backend/firebase/functions/src/modules/tags/tags.schema.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.types.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.firestore.repository.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.service.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.controller.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.schema.unit.test.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.service.unit.test.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.controller.unit.test.ts`
- Test: `backend/firebase/functions/tests/integration/todos.test.ts`

**Plan:**
- Add backend-side `TagColorToken` alignment through shared types, not duplicate enums.
- Extend Zod schemas so create/update require:
  - non-empty `name`
  - non-empty `emoji`
  - `colorToken` in the allowlist
- Update repository create/update payloads to persist `emoji` and `colorToken`.
- Update service signatures from `(uid, name)` and `(tagId, uid, name)` to payload-based methods.
- Preserve delete semantics: deleting a tag still removes that tag id from all affected todos.
- Keep auth and ownership rules unchanged.

**New backend cases that must exist:**
- happy path create tag with `emoji` and `colorToken`
- happy path full update tag with `name`, `emoji`, `colorToken`
- invalid `colorToken` rejected
- blank `emoji` rejected
- delete still cleans `todo.tagIds`

**Verification target for later execution:**
- `bun run test:backend:unit`
- `bun run test:backend`

---

## Task 3: Add DS tag palette tokens and reusable tag primitives

**Files:**
- Modify: `apps/client/src/ui/theme/design-tokens.js`
- Modify: `apps/client/src/ui/tokens.ts`
- Modify: `apps/client/src/ui/components/AppTagBadge.tsx`
- Create: `apps/client/src/ui/components/AppTagChip.tsx`
- Modify: `apps/client/src/ui/components/index.ts`
- Test: `apps/client/tests/ui/components/AppTagBadge.test.tsx`
- Create: `apps/client/tests/ui/components/AppTagChip.test.tsx`
- Modify: `docs/design-system/color-scheme.md`
- Modify: `docs/design-system/pen-code-component-mapping.md`

**Plan:**
- Add the approved DS palette to code tokens, mirroring phase 2 Pen variables:
  - `tagTeal`
  - `tagBlue`
  - `tagGreen`
  - `tagAmber`
  - `tagRose`
- Expose each token as structured colors suitable for badge/chip rendering:
  - background
  - text
  - border
- Update `AppTagBadge` so it can render:
  - `emoji`
  - `name`
  - `colorToken`
  - optional `active`
  - optional `onPress`
- Keep `AppTagBadge` usable in both passive preview mode and interactive filter mode.
- Create `AppTagChip` specifically for 32px filter/selection usage.
- Ensure accessibility labels combine emoji semantics and text meaning without relying on locale-specific `testID`s.
- Keep Pen screen instances aligned with the reusable primitives so the actual composed surfaces demonstrate metadata display, not only the base components.

**Verification target for later execution:**
- `bun run test apps/client/tests/ui/components/AppTagBadge.test.tsx`
- `bun run test apps/client/tests/ui/components/AppTagChip.test.tsx`

---

## Task 4: Wire todo-list badge filtering and top-row synchronization

**Files:**
- Modify: `apps/client/src/features/todos/TodoItem.tsx`
- Modify: `apps/client/src/features/todos/TagFilters.tsx`
- Modify: `apps/client/src/features/todos/TodosList.tsx`
- Modify: `apps/client/src/features/todos/TodosScreenHeader.tsx` (only if prop plumbing changes)
- Modify: `apps/client/src/features/todos/FilterTabs.tsx` (only if shared chip usage changes)
- Modify: `apps/client/src/data/hooks/useTodosQuery.ts`
- Modify: `apps/client/src/stores/useUIStore.ts` (only if helper action improves toggle behavior)
- Test: `apps/client/tests/features/todos/TodoItem.test.tsx`
- Test: `apps/client/tests/features/todos/TagFilters.test.tsx`
- Test: `apps/client/tests/features/todos/TodosList.test.tsx`
- Test: `apps/client/tests/app/app/todos.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Plan:**
- Pass the active tag id and setter down to `TodoItem` so each badge can toggle the same global filter state used by `TagFilters`.
- Encode the exact behavior:
  - inactive badge press -> `setSelectedTagId(tag.id)`
  - active badge press -> `setSelectedTagId(null)`
- Update `TagFilters` to use the new `AppTagChip` rendering with emoji/color token instead of raw `Pressable`.
- Keep `useTodosQuery` logic as the single filtering source; UI elements should only mutate `selectedTagId`.
- Make sure a selected tag is visually active both in the filter row and inside matching todo badges.
- Add regression coverage that edited tag metadata still renders on the todo-list badge surface.

**Must-have tests:**
- unit: pressing a todo badge calls the filter setter with that tag id
- unit: pressing an already-active todo badge clears back to `null`
- unit: filter row still shows matching active state
- e2e: click todo badge -> list filters -> click same badge again -> list resets

**Verification target for later execution:**
- `bun run test apps/client/tests/features/todos/TodoItem.test.tsx`
- `bun run test apps/client/tests/features/todos/TagFilters.test.tsx`
- `bun run e2e:web`

---

## Task 5: Refactor Create/Edit Todo into selection-first tag UX

**Files:**
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`
- Create: `apps/client/src/features/todos/CreateTagModal.tsx`
- Modify: `apps/client/src/data/hooks/useCreateTagMutation.ts`
- Modify: `apps/client/src/data/hooks/useUpdateTodoMutation.ts` (if invalidation scope needs widening)
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Test: `apps/client/tests/features/todos/CreateTodoModal.test.tsx`
- Create: `apps/client/tests/features/todos/CreateTagModal.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Plan:**
- Remove the current inline add-tag flow from `CreateTodoModal`.
- Replace it with two mutually exclusive subflows:
  - existing tags -> show `New tag` action + selection chips
  - zero tags -> show empty state + `Create first tag`
- Keep local modal state clear:
  - `selectedTagIds`
  - `isCreateTagModalOpen`
  - child modal form state belongs inside `CreateTagModal`
- Implement `CreateTagModal` as a child modal that captures:
  - `name`
  - `emoji`
  - `colorToken`
- On create success:
  - invalidate or update tags query
  - auto-select the new tag in the parent todo modal
  - close child modal
- The create/edit picker row must render the created/edited tag with its selected emoji and tokenized color, not just the label.
- Preserve edit-mode prefill coverage:
  - existing selected tags must render selected when editing a todo
  - clicking a selected chip removes it from `selectedTagIds`

**Must-have tests:**
- edit modal pre-fills selected tags with emoji/color-aware fixtures
- create modal with zero tags shows `Create first tag`
- create modal with existing tags shows `New tag` and no inline text field
- creating a tag from child modal auto-selects it
- clicking a selected chip in create/edit modal removes it from `selectedTagIds`

**Verification target for later execution:**
- `bun run test apps/client/tests/features/todos/CreateTodoModal.test.tsx`
- `bun run test apps/client/tests/features/todos/CreateTagModal.test.tsx`

---

## Task 6: Upgrade Manage Tags into full tag editor

**Files:**
- Modify: `apps/client/app/(app)/manage-tags.tsx`
- Create: `apps/client/src/features/todos/EditTagModal.tsx` (or shared `TagFormModal.tsx` if reuse is cleaner)
- Modify: `apps/client/src/data/hooks/useUpdateTagMutation.ts`
- Modify: `apps/client/src/data/hooks/useCreateTagMutation.ts`
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Test: `apps/client/tests/app/app/manage-tags.test.tsx`
- Create: `apps/client/tests/features/todos/EditTagModal.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Plan:**
- Replace rename-only inline editing with a proper tag edit modal or shared tag form.
- Each tag row should show:
  - preview badge
  - `Edit`
  - `Delete`
- Editing a tag must propagate the updated visual identity back to downstream surfaces (`CreateTodoModal`, todo list badges, filter row).
- Add top-level `New tag` CTA to Manage Tags as the non-todo-flow entry point.
- `Edit` modal must allow updating all tag identity fields:
  - `name`
  - `emoji`
  - `colorToken`
- Keep delete confirmation flow intact.

**Must-have tests:**
- manage screen renders preview with emoji + color-aware tag fixtures
- `Edit` opens full form, not rename inline input
- saving full edit sends all fields to `updateTagMutation`
- `New tag` opens creation flow from manage screen

**Verification target for later execution:**
- `bun run test apps/client/tests/app/app/manage-tags.test.tsx`

---

## Task 7: Keep Pen, docs, and verification in sync

**Files:**
- Modify: `pencil/app/app-core-screens.pen`
- Modify: `docs/plans/2026-03-04-todo-tag-interactions/status.md`
- Modify: `docs/design-system/pen-code-component-mapping.md`
- Modify: `docs/design-system/color-scheme.md`
- Test: `apps/client/tests/**`
- Test: `backend/firebase/functions/tests/**`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Plan:**
- Preserve the phase 2 Pen updates during code implementation.
- If DS display rules were only captured at reusable-component level, backfill the composed screen surfaces in Pen and docs before calling the feature complete.
- If code requires small deviations from the current Pen prototype, update `.pen` and mapping docs in the same task batch.
- Re-run the repo-required verification set before claiming phase 5 completion:
  - `bun run check:client:ui`
  - `bun run check:pw:console`
  - `bun run check:expo`
  - `bun run test`
  - `bun run test:backend:unit`
  - `bun run check:web`
  - `bun run test:backend`
  - `bun run e2e:web`
  - `bun run ci`

---

## Recommended Execution Order

1. Shared contract + backend validation
2. DS tokens + reusable tag components
3. Todo-list badge filtering
4. Create/Edit Todo refactor + quick-create child modal
5. Manage Tags full editor
6. Docs / Pen / full verification

---

## Open Constraints For Phase 4

- Prefer a shared `TagFormModal` if `CreateTagModal` and `EditTagModal` differ only by title/default values.
- Do not reintroduce freeform color input; `colorToken` must remain a closed union.
- Keep route-level files thin; new modal logic should live under `apps/client/src/features/todos/`.
