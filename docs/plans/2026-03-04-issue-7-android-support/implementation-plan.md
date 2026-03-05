# Issue 7 Mobile Workflow Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a reproducible iOS/Android local development path (setup + run) centered on simulator/emulator `expo run:*` workflows, with Android setup automation added to prerequisites bootstrap.

**Architecture:** This feature is tooling/documentation-first. We keep app runtime architecture unchanged and improve contributor operability by aligning root scripts, bootstrap prerequisites script, and runbooks. Verification separates environment-independent checks (repo scripts/build/test) from host-toolchain-dependent iOS/Android launch validation.

**Tech Stack:** Bun, Expo SDK 54 (`expo run:ios` / `expo run:android`), React Native, Firebase Emulator Suite, Bash bootstrap script, Markdown runbooks.

## Phase 3 Plan (high-level)

1. Baseline audit
   - Confirm existing iOS/Android scripts/config in root and `apps/client`.
   - Identify current doc gaps for iOS verification and Android setup/launch.

2. Command surface alignment
   - Add root-level bun command(s) for iOS/Android local run if discoverability is insufficient.
   - Keep command naming/style consistent with existing root scripts.

3. Bootstrap automation alignment
   - Add `android-commandlinetools` install/check path into `scripts/setup-prerequisites.sh`.
   - Keep the script idempotent and safe for machines without Android needs.

4. Contributor documentation
   - Add iOS workflow verification notes.
   - Add Android setup section (Android Studio, SDK platform/tools, emulator creation, ADB check).
   - Add reproducible run workflow from clean prerequisites to app launch.
   - Clarify emulator/host assumptions and common failure modes.

5. Verification
   - Run required repo checks that are feasible in this environment.
   - Attempt iOS/Android command-path verification; if toolchain is unavailable, record explicit manual verification requirements.

6. Final pass
   - Ensure docs do not conflict with existing iOS/web instructions.
   - Prepare concise execution log in tasks artifact.

## Files expected to change

- `package.json` (root scripts; optional but likely)
- `scripts/setup-prerequisites.sh` (Android command-line tools install/check)
- `README.md` (developer quickstart/local dev updates)
- `docs/runbooks/local-prerequisites-setup.md` (detailed Android setup)
- `docs/plans/2026-03-04-issue-7-android-support/tasks.md` (phase 4 executable checklist + execution log)

## Verification strategy

- Command/config checks:
  - `bun run check:client:ui`
  - `bun run check:pw:console`
  - `bun run check:expo`
  - `bun run test`
  - `bun run test:backend:unit`
  - `bun run check:web`
  - `bun run test:backend`
  - `bun run e2e:web`
  - `bun run ci`
- Mobile runtime validation:
  - Expected iOS path: root iOS command (to be added/confirmed) -> `apps/client` `expo run:ios` -> app boots on simulator.
  - Expected Android path: root Android command (added/confirmed) -> `apps/client` `expo run:android` -> app boots on emulator.
  - If this environment lacks iOS/Android toolchain pieces, mark pending manual validation with exact steps.
