# Issue 7 - Executable Tasks

## Task 1: Baseline audit and gap list

**Files:**
- Read: `package.json`
- Read: `apps/client/package.json`
- Read: `README.md`
- Read: `docs/runbooks/local-prerequisites-setup.md`
- Update: `docs/plans/2026-03-04-issue-7-android-support/tasks.md`

**Step 1: Confirm current Android command/config surface**

Run: `git grep -n "android\|expo run:android" package.json apps/client/package.json README.md docs/runbooks/local-prerequisites-setup.md`
Expected: existing client `android` script exists; root-level Android run discoverability and setup guidance gaps are identifiable.

**Step 2: Record gap list in this file**

Add a short "Audit Notes" section with explicit missing pieces to implement.

**Acceptance criteria:**
- Gap list clearly maps to issue deliverables (setup docs, bun command path, reproducible run instructions).

## Task 2: Align root command surface for iOS/Android local run

**Files:**
- Modify: `package.json`

**Step 1: Add Android-focused root script(s)**

Implement minimal, consistent script naming that forwards to `apps/client` via bun.

**Step 2: Validate script resolution**

Run: `bun run -h`
Expected: new Android script appears in script list.

**Acceptance criteria:**
- Contributor can discover iOS/Android local run commands from root with bun-only workflow.

## Task 3: Add Android command-line tools bootstrap support

**Files:**
- Modify: `scripts/setup-prerequisites.sh`
- Modify: `docs/runbooks/local-prerequisites-setup.md`

**Step 1: Add Android command-line tools install/check logic**

Install `android-commandlinetools` via Homebrew cask when missing, with clear logs and safe failure guidance.

**Step 2: Keep script idempotent**

Re-running script should not reinstall already-available dependencies.

**Step 3: Document script behavior**

Update runbook to state Android command-line tools are bootstrapped by script and how to verify.

**Acceptance criteria:**
- Script can bootstrap Android command-line tools for contributors who have not installed them.

## Task 4: Document iOS/Android setup and run workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/runbooks/local-prerequisites-setup.md`

**Step 1: Update README quickstart/local dev with iOS + Android section**

Add concise iOS + Android onboarding and run instructions (platform prerequisites + root command path).

**Step 2: Expand runbook with detailed Android prerequisites**

Document:
- required Android Studio components,
- emulator creation,
- environment variables (`ANDROID_HOME`/`ANDROID_SDK_ROOT`, PATH entries),
- `adb devices` check,
- first `expo run:android` execution and common troubleshooting.

**Step 3: Ensure no contradiction with iOS/web flow**

Cross-check updated docs preserve existing iOS/web instructions.

**Acceptance criteria:**
- Fresh contributor can follow docs to set up simulator/emulator and run both mobile platforms locally.

## Task 5: Verification and execution record

**Files:**
- Update: `docs/plans/2026-03-04-issue-7-android-support/tasks.md`

**Step 1: Run required repo verification commands**

Run (from repo root):
- `bun run check:client:ui`
- `bun run check:pw:console`
- `bun run check:expo`
- `bun run test`
- `bun run test:backend:unit`
- `bun run check:web`
- `bun run test:backend`
- `bun run e2e:web`
- `bun run ci`

**Step 2: Run Android command-path verification (if toolchain available)**

Run iOS + Android commands from root and confirm `expo run:ios` / `expo run:android` paths work.

**Step 3: Record evidence**

Add "Execution Log" section in this file with:
- command,
- pass/fail,
- key output,
- unverified items and reason.

**Acceptance criteria:**
- Verification evidence is explicit; no silent skips.

---

## Audit Notes

- `apps/client/package.json` already has `android: expo run:android`, but root `package.json` had no direct Android run entry for discoverability.
- `README.md` had iOS dev-client first-install flow but no symmetric Android first-install flow.
- `docs/runbooks/local-prerequisites-setup.md` documented Java/Firebase prerequisites only; Android Studio/SDK/emulator setup steps were missing.
- No dedicated Android setup markdown existed in `docs/runbooks/`.
- Updated issue scope now requires explicit iOS workflow verification alongside Android setup.
- Bootstrap script currently installs Java/bun only; no Android command-line tools bootstrap exists.

## Execution Log

- `bun run` -> PASS; confirmed root scripts include `app:ios` and `app:android`.
- `bun run app:ios` -> PARTIAL PASS; iOS native build/install succeeded on simulator, then Expo automation failed at final foreground step with `osascript ... System Events ... non-zero code: 1` (permission/non-interactive automation issue).
- `bun run app:android` -> FAIL (expected in this environment); missing Android SDK/ADB (`Failed to resolve the Android SDK path` and `spawn adb ENOENT`).
- `bun run ci` -> PASS.
- `bun run check:client:ui` -> PASS (covered in `ci`).
- `bun run check:pw:console` -> PASS (covered in `ci`).
- `bun run check:expo` -> PASS (covered in `ci`).
- `bun run test` -> PASS (covered in `ci`).
- `bun run test:backend:unit` -> PASS (covered in `test`/`ci`).
- `bun run check:web` -> PASS (covered in `ci`).
- `bun run test:backend` -> PASS (covered in `test`/`ci`).
- `bun run e2e:web` -> PASS (covered in `test`/`ci`).
- Unverified/pending manual follow-up: full Android launch success requires local Android SDK + running emulator; iOS auto-foreground step requires macOS automation permissions for `System Events`.
- Final whole-feature review -> PASS (working tree review; no committed delta vs `origin/main` at review time), no Critical/Important findings.
- Re-test after user installed Android tools: `bun run app:android` still fails in current environment with `Failed to resolve Android SDK path` and `spawn adb ENOENT`; indicates SDK path/platform-tools/adb not yet available at expected location.
- Docs follow-up: added explicit AVD creation steps in runbook (Android Studio Device Manager flow + optional `avdmanager` CLI path).
