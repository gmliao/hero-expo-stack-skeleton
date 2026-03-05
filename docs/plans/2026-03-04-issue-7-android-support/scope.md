# Issue 7 Scope - iOS/Android local development workflow verification

## Context

- Source issue: https://github.com/gmliao/hero-expo-stack-skeleton/issues/7
- Goal: make iOS and Android local development/build workflows reproducible for contributors, with Android environment setup included.
- Confirmed scope decision: focus on local simulator/emulator + `expo run:ios` / `expo run:android` (not APK/AAB packaging and not EAS build in this phase).

## Problem statement

Current repository scripts and architecture are mobile-capable, but contributor onboarding and verification are uneven between iOS and Android. We need a clear, reproducible setup and run path for both platforms, with explicit Android toolchain setup, while keeping `bun`-only workflow and preserving existing web behavior.

## In scope

1. Audit current iOS/Android readiness in `apps/client` and root scripts.
2. Verify and document iOS local build/run workflow.
3. Add or update contributor docs for Android local environment setup (SDK/JDK/ADB/emulator prerequisites and required env setup).
4. Ensure `bun`-based commands are discoverable for iOS/Android local run (`expo run:ios` / `expo run:android`) and aligned with existing command conventions.
5. Add Android command-line tools setup into bootstrap script where safe and idempotent.
6. Verify Android local run workflow can be executed reproducibly (subject to this environment's available Android toolchain).
7. Update checks/docs references if mobile-specific validation is introduced.

## Out of scope

- EAS Build setup (cloud/local profiles).
- APK/AAB release packaging and signing pipelines.
- Production deploy changes.
- UI/UX redesign or design token updates.

## Constraints and non-negotiables

- Follow repo rules from `AGENTS.md` and `CLAUDE.md`.
- Use `bun` only for repo scripts.
- Preserve existing iOS/web workflows and CI expectations.
- Do not modify real `.env` secrets.

## Success criteria

1. A fresh contributor can follow docs to prepare iOS/Android local environment.
2. iOS/Android run command paths are clear and bun-based.
3. App launch path on Android emulator and iOS simulator is documented and reproducible.
4. No regressions introduced to web workflows.

## Risks and mitigations

- **Risk:** local machine lacks Android SDK/emulator, limiting full runtime verification.
  - **Mitigation:** explicitly record what was verified vs. what remains to verify by a machine with Android toolchain.
- **Risk:** script/document changes drift from existing dev workflow.
  - **Mitigation:** keep command style consistent with root and `apps/client` scripts; run relevant checks after changes.

## Handoff to next phase

- This feature is non-UI (developer environment, scripts, docs), so phase 2 (Design System / Pen UI) is expected to be `N/A`.
- Phase 3 should produce an implementation plan covering:
  - scripts and docs touchpoints,
  - verification matrix (what can be tested in this environment vs. required manual Android validation),
  - no-regression checks for web/iOS.
