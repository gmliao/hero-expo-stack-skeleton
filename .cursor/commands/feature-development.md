# Feature Development

Run feature development according to the **Feature Development Workflow**. The full workflow is defined in:

**@.agent/workflows/feature-development.md**

Read that file first and follow its phase order and skill requirements.

---

## What to do now

1. **Read and follow** `.agent/workflows/feature-development.md` (phase order, mandatory skills, document storage, `status.md` updates).
2. **From the user’s message**, decide the starting point:
   - **New feature:** Create `docs/plans/YYYY-MM-DD-<feature-slug>/` and start at **Phase 1 (brainstorming)**; create or switch to the feature’s git branch first.
   - **Specific phase:** If the user says “do phase 2” or “write implementation plan”, run that phase (confirm the previous phase is done via the feature’s `status.md`).
   - **Continue:** If the user says “continue feature X” or “do next phase”, open `docs/plans/YYYY-MM-DD-<feature-slug>/status.md` and run the next phase from **Current phase** and **Handoff log**.
3. **Phase entry points and skills** (required):
   - Phase 1 → `brainstorm.md` / **brainstorming** skill. If the feature adds a **new persistent entity** (tag, list, project, etc.), fill the **Entity/Resource CRUD checklist** in `docs/design-system/workflow.md` and reflect it in scope.
   - Phase 2 → `docs/design-system/workflow.md` (Confirm Pen UI). If the feature adds a new entity, ensure the CRUD checklist is filled and that **ui-design.md** and Pen explicitly cover each operation (Create/Read/Update/Delete) and where it happens.
   - Phase 3–4 → `write-plan.md` / **writing-plans** skill
   - Phase 5 → `execute-plan.md` / **executing-plans** (and when needed: **subagent-driven-development**, **test-driven-development**, **verification-before-completion**)
4. **After each phase:** Update `status.md` in that feature folder (Current phase + one Handoff log row), summarize outputs, and by default wait for user approval before the next phase.

If the user gave a feature name or feature-slug, use it when creating the folder and branch.
