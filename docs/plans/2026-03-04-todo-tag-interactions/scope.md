# Feature: Todo Tag Interactions — Scope

**Feature slug:** todo-tag-interactions  
**Started:** 2026-03-04

---

## 1. Goal

Refine the todo tag experience so tag meaning and interaction are explicit:

- todo list tag badges become an alternate entry point for tag filtering
- create/edit todo focuses on selecting existing tags, not mixing selection and management
- quick tag creation stays available inside the todo flow
- tag visual identity is upgraded with constrained emoji + color tokens in the design system

This is a UX and design-system refinement of the existing tags feature, not a new resource domain.

---

## 2. Approved Interaction Decisions

### Todo list badge interaction

- Todo item badges are no longer display-only.
- Tapping a badge sets the same `selectedTagId` used by the tag filter row.
- The tag filter row and todo list stay fully synchronized.
- If the tapped badge is already active, tapping it again clears the filter and returns to `All`.

### Tag selection inside Create/Edit Todo

- The main todo modal is for selecting existing tags.
- When tags exist, the modal shows selectable tag chips and a `New tag` action.
- When the user has no tags, the modal shows an empty state with `Create first tag`.
- Selecting/unselecting tags still writes back through `tagIds`.

### Tag creation flow

- Creating a new tag stays available from inside the todo modal as a lightweight child modal.
- Creating a tag should not force the user to leave the todo flow or navigate to Options first.
- On success, the new tag is added to cache/list and auto-selected for the current todo.

### Tag management flow

- `Manage Tags` remains the place for rename, delete, and later visual adjustments.
- Editing tags does not move into the todo modal.
- The existing edit-todo route stays modal-based for now; it does not expand into a standalone screen in this feature.

---

## 3. Visual / DS Direction

### Tag identity

- Each tag gets:
  - `name`
  - `emoji`
  - `colorToken`
- `colorToken` must come from a limited DS allowlist, not arbitrary user-picked colors.

### DS constraints

- Add a small semantic tag palette such as `tagBlue`, `tagGreen`, `tagAmber`, `tagRose` and similar approved tokens.
- Emoji is intentional tag metadata, not a generic UI icon system.
- Badge, filter chip, picker chip, and manage-tags rows must all render from the same tag identity rules.

### Planned visual behavior

- Todo list badges show emoji + label and present an interactive affordance.
- Active tag state is visually distinct and consistent between:
  - todo list badges
  - top tag filter row
  - create/edit modal selection chips
- `All` remains a non-tag reset state and must still be visually clear.

---

## 4. Data / Contract Impact

Current `Tag` only stores `id`, `name`, `uid`, `createdAt`, and `updatedAt`. This feature is expected to extend the contract with tag presentation metadata:

- `emoji: string`
- `colorToken: TagColorToken`

Likely affected request/response types:

- `Tag`
- `CreateTagRequest`
- `UpdateTagRequest`

No change is required to `Todo.tagIds` semantics beyond improved UX around selecting and clearing tags.

---

## 5. Screen / Flow Impact

### Todos screen

- Todo item tag badges become interactive filters.
- Top tag filter row must mirror the same selected state and clear behavior.

### Create/Edit Todo modal

- Simplify primary content to tag selection.
- Add quick-create-tag child modal.
- Empty state changes when no tags exist.

### Manage Tags screen

- Continues to own edit/delete operations.
- Will likely gain emoji/color editing controls because visual identity belongs with tag management.

---

## 6. Boundaries

In scope:

- badge-to-filter interaction
- active-badge toggle-off behavior
- quick create-tag modal inside todo flow
- DS updates for tag emoji/color token usage
- manage-tags updates needed for editing tag visuals
- tests covering new interaction and create/select flows

Out of scope:

- moving edit todo from modal to full screen
- arbitrary custom colors
- direct untag action from todo list
- introducing a separate Firestore access path or changing API-first architecture

---

## 7. Success Criteria

- A todo badge tap applies the corresponding tag filter.
- Tapping the same active badge again clears filtering back to `All`.
- The top tag filter row always reflects the same selected tag state.
- Create/Edit Todo can select existing tags without mixing management controls into the main flow.
- Users with zero tags can create the first tag from the todo flow without losing context.
- Newly created tags are auto-selected for the in-progress todo.
- Tag visuals are consistent across list, filter, picker, and management surfaces.

---

## 8. Risks / Trade-offs

- Adding emoji/color metadata expands the shared API contract and backend validation scope.
- Making badges interactive requires clearer pressed/active styling so they no longer look like passive text pills.
- A child modal inside an existing modal needs careful web/mobile behavior verification.
- Restricting colors to DS tokens keeps the system coherent, but requires explicit token naming and mapping in Pen and code.

---

## 9. Phase 2 Handoff

Phase 2 should confirm the Pen design for:

- interactive todo tag badge states
- tag filter row synchronization and active visuals
- create-tag child modal from inside create/edit todo
- empty-state treatment for zero tags
- manage-tags controls for emoji/color token editing
- DS token additions and Pen ↔ code mapping updates for tag visuals
