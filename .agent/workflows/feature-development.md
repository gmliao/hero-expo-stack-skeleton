# Feature Development Workflow

> **Workflow files live in:** `.agent/workflows/`  
> This file is the overview for feature development: phase order, outputs, handoff, and document storage.

Feature development must follow the five phases below in order. Do not skip; complete each phase before moving to the next, except when a phase is explicitly marked `N/A` by this workflow.

---

## Skill Enforcement

For phases 1, 3, 4, and 5, the corresponding Superpowers skill workflow is mandatory.

Agents must invoke and follow the relevant skill workflow before doing any work in that phase. These skills are not optional guidance, reference material, or a later checklist; they define the required execution procedure for the phase.

- Phase 1 must use `brainstorming`.
- Phases 3 and 4 must use `writing-plans`.
- Phase 5 must use `executing-plans`.
- If phase 5 changes behavior or production code, it must also follow `test-driven-development`.
- Before any completion claim in phase 5, it must follow `verification-before-completion`.
- If the implementation plan contains multiple independent tasks, phase 5 must also use `subagent-driven-development`.
- Before marking phase 5 as done, it must run a final whole-feature code review using the repo's Codex CLI review flow and record the result in the phase artifacts.

Do not execute these phases freeform outside the corresponding skill workflow.

When `brainstorming` is used inside this feature workflow, it is limited to phase 1 scope clarification and handoff. The next phase is determined by this workflow, not by the generic post-brainstorm default in the skill. For UI work, the next phase is phase 2 (Design System workflow). For backend-only work, phase 2 may be marked `N/A` and the workflow may continue to phase 3.

If a generic Superpowers skill conflicts with repo-local rules in `AGENTS.md` or this workflow, the repo-local rule takes precedence and the agent must state the deviation explicitly.

---

## Required Before Phase 1

Before starting phase 1, create or switch to a dedicated git branch for the feature.

Each feature must be developed on its own branch from the beginning of the workflow, including scope docs, Pen updates, implementation plans, code changes, and tests.

Branch-per-feature is required. Worktree-per-feature is not required; by default, use the current repo and create a new branch there unless the user explicitly requests worktree isolation.

---

## Default Approval Model

By default, the agent must stop after each phase, update `status.md`, summarize the output, and wait for user approval before moving to the next phase.

Autonomous continuation is allowed only when the user explicitly requests it.

Even in autonomous mode, phase 1 requirement clarification is still mandatory. The agent must not continue into later phases until the feature scope, constraints, and success criteria have been clarified and approved. For UI work, phase 2 design confirmation is also required before implementation planning or code execution.

If unresolved questions remain about scope, architecture, UX, or verification expectations, the agent must stop and ask instead of guessing.

## How to invoke / use this workflow

**In Cursor:** Run the **Feature Development** command (Command Palette → “Feature Development”). The command loads this workflow and prompts you for the feature name or “continue”; the agent will then follow the phases below.

**In Cursor (or any agent chat):**

1. **Start a new feature**  
   - Mention this workflow and the feature name, and ask to begin at phase 1.  
   - Example: *“Follow the feature development workflow for feature `auth-sns`. Start at phase 1.”*  
   - Or: **@.agent/workflows/feature-development.md** and *“We’re starting a new feature: auth-sns. Do phase 1.”*

2. **Run a specific phase**  
   - **Phase 1:** *“Run brainstorm for feature X”* or **@.agent/workflows/brainstorm.md**  
   - **Phase 2:** *“Do UI/UX design for feature X (Design System workflow)”* or **@docs/design-system/workflow.md**  
   - **Phase 3–4:** *“Write implementation plan for feature X”* or **@.agent/workflows/write-plan.md**  
   - **Phase 5:** *“Execute the plan for feature X”* or **@.agent/workflows/execute-plan.md**

3. **Continue from where you left off**  
   - Open the feature folder: `docs/plans/YYYY-MM-DD-<feature-slug>/`  
   - Read **`status.md`** for **Current phase** and the last **Handoff log** row.  
   - Then say: *“Feature X is at phase 3. Run the next phase.”* or *“Continue feature X from phase 3.”*

4. **One-shot “follow the workflow”**  
   - *“Use the feature development workflow for &lt;feature-slug&gt;. Create the folder, then do phase 1.”*  
   - After each phase, the agent should update `status.md` (current phase + handoff row) and then you can say *“Do the next phase.”*

**Summary:** Create the feature folder → run phases in order (1 → 2 → 3 → 4 → 5) by naming the phase or @-mentioning the phase workflow file; use **`status.md`** in the feature folder to see and record current phase and handoff.

---

## Document Storage

All phase outputs for a **feature or epic** live under one folder:

```
docs/plans/YYYY-MM-DD-<feature-slug>/
```

- **`YYYY-MM-DD`** — Start date of the feature (or date of phase 1).
- **`<feature-slug>`** — Short kebab-case name (e.g. `todo-redesign`, `auth-sns`).

**Suggested files per phase** (create as you complete each phase):

| Phase | Suggested file(s) in folder | Purpose |
|-------|-----------------------------|---------|
| 1 | `scope.md` or `brainstorm.md` | Scope, requirements, trade-offs |
| 2 | `ui-design.md` (optional); Pen file path in doc | Design decisions; link to `.pen` nodes/screens |
| 3 | `implementation-plan.md` | High-level plan, task breakdown, order |
| 4 | `tasks.md` or extend `implementation-plan.md` | Executable task list, acceptance criteria |
| 5 | (same folder) | Execution logs, checklist updates; code in repo |

**Phase status and handoff record (required):** Keep one file per feature folder that records **current phase** and **handoff between phases**. Use **`status.md`** in the same folder.

- **Current phase:** One line (e.g. `Current phase: 3` or `Current phase: 5 (in progress)`). Update when moving to the next phase.
- **Handoff log:** A short table or list: when each phase was completed and what was passed to the next (links to artifacts + one-line summary). This makes it clear what phase 2 consumed from phase 1, what phase 3 consumed from phase 2, etc.

Template for **`status.md`**:

```markdown
# Feature: <feature-slug>

**Current phase:** 1 | 2 | 3 | 4 | 5 (in progress) | 5 (done)

## Handoff log

| From → To | Completed (date) | Handoff content (links / one-line summary) |
|-----------|-------------------|--------------------------------------------|
| 1 → 2    | YYYY-MM-DD        | [scope.md](scope.md): requirements, boundaries, trade-offs. |
| 2 → 3    | YYYY-MM-DD        | [ui-design.md](ui-design.md); .pen nodes: … (or "N/A backend-only") |
| 3 → 4    | YYYY-MM-DD        | [implementation-plan.md](implementation-plan.md): task breakdown, order. |
| 4 → 5    | YYYY-MM-DD        | [tasks.md](tasks.md) (or implementation-plan § Tasks): executable list. |
| 5 done   | YYYY-MM-DD        | Code in repo; mapping/pen updated as needed; final review recorded with scope and finding disposition. |
```

Create or update `status.md` when you **finish** a phase (set current phase, append handoff row). The handoff row states what the *next* phase receives.

**Cross-cutting docs** (not per-feature; link from phase outputs when relevant):

- **Pen file:** `pencil/app/app-core-screens.pen` — Design source of truth; reference by path and, when using Pencil MCP, by node IDs.
- **Pen–code mapping:** `docs/design-system/pen-code-component-mapping.md` — Update when adding or changing reusable components.
- **Design system workflow:** `docs/design-system/workflow.md` — Pen-first, bidirectional sync rules.

---

## Phase Order, Outputs, Handoff, and Links

### Phase 1 — Scope and concept

| | |
|---|---|
| **Entry** | [brainstorm.md](brainstorm.md) → `brainstorming` skill |
| **Output** | Written scope: requirements, boundaries, trade-offs, open questions. |
| **Where** | `docs/plans/YYYY-MM-DD-<feature-slug>/scope.md` (or `brainstorm.md`). |
| **Handoff** | Phase 2 (and 3) consume this doc: what to design, what to plan. |
| **Links** | If UI is involved, point to target screens/flows; no .pen yet. |
| **CRUD** | If the feature adds a **new persistent entity** (e.g. tag, list, project), fill the **Entity/Resource CRUD checklist** in [docs/design-system/workflow.md](../../docs/design-system/workflow.md) and reflect it in scope (which operations, where they happen). Phase 2 will align UI design to the same table. |

---

### Phase 2 — UI/UX design

| | |
|---|---|
| **Entry** | [docs/design-system/workflow.md](../../docs/design-system/workflow.md) (Confirm Pen UI). Before any UI decomposition, load: `docs/design-system/workflow.md`, `docs/design-system/color-scheme.md`, `docs/design-system/tokens-reference.md`, and `docs/architecture/client.md`. If the feature adds or changes reusable UI, also load `docs/design-system/pen-code-component-mapping.md`. |
| **Output** | Pen finalized: layout, semantic variables, reusable components. Optional: `ui-design.md` summarizing decisions and which .pen nodes/screens belong to this feature. |
| **Where** | Changes in `pencil/app/app-core-screens.pen`; optional `docs/plans/YYYY-MM-DD-<feature-slug>/ui-design.md`. |
| **Handoff** | Phase 3 uses: .pen as source of truth, list of screens/components/node IDs (or names) that this feature touches. |
| **Links** | **Pen:** `pencil/app/app-core-screens.pen` (and specific node IDs if useful). **Mapping:** `docs/design-system/pen-code-component-mapping.md` when adding DS components. **Tokens:** `docs/design-system/color-scheme.md`, `docs/design-system/tokens-reference.md`. |
| **CRUD** | If the feature adds a new entity: ensure **Entity/Resource CRUD checklist** in [docs/design-system/workflow.md](../../docs/design-system/workflow.md) is filled and that **ui-design.md** (and Pen) explicitly cover each operation and its screen/modal (Create/Read/Update/Delete and where). |

*Backend-only work:* mark phase 2 as `N/A` in `status.md` and continue to phase 3; no `.pen` output is required.

**Phase 2 subagent rule:** UI decomposition may use subagents for bounded analysis tasks such as screen inventory, shared-component extraction candidates, Pen node mapping, and CRUD surface coverage checks. The main agent remains responsible for loading the required UI references, integrating the outputs, and making the final phase 2 design decisions. Do not apply the phase 5 `subagent-driven-development` execution workflow to phase 2.

---

### Phase 3 — Write spec (high-level)

| | |
|---|---|
| **Entry** | [write-plan.md](write-plan.md) → `writing-plans` skill. |
| **Output** | Implementation plan: approach, task breakdown, dependency order, files/areas to touch. |
| **Where** | `docs/plans/YYYY-MM-DD-<feature-slug>/implementation-plan.md`. |
| **Handoff** | Phase 4 turns this into an executable task list; phase 5 runs the tasks. |
| **Links** | Reference scope (phase 1) and, if UI, **Pen path** and node/screen IDs from phase 2; link to `pen-code-component-mapping.md` for new/updated components. |

---

### Phase 4 — Write executable spec

| | |
|---|---|
| **Entry** | Same as phase 3; refine plan into task-level checklist. |
| **Output** | Task list with acceptance criteria, one block per task; optional owner/order. |
| **Where** | `docs/plans/YYYY-MM-DD-<feature-slug>/tasks.md` or a “Tasks” section in `implementation-plan.md`. |
| **Handoff** | Phase 5 executes each task, marks completion, runs verification. |
| **Links** | Same as phase 3; each task can reference specific .pen nodes, files, or mapping rows. |

*If the phase 3 plan is already task-ready,* phases 3 and 4 can be a single document and single writing-plans pass.

---

### Phase 5 — Execute via Superpowers workflow

| | |
|---|---|
| **Entry** | [execute-plan.md](execute-plan.md) → REQUIRED: invoke `executing-plans` and follow its workflow. If the plan has multiple independent tasks, also use `subagent-driven-development`. If phase 5 changes behavior or production code, also follow `test-driven-development`. Before any completion claim, follow `verification-before-completion`. After implementation and verification are complete, run one final whole-feature code review using the repo's Codex CLI review flow (via `requesting-code-review`) against an explicit review scope (`origin/main...HEAD` or documented base/head SHAs). |
| **Output** | Code and tests in repo; checklist/task list updated; verification passed; final code review completed and recorded. |
| **Where** | Code under `apps/client/`, `backend/`, etc.; plan folder can hold a short execution log or “Done” checklist. |
| **Handoff** | N/A (final phase for this workflow). |
| **Links** | **Pen:** keep `pencil/app/app-core-screens.pen` in sync if UI changed. **Mapping:** update `docs/design-system/pen-code-component-mapping.md` when adding/changing components. |

**Final review exit criteria:**

- Run a final feature-level review after the last implementation task, even if per-task reviews already happened.
- Review scope must be explicit: use `origin/main...HEAD` or record the exact base/head SHAs.
- Do not mark phase `5 (done)` while Critical or Important findings remain unresolved.
- Record the review result in `status.md` and in the execution artifact (`implementation-plan.md`, `tasks.md`, or execution log): date, review scope, summary of findings, and disposition of each non-trivial finding.

---

## When to use subagents (no conflict with phase order)

- **Subagent-driven development** in this workflow means: **within phase 5 only**, when there are multiple implementation tasks, run them via subagents (one subagent per task, then review). That is task-level parallelism, not phase-level.
- **Phases 1, 3, and 4** are normally run **in sequence by the same agent** (or human). Each phase has a single main output (scope doc, plan, tasks). There is no need to “run each phase in a subagent”: these phases are not parallelizable and delegating each to a subagent would add handoff overhead without clear benefit.
- **Phase 2** may use subagents only for bounded UI decomposition analysis. This does not replace the Design System workflow, and it does not permit phase-level delegation of the final design decision.
- **Do not** interpret the workflow as “each phase is executed by a subagent.” Subagents are for **splitting work inside phase 5** (the execution phase), not for splitting the five phases themselves. That keeps phase order and subagent-driven development aligned and avoids conflict.

---

## Relation to AGENTS.md

- **AGENTS.md** requires: development follows Superpowers (brainstorming → writing-plans → executing-plans), with subagent-driven development for multiple tasks.
- This workflow turns that into five explicit phases, defines outputs and handoff, and places UI/UX design (and .pen linkage) before spec and implementation (Design System First).

---

## Other workflows in this directory

- [brainstorm.md](brainstorm.md) — Phase 1 entry
- [write-plan.md](write-plan.md) — Phases 3 and 4 entry
- [execute-plan.md](execute-plan.md) — Phase 5 entry

**Cursor entry:** [.cursor/commands/feature-development.md](../../.cursor/commands/feature-development.md) — In Cursor, run the "Feature Development" command to load this workflow and run by phase.
