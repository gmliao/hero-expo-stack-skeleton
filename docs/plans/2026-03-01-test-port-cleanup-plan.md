# Test Port Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure `bun run test` proactively clears stale Firebase emulator and Expo web ports before backend integration and web E2E steps.

**Architecture:** Keep the existing shell-based port cleanup approach, but split test cleanup from dev cleanup so `dev` and `test` can evolve independently. Wire the new cleanup script into the root `test:backend` and `e2e:web` scripts so the full `bun run test` chain is resilient to leftover local processes.

**Tech Stack:** Bun scripts, Bash, Firebase emulators, Playwright

---

### Task 1: Add test port cleanup plumbing

**Files:**
- Add: `scripts/kill-test-ports.sh`
- Modify: `package.json`

**Step 1: Implement cleanup script**

- Kill the standard backend emulator ports (`9099`, `8080`, `5001`) and the web E2E ports (`9199`, `8180`, `5011`, `8099`) before test runs.

**Step 2: Wire root scripts**

- Run the cleanup script before `test:backend`.
- Run the cleanup script before `e2e:web`.

### Task 2: Verify end-to-end behavior

**Step 1: Re-run the full test command**

Run:

```bash
bun run test
```

Expected: the command clears stale local emulator listeners itself and no longer fails immediately on occupied `9099` / `8080`.
