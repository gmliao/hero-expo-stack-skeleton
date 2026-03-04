# UI Styling Governance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a canonical three-layer UI styling governance model and wire it into the design-system workflow and client architecture rules.

**Architecture:** The governance model will live in one new canonical design-system document, then existing workflow and client architecture docs will be updated to reference and enforce that same model. The plan keeps definition, execution procedure, and enforcement wording separated so future lint, CI, and agent rules can cite a single source of truth instead of duplicating policy text.

**Tech Stack:** Markdown docs, existing design-system documentation structure, AGENTS workflow rules, NativeWind / Expo client architecture conventions.

---

### Task 1: Create the canonical styling governance spec

**Files:**
- Create: `docs/design-system/styling-governance.md`
- Reference: `docs/design-system/workflow.md`
- Reference: `docs/architecture/client.md`

**Step 1: Write the new canonical spec**

Document:

- purpose and scope of the three-layer model
- Layer 1 / 2 / 3 definitions
- allowed / forbidden examples
- decision tree
- primitive delivery requirements
- machine-checkable heuristics for future lint / CI

**Step 2: Verify document structure**

Check that the new spec:

- does not restate the whole workflow
- does not restate all client architecture rules
- clearly declares itself the canonical styling policy

**Step 3: Self-review for enforceability**

Confirm the wording uses rule language (`must`, `must not`, `allowed by exception`) and that examples map cleanly to existing code patterns such as `AppHorizontalScrollArea`.

### Task 2: Update the design-system workflow to use the model

**Files:**
- Modify: `docs/design-system/workflow.md`
- Reference: `docs/design-system/styling-governance.md`

**Step 1: Add the new doc to workflow references**

Update the related-docs section so the workflow points readers to the canonical styling governance spec.

**Step 2: Add a styling decision procedure section**

Add a concise section that requires UI work to:

- classify styling needs through Layer 1 -> Layer 2 -> Layer 3
- create a primitive when runtime rendering needs cannot be expressed through token + utility
- extend the token system when the need is visual language rather than rendering behavior

**Step 3: Verify workflow scope stays focused**

Ensure the workflow text remains procedural and only links back to the canonical spec for the full policy details.

### Task 3: Tighten client architecture enforcement wording

**Files:**
- Modify: `docs/architecture/client.md`
- Reference: `docs/design-system/styling-governance.md`

**Step 1: Replace the coarse styling rules with layered enforcement**

Update the styling section so it says:

- route / feature should consume shared UI from `@/ui/components`
- visual styling must come from tokens + utilities
- inline style / `StyleSheet` are only allowed for layout interop or rendering primitives
- primitive exceptions belong in `src/ui/primitives/**` or a clearly documented shared primitive surface

**Step 2: Add explicit prohibited patterns**

Call out examples such as:

- visual inline style literals in route / feature files
- arbitrary Tailwind values used as token substitutes
- primitive components carrying token-owned properties like color, padding, radius, shadow

**Step 3: Verify compatibility with current repo structure**

Make sure the wording matches the repo’s existing `src/ui/` conventions and does not require a directory migration in the same change.

### Task 4: Cross-check references and remove policy drift

**Files:**
- Modify: `docs/design-system/workflow.md`
- Modify: `docs/architecture/client.md`
- Create/Modify: `docs/design-system/styling-governance.md`

**Step 1: Cross-link the three documents**

Ensure each document points to the others in the correct role:

- governance spec as source of truth
- workflow as execution rule
- client architecture as enforcement rule

**Step 2: Remove duplicated policy text where possible**

Keep definitions in the new governance file; keep summaries in workflow and architecture docs.

**Step 3: Run doc sanity review**

Read the final three docs together and verify there is no contradiction about:

- when inline style is allowed
- what counts as a primitive
- what must come from tokens

### Task 5: Update feature status and record handoff

**Files:**
- Modify: `docs/plans/2026-03-04-ui-styling-governance/status.md`

**Step 1: Mark phase 3/4 output**

Record that the implementation plan is ready and phase 5 execution has not started yet.

**Step 2: Summarize the execution handoff**

Reference:

- `scope.md`
- `implementation-plan.md`

and note that phase 2 is N/A because the work is governance documentation rather than Pen UI.

## Verification

Before claiming phase 5 complete:

- read the final text of all three docs together
- confirm the new rules are internally consistent
- confirm no existing document now points at an outdated styling source of truth
- if any repo check is not run because the change is docs-only, state that explicitly in the completion note
