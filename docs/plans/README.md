# Plans

This directory holds **phase outputs** for feature work and **roadmap/phase** docs (e.g. skeleton setup, migrations).

## Feature / epic folder convention

For a **single feature or epic**, create one folder and keep all phase outputs there:

```
docs/plans/YYYY-MM-DD-<feature-slug>/
```

- **`YYYY-MM-DD`** — Start date (e.g. when scope was agreed).
- **`<feature-slug>`** — Short kebab-case name (e.g. `todo-redesign`, `auth-sns`).

Suggested files inside the folder:

- **`status.md`** — **Required.** Current phase (1–5) and handoff log: what was completed and what was passed to the next phase (see [Feature Development Workflow](../.agent/workflows/feature-development.md) for template).
- `scope.md` — Phase 1: scope, requirements, trade-offs
- `ui-design.md` — Phase 2 (optional): design decisions, link to `.pen` nodes
- `implementation-plan.md` — Phase 3: high-level plan, task breakdown
- `tasks.md` (or section in implementation-plan) — Phase 4: executable task list
- Phase 5: code in repo; optional execution checklist in same folder

Full phase order, outputs, handoff, and links (e.g. to `pencil/app/app-core-screens.pen`, `docs/design-system/pen-code-component-mapping.md`): **[Feature Development Workflow](../.agent/workflows/feature-development.md)**.

## Other files in this directory

Top-level markdown files here (e.g. `2026-02-25-skeleton-roadmap.md`, `2026-02-25-phase-1-foundation-firebase-cli.md`) are **legacy or shared roadmap/phase** docs, not per-feature folders. New feature work should use the folder convention above.
