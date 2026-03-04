# Todo Tag Interactions Tasks

## Task 1: Shared tag contract

**Files**
- Modify: `shared/types/api.ts`
- Test: `apps/client/tests/data/hooks.test.ts`
- Test: `apps/client/tests/data/queryKeys.test.ts` (only if fixtures need updates)

**Steps**
1. Add `TagColorToken` union to `shared/types/api.ts`.
2. Extend `Tag` with `emoji` and `colorToken`.
3. Extend `CreateTagRequest` with `name`, `emoji`, `colorToken`.
4. Extend `UpdateTagRequest` to support full edits (`name`, `emoji`, `colorToken`).
5. Update client test fixtures that construct `Tag` objects.

**Acceptance criteria**
- Shared contract exposes a closed color-token union.
- All tag request/response types carry emoji and color metadata.
- Existing todo request types remain unchanged except fixture compatibility.

**Verification**
- `bun run test apps/client/tests/data/hooks.test.ts`

---

## Task 2: Backend tag validation and persistence

**Files**
- Modify: `backend/firebase/functions/src/modules/tags/tags.schema.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.types.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.firestore.repository.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.service.ts`
- Modify: `backend/firebase/functions/src/modules/tags/tags.controller.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.schema.unit.test.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.service.unit.test.ts`
- Test: `backend/firebase/functions/tests/modules/tags/tags.controller.unit.test.ts`
- Test: `backend/firebase/functions/tests/integration/todos.test.ts`

**Steps**
1. Update tag schemas to require `emoji` and allowlisted `colorToken`.
2. Update backend tag interfaces and repository payloads to persist both fields.
3. Refactor service create/update methods to accept object payloads instead of bare `name`.
4. Update controller wiring to pass full request bodies through.
5. Add unit tests for invalid color token, blank emoji, and full update payloads.
6. Add integration coverage for create/update tag with emoji/color metadata.
7. Re-run delete-tag cleanup integration to confirm `todo.tagIds` cleanup still works.

**Acceptance criteria**
- Backend rejects invalid or missing tag metadata.
- Created and updated tags round-trip emoji and color token correctly.
- Delete-tag cleanup behavior remains unchanged.

**Verification**
- `bun run test:backend:unit`
- `bun run test:backend`

---

## Task 3: Design-system tag tokens and reusable components

**Files**
- Modify: `apps/client/src/ui/theme/design-tokens.js`
- Modify: `apps/client/src/ui/tokens.ts`
- Modify: `apps/client/src/ui/components/AppTagBadge.tsx`
- Create: `apps/client/src/ui/components/AppTagChip.tsx`
- Modify: `apps/client/src/ui/components/index.ts`
- Test: `apps/client/tests/ui/components/AppTagBadge.test.tsx`
- Create: `apps/client/tests/ui/components/AppTagChip.test.tsx`

**Steps**
1. Add the tag palette token structures to `design-tokens.js`.
2. Expose the palette through `tokens.ts`.
3. Expand `AppTagBadge` to support `emoji`, `name`, `colorToken`, optional `active`, optional `onPress`.
4. Create `AppTagChip` for the 32px filter/selection use case.
5. Export the new component from `index.ts`.
6. Add or update component tests for passive and interactive rendering.
7. Ensure Pen screen instances and code surfaces both show metadata on actual composed rows, not only in the standalone component previews.

**Acceptance criteria**
- Code tokens match the phase 2 Pen palette.
- `AppTagBadge` supports both preview and interactive filter usage.
- `AppTagChip` exists as the dedicated filter/selection primitive.

**Verification**
- `bun run test apps/client/tests/ui/components/AppTagBadge.test.tsx`
- `bun run test apps/client/tests/ui/components/AppTagChip.test.tsx`

---

## Task 4: Todo-list badge filtering

**Files**
- Modify: `apps/client/src/features/todos/TodoItem.tsx`
- Modify: `apps/client/src/features/todos/TagFilters.tsx`
- Modify: `apps/client/src/features/todos/TodosList.tsx`
- Modify: `apps/client/src/data/hooks/useTodosQuery.ts`
- Modify: `apps/client/src/stores/useUIStore.ts` (only if helper action improves toggle semantics)
- Test: `apps/client/tests/features/todos/TodoItem.test.tsx`
- Test: `apps/client/tests/features/todos/TagFilters.test.tsx`
- Test: `apps/client/tests/features/todos/TodosList.test.tsx`
- Test: `apps/client/tests/app/app/todos.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Steps**
1. Thread `selectedTagId` / setter into `TodoItem` usage.
2. Make todo-item badges toggle the shared filter state:
   - inactive -> set tag id
   - active -> clear to `null`
3. Swap `TagFilters` to `AppTagChip` with emoji/color-aware rendering.
4. Keep `useTodosQuery` as the only filtering source.
5. Add unit tests for badge-to-filter toggle behavior.
6. Add/update e2e coverage for apply-filter then clear-filter from the same badge.
7. Add regression coverage that edited tag metadata still renders on todo-list badges.

**Acceptance criteria**
- Todo-item badges and filter row always reflect the same active tag.
- Clicking the same active todo badge returns the list to `All`.
- The UI does not introduce a second filtering state.

**Verification**
- `bun run test apps/client/tests/features/todos/TodoItem.test.tsx`
- `bun run test apps/client/tests/features/todos/TagFilters.test.tsx`
- `bun run e2e:web`

---

## Task 5: Create/Edit Todo selection-first tag UX

**Files**
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`
- Create: `apps/client/src/features/todos/CreateTagModal.tsx`
- Modify: `apps/client/src/data/hooks/useCreateTagMutation.ts`
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Test: `apps/client/tests/features/todos/CreateTodoModal.test.tsx`
- Create: `apps/client/tests/features/todos/CreateTagModal.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Steps**
1. Remove the inline add-tag row from the Create/Edit Todo implementation.
2. Add local child-modal state for quick tag creation.
3. Render existing tags as select/unselect chips only.
4. Render `New tag` when tags exist.
5. Render empty state + `Create first tag` when no tags exist.
6. Implement `CreateTagModal` with `name`, `emoji`, `colorToken`.
7. Auto-select the new tag in the parent todo modal after successful creation.
8. Add edit-mode prefill tests and selected-chip removal tests.
9. Assert the picker row visibly renders emoji + tokenized tag styling for existing and newly created tags.

**Acceptance criteria**
- In Create/Edit Todo, tag chips only control `selectedTagIds` for the current todo.
- There is no filter behavior inside the todo modal.
- Quick-create tag flow works without leaving the todo modal.
- Newly created tag is selected automatically.

**Verification**
- `bun run test apps/client/tests/features/todos/CreateTodoModal.test.tsx`
- `bun run test apps/client/tests/features/todos/CreateTagModal.test.tsx`

---

## Task 6: Manage Tags full editor

**Files**
- Modify: `apps/client/app/(app)/manage-tags.tsx`
- Create: `apps/client/src/features/todos/TagFormModal.tsx` (preferred shared form)
- Modify: `apps/client/src/data/hooks/useUpdateTagMutation.ts`
- Modify: `apps/client/src/data/hooks/useCreateTagMutation.ts`
- Modify: `apps/client/src/i18n/en.ts`
- Modify: `apps/client/src/i18n/zh-TW.ts`
- Test: `apps/client/tests/app/app/manage-tags.test.tsx`
- Create: `apps/client/tests/features/todos/TagFormModal.test.tsx`
- Test: `e2e-web/tests/todo-tags.spec.ts`

**Steps**
1. Replace inline rename-only UI with modal-based full editing.
2. Add top-level `New tag` CTA to Manage Tags.
3. Use a shared `TagFormModal` for create/edit if the implementation stays symmetrical.
4. Make edit submit full payload: `name`, `emoji`, `colorToken`.
5. Keep delete confirmation and delete mutation behavior.
6. Update tests to assert `Edit` opens full form and persists full payload.
7. Verify edited tag metadata propagates back to Create Todo chips and todo-list badges.

**Acceptance criteria**
- Manage Tags can create and edit the full tag identity, not just rename.
- Manage row previews match emoji/color-aware badge rendering.
- Delete still works with confirmation.

**Verification**
- `bun run test apps/client/tests/app/app/manage-tags.test.tsx`

---

## Task 7: Pen, docs, and final verification

**Files**
- Modify: `pencil/app/app-core-screens.pen`
- Modify: `docs/design-system/pen-code-component-mapping.md`
- Modify: `docs/design-system/color-scheme.md`
- Modify: `docs/plans/2026-03-04-todo-tag-interactions/status.md`

**Steps**
1. Keep code and Pen aligned as implementation details settle.
2. Update mapping/docs for any component or token changes that differ from the phase 2 prototype, including surface-level display rules.
3. Run the full repo-required verification set.
4. Update `status.md` to phase 5 done only after fresh verification succeeds.

**Acceptance criteria**
- Pen and code stay synchronized for the implemented UI.
- Required docs reflect the shipped design system.
- Final completion claim is backed by fresh verification output.

**Verification**
- `bun run check:client:ui`
- `bun run check:pw:console`
- `bun run check:expo`
- `bun run test`
- `bun run test:backend:unit`
- `bun run check:web`
- `bun run test:backend`
- `bun run e2e:web`
- `bun run ci`
