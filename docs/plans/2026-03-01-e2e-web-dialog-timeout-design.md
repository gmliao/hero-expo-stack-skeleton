# E2E Web Dialog And Timeout Design

**Date:** 2026-03-01

## Problem

`bun run e2e:web` was intermittently reported as "web alert cannot be detected", but the reproduced failure on 2026-03-01 was different:

- The suite consistently hung on delete-related tests.
- The hang ended only after Playwright's 60 second test timeout.
- The failing line was the delete button `click()`, not the later alert assertion.

## Evidence

Reproduction command:

```bash
bun run e2e:web
```

Observed failures:

- `e2e-web/tests/todos.spec.ts:102` `Todos flow › can delete a todo with confirmation`
- `e2e-web/tests/todos.spec.ts:208` `Mutation error alerts › shows alert when delete todo fails (500 INTERNAL)`

Observed error shape:

```text
Test timeout of 60000ms exceeded.
Error: locator.click: Test timeout of 60000ms exceeded.
```

The click never completed because the native confirm dialog opened during the click action and was not handled until after `await click()` resolved. On web, that ordering is invalid because the dialog blocks the click from completing.

## Options Considered

### Option A: Change app delete confirmation implementation

- Replace `globalThis.confirm()` with custom in-app modal.
- Avoid native dialog handling in Playwright entirely.

Trade-off:

- Larger product change.
- Not justified because the app behavior is working; only the test interaction pattern is wrong.

### Option B: Fix Playwright dialog handling and reduce stuck-action timeout

- Handle the confirm dialog in the same async step as the click.
- Add a small helper for delete flows so the correct pattern is reused.
- Lower Playwright action timeout to 5 seconds so blocked clicks fail quickly.

Trade-off:

- Minimal code change.
- Directly addresses root cause and shortens future failures.

### Option C: Only reduce global test timeout from 60 seconds to 5 seconds

- Faster failures, but it would also penalize legitimate slow test setup and navigation.
- Does not fix the broken dialog handling.

Trade-off:

- Symptom relief only.
- High risk of causing unrelated flakes.

## Recommended Design

Use Option B.

1. Fix both delete-related tests so the confirm dialog is handled concurrently with the click.
2. Extract that interaction into a small helper in `e2e-web/tests/todos.spec.ts` to prevent future copy-paste mistakes.
3. Keep a realistic overall test timeout, but set Playwright `actionTimeout` to 5 seconds so blocked clicks and similar stuck interactions fail quickly.

## Regression Prevention

- Keep delete dialog handling behind a helper instead of re-implementing the pattern in multiple tests.
- Preserve this design note and add an implementation plan with explicit verification commands.
