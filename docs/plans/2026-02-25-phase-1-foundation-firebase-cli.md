# Skeleton Setup — Phase 1 Foundation + Firebase CLI Ops

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish repository baseline, shared contracts, and safe Firebase CLI/LLM operation workflows.

**Scope:** Original Phase 1 + Phase 8 from the monolithic plan.

---

## Phase 1 — Project Foundation

### Task 1: Root package.json + directory skeleton

**Files:**
- Create: `package.json` (root)
- Create: `.env.example`
- Create: `shared/types/api.ts`
- Create: all empty directories per README structure

**Step 1: Create root package.json**

```json
{
  "name": "hero-expo-stack-skeleton",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "concurrently \"bun run emulators\" \"bun run wait-emulators && bun run seed && bun run app\"",
    "app": "cd app && bun run start",
    "firebase:cli": "cd backend/firebase && bunx firebase",
    "firebase:login": "cd backend/firebase && bunx firebase login",
    "firebase:whoami": "cd backend/firebase && bunx firebase login:list",
    "emulators": "cd backend/firebase && bunx firebase emulators:start --import=./emulator_data --export-on-exit=./emulator_data",
    "seed": "bun run scripts/seed-emulator.ts",
    "wait-emulators": "bun run scripts/wait-on-emulators.ts",
    "clean-emulators": "bun run scripts/clean-emulator.ts",
    "test": "cd app && bun run test",
    "test:backend": "cd backend/firebase/functions && bunx firebase emulators:exec --only auth,firestore,functions \"bun run test\"",
    "e2e:web": "bunx playwright test",
    "e2e:ios": "cd app && bun run e2e:ios",
    "ci": "bun run test && bun run test:backend && bun run e2e:web"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "wait-on": "^8.0.0",
    "firebase-admin": "^12.0.0",
    "firebase-tools": "^13.35.0",
    "tsx": "^4.0.0"
  }
}
```

**Step 2: Create all directories**

```bash
mkdir -p app/app app/src/ui/theme app/src/ui/components app/src/data/hooks \
  app/src/stores app/src/features/auth app/src/features/todos \
  app/src/i18n \
  app/src/lib app/src/types app/tests app/e2e \
  backend/firebase/functions/src/middleware backend/firebase/functions/src/handlers \
  backend/firebase/functions/tests \
  e2e-web/tests shared/types scripts docs/runbooks \
  .github/workflows docs/plans
```

**Step 3: Create `.env.example`**

```env
# Firebase Project (emulator defaults work as-is)
FIREBASE_PROJECT_ID=hero-stack-local
FIREBASE_API_KEY=demo-key
FIREBASE_AUTH_DOMAIN=hero-stack-local.firebaseapp.com
FIREBASE_STORAGE_BUCKET=hero-stack-local.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123

# Emulator mode (set false for production)
EXPO_PUBLIC_USE_EMULATOR=true
EXPO_PUBLIC_FUNCTIONS_URL=http://127.0.0.1:5001
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hero-stack-local
EXPO_PUBLIC_FIREBASE_API_KEY=demo-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hero-stack-local.firebaseapp.com
```

**Step 4: Install root deps**

```bash
bun install
```

Expected: `node_modules` created at root.

**Step 5: Commit**

```bash
git add package.json .env.example
git commit -m "feat: root package.json with dev/test/ci scripts"
```

---

### Task 2: Shared API types contract

**Files:**
- Create: `shared/types/api.ts`

**Step 1: Write the types**

```typescript
// shared/types/api.ts
// This is the single source of truth for app ↔ backend contracts.
// Both app/src/data/api.ts and backend functions import from here.

export interface Todo {
  id: string
  uid: string
  title: string
  description?: string
  completed: boolean
  createdAt: string   // ISO string (Firestore Timestamp serialized)
  updatedAt: string
}

export interface CreateTodoRequest {
  title: string
  description?: string
}

export interface UpdateTodoRequest {
  completed?: boolean
  title?: string
  description?: string
}

export interface ApiError {
  error: string
  code?: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: string
  updatedAt: string
}
```

**Step 2: Verify no imports inside this file**

The `shared/types/api.ts` file must have zero imports — no app code, no backend code, no third-party libraries. Types only.

**Step 3: Commit**

```bash
git add shared/types/api.ts
git commit -m "feat: shared API type contracts"
```

---


---

## Phase 8 — Firebase CLI + LLM Ops

### Task 19: Firebase CLI operation wrappers and project guardrails

**Files:**
- Create: `scripts/firebase/run.sh`
- Create: `scripts/firebase/check-project.sh`
- Modify: `package.json` (root scripts)

**Step 1: Create `scripts/firebase/check-project.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

EXPECTED_PROJECT="hero-stack-local"
FIREBASERC_PATH="backend/firebase/.firebaserc"

if [[ ! -f "${FIREBASERC_PATH}" ]]; then
  echo "Missing ${FIREBASERC_PATH}. Run: cp backend/firebase/.firebaserc.example backend/firebase/.firebaserc"
  exit 1
fi

ACTIVE_PROJECT="$(grep -E '"default"\\s*:\\s*"[^"]+"' "${FIREBASERC_PATH}" | head -n1 | sed -E 's/.*"default"\\s*:\\s*"([^"]+)".*/\\1/')"

if [[ -z "${ACTIVE_PROJECT}" || "${ACTIVE_PROJECT}" != "${EXPECTED_PROJECT}" ]]; then
  echo "Expected Firebase default project: ${EXPECTED_PROJECT}, got: ${ACTIVE_PROJECT:-<empty>}"
  echo "Update ${FIREBASERC_PATH} default project before running firebase commands."
  exit 1
fi
```

**Step 2: Create `scripts/firebase/run.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

bash scripts/firebase/check-project.sh
cd backend/firebase
bunx firebase "$@"
```

**Step 3: Extend root scripts**

```json
{
  "scripts": {
    "firebase": "bash scripts/firebase/run.sh",
    "firebase:emulators:start": "bun run firebase emulators:start --only auth,firestore,functions",
    "firebase:emulators:ui": "bun run firebase emulators:start --only ui",
    "firebase:functions:log": "bun run firebase functions:log"
  }
}
```

**Step 4: Verify wrappers**

```bash
bash scripts/firebase/check-project.sh
bun run firebase -- --version
```

Expected: project check passes and Firebase CLI version is printed.

**Step 5: Commit**

```bash
git add scripts/firebase/ package.json
git commit -m "chore: firebase CLI wrappers with project safety guard"
```

---

### Task 20: LLM-assisted Firebase CLI runbook

**Files:**
- Create: `docs/runbooks/llm-firebase-cli-ops.md`
- Create: `docs/runbooks/firebase-cli-session-template.md`

**Step 1: Create `docs/runbooks/firebase-cli-session-template.md`**

```markdown
# Firebase CLI Session Log

- Date:
- Operator:
- Target project:
- Goal:

## Commands
1.
2.

## Outputs (key lines)
- 

## Decision
- 

## Next command suggested by LLM
- 
```

**Step 2: Create `docs/runbooks/llm-firebase-cli-ops.md`**

```markdown
# LLM-Assisted Firebase CLI Ops

## Scope
- Use LLM to plan and sequence Firebase CLI commands.
- Human/agent executes commands in terminal and feeds outputs back to LLM.

## Mandatory guardrails
- Always run `bash scripts/firebase/check-project.sh` before any mutating command.
- Default to emulator-first commands (`emulators:start`, `emulators:exec`) before real deploy paths.
- Never run `firebase deploy` (any target) without explicit user instruction in the active thread.
- Always include `--project <id>` for non-emulator commands.
- Log each session using `docs/runbooks/firebase-cli-session-template.md`.

## Prompt template for LLM
Use this prompt before execution:

> "You are helping operate Firebase CLI for project `hero-stack-local`.  
> Goal: <goal>.  
> Constraints: emulator-first, no deploy unless explicitly approved, explain risk per command.  
> Return a step-by-step command plan in this format: command, purpose, risk, rollback."

## Execution loop
1. Ask LLM for next 1-3 commands only.
2. Execute with `bun run firebase ...` (or wrapper scripts).
3. Paste output back to LLM and request next step.
4. Stop immediately on auth/project mismatch or destructive command suggestion.
```

**Step 3: Commit**

```bash
git add docs/runbooks/
git commit -m "docs: runbook for LLM-assisted Firebase CLI operations"
```

---

