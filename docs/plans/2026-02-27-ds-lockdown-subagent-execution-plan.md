# DS Lockdown (Components + Variables Only) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce that product pages are affected only through shared DS reusable components and variables, with remaining screen-level ad-hoc UI extracted to reusable components and consumed via `ref`.

**Architecture:** Keep `.pen` as the design source of truth and enforce DS-first workflow: update shared variables and reusable components in DS area, then consume via `ref` in product screens. Existing plans are merged by reusing completed foundation work and focusing only on remaining gaps (non-componentized screen UI blocks).

**Tech Stack:** Pencil `.pen` MCP workflow, reusable `ref` components, variables/theming, Bun verification scripts (`check:client:ui`, `check:web`, `test`).

---

## Integrated Context (Merged Existing Plans)

- Base plans integrated:
  - `docs/plans/2026-02-27-design-system-foundation-implementation.md`
  - `pencil/app/2026-02-27-design-system-foundation-design.md`
- Already done:
  - DS/spec boards created and grouped as `spec/*`
  - Product screens partially migrated to reusable refs
  - Shared component library exists (`component/Field`, `component/PrimaryButton`, etc.)
- Remaining gaps:
  - Some product-screen blocks are still direct frames/text (status bar/title/section labels and a few structural rows)
  - Need stronger process lock evidence: product page changes must route through DS Components + variables

## Definition of Done

1. Product-screen repeatable UI blocks are reusable components in DS area.
2. Product screens consume these blocks via `ref` rather than duplicating raw nodes.
3. `docTitle` explicitly states lock policy and page classification (already present, retain/update if needed).
4. No unresolved DS gap remains unreported.
5. Verification evidence recorded (layout/screenshot + repo checks where applicable).

---

### Task 1: Gap Audit and DS Target List

**Files:**
- Inspect: `pencil/app/app-core-screens.pen`
- Update doc: `docs/plans/2026-02-27-ds-lockdown-subagent-execution-plan.md`

**Step 1: Enumerate remaining non-componentized product-page blocks**
- Identify repeatable candidates (e.g., `StatusBar`, `PageTitle`, `SectionLabel`, common header rows).

**Step 2: Confirm existing reusable components to avoid duplication**
- Reuse existing component ids if structurally equivalent.

**Step 3: Record DS target list (create vs reuse)**
- Explicitly map each screen block to `reuse existing` or `create new reusable`.

---

### Task 2: Add Missing Reusable Components in DS Area

**Files:**
- Modify: `pencil/app/app-core-screens.pen`

**Step 1: Set placeholder on DS component area before editing**
- Use placeholder lifecycle rules while editing DS area.

**Step 2: Create reusable components for missing shared blocks**
- Expected likely additions (if not already equivalent):
  - `component/StatusBar`
  - `component/PageTitle`
  - `component/SectionLabel`
  - `component/TopBarAction` (only if reuse value is real)

**Step 3: Ensure values come from variables where applicable**
- Text/fill/stroke/spacing should use shared variables where present.

**Step 4: Remove placeholder from DS area when done**

---

### Task 3: Migrate Product Screens to New/Existing Refs

**Files:**
- Modify: `pencil/app/app-core-screens.pen`

**Step 1: Set placeholder on each target product screen**
- Screens: `Login`, `Sign Up`, `Todos`, `Create Todo Modal`.

**Step 2: Replace duplicated screen-level blocks with refs**
- Replace direct text/frame duplicates with component refs and descendant overrides only for content.

**Step 3: Keep layout semantics stable**
- Preserve frame sizing and spacing behavior; only componentization should change.

**Step 4: Remove placeholders per-screen after completion**

---

### Task 4: Lock Policy and Documentation Alignment

**Files:**
- Modify if needed: `pencil/app/app-core-screens.pen` (`docTitle`)
- Confirm: `AGENTS.md`

**Step 1: Keep lock policy text visible in `docTitle`**
- Ensure statement remains explicit: only DS Components + variables affect product pages.

**Step 2: Ensure naming convention and page zoning are clear**
- `spec/*` area remains separate from product pages.

---

### Task 5: Verification and Report

**Files:**
- Verify: `pencil/app/app-core-screens.pen`

**Step 1: Visual verification**
- Capture screenshots for DS area and each product screen.

**Step 2: Structural verification**
- Confirm product screens use refs for targeted shared blocks.

**Step 3: Repo checks (where relevant)**
Run:
- `bun run check:client:ui`
- `bun run test`
- `bun run check:web`

**Step 4: Report residual gaps**
- If any block intentionally remains non-component, document reason and migration trigger.

---

## Execution Mode (Subagent-Style in this session)

- Controller executes tasks sequentially with review checkpoints:
  1. Spec compliance check (requirements met, no overbuild)
  2. Code/design quality check (consistency and maintainability)
- If a gap is found in either checkpoint, fix and re-verify before moving on.

## Execution Update (2026-02-27, Round 2)

### Completed in this round
- Added reusable components in DS Components area:
  - `component/StatusBar` (`l5b7W`)
  - `component/ScreenTitle` (`T5cMs`)
  - `component/SectionLabel` (`Z7k3d`)
  - `component/SheetHandle` (`McPgO`)
- Migrated all four product pages to consume the above via `ref` + descendant overrides.
- Re-verified screenshots and structure after migration.

### Residual items audit
- Remaining non-`ref` blocks in product pages are layout skeleton containers only:
  - `wrapper`/`wrap2`
  - `header3`
  - `filters`/`listWrap`
  - `modalWrap`/`btnRow`
- Decision: keep as screen composition containers (intentional), not reusable DS components.

### Current DS-lock compliance status
- Product-page repeatable visual primitives are componentized and consumed via `ref`.
- Lock policy text remains in `docTitle`.
- No unreported reusable-component gap remains for current screens.
