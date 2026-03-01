# E2E Web Dialog Timeout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix `bun run e2e:web` by correcting Playwright confirm-dialog handling in delete tests and make stuck browser actions fail in 5 seconds instead of 60.

**Architecture:** Keep app behavior unchanged. Update only the Playwright suite and config: create a reusable dialog helper in the web E2E spec, then tighten Playwright action timeout so blocked clicks fail fast while overall test runtime remains practical.

**Tech Stack:** Bun, Playwright, Expo web, Firebase emulator

---

### Task 1: Capture the failing behavior

**Files:**
- Verify: `e2e-web/tests/todos.spec.ts`
- Verify: `playwright.config.ts`

**Step 1: Run the full failing suite**

Run:

```bash
bun run e2e:web
```

Expected:

- Delete-related tests time out after 60 seconds.
- Failure points at `locator.click()` in the delete tests.

**Step 2: Confirm the root cause from the stack trace**

Expected:

- The dialog is awaited after `click()`.
- The dialog blocks `click()` from finishing on web.

### Task 2: Fix delete dialog handling with a helper

**Files:**
- Modify: `e2e-web/tests/todos.spec.ts`

**Step 1: Add a helper that handles the confirm dialog during the click**

Implementation shape:

```ts
const confirmDelete = async (page: Page, trigger: Locator) => {
  const dialogHandler = page.waitForEvent('dialog', { timeout: 5_000 })
  await trigger.click()
  const dialog = await dialogHandler
  expect(dialog.type()).toBe('confirm')
  await dialog.accept()
}
```

**Step 2: Update both delete-related tests to use the helper**

Expected:

- `can delete a todo with confirmation`
- `shows alert when delete todo fails (500 INTERNAL)`

**Step 3: Run only the delete tests**

Run:

```bash
cd backend/firebase && bunx firebase emulators:exec --project hero-stack-local --config firebase.e2e.json --only auth,firestore,functions "cd ../.. && FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9199 FIRESTORE_EMULATOR_HOST=127.0.0.1:8180 FIREBASE_PROJECT_ID=hero-stack-local bun run seed && lsof -ti:8099 | xargs kill -9 2>/dev/null || true && E2E_EMULATOR_AUTH_HOST=127.0.0.1:9199 E2E_EMULATOR_FUNCTIONS_URL=http://127.0.0.1:5011/hero-stack-local/us-central1 bunx playwright test e2e-web/tests/todos.spec.ts --grep \"delete\" --reporter=line"
```

Expected:

- Both delete-related tests pass.

### Task 3: Reduce stuck-action timeout to 5 seconds

**Files:**
- Modify: `playwright.config.ts`

**Step 1: Set Playwright `actionTimeout` to `5_000`**

Expected:

- Stuck clicks, fills, and similar actions fail in 5 seconds.
- Overall `timeout` stays large enough for valid end-to-end flows.

**Step 2: Re-run the delete subset**

Run:

```bash
cd backend/firebase && bunx firebase emulators:exec --project hero-stack-local --config firebase.e2e.json --only auth,firestore,functions "cd ../.. && FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9199 FIRESTORE_EMULATOR_HOST=127.0.0.1:8180 FIREBASE_PROJECT_ID=hero-stack-local bun run seed && lsof -ti:8099 | xargs kill -9 2>/dev/null || true && E2E_EMULATOR_AUTH_HOST=127.0.0.1:9199 E2E_EMULATOR_FUNCTIONS_URL=http://127.0.0.1:5011/hero-stack-local/us-central1 bunx playwright test e2e-web/tests/todos.spec.ts --grep \"delete\" --reporter=line"
```

Expected:

- Delete tests still pass.
- Any future stuck click would fail within 5 seconds.

### Task 4: Final verification

**Files:**
- Verify: `e2e-web/tests/todos.spec.ts`
- Verify: `playwright.config.ts`
- Verify: `docs/plans/2026-03-01-e2e-web-dialog-timeout-design.md`

**Step 1: Run the full suite**

Run:

```bash
bun run e2e:web
```

Expected:

- All web E2E tests pass.

**Step 2: Run the Playwright console guard**

Run:

```bash
bun run check:pw:console
```

Expected:

- No browser `console.error` or `pageerror`.

**Step 3: Review the diff**

Run:

```bash
git diff -- e2e-web/tests/todos.spec.ts playwright.config.ts docs/plans/2026-03-01-e2e-web-dialog-timeout-design.md docs/plans/2026-03-01-e2e-web-dialog-timeout-implementation.md
```

Expected:

- Only the E2E spec, Playwright config, and plan docs changed.
