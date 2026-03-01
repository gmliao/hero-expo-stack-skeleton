# Backend Structure Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize `backend/firebase/functions/src` into `core / infrastructure / modules`, migrate the `todos` domain into `modules/todos`, and update tests plus documentation so future backend work follows the new structure.

**Architecture:** Keep runtime behavior unchanged while moving files into clearer responsibility boundaries. `core/` holds HTTP and app assembly, `infrastructure/` holds Firebase/Firestore/auth implementations and shared repository abstractions, and `modules/` holds domain-specific controller/service/schema/repository implementation files. Update `AGENTS.md` and `docs/architecture/server.md` so the new structure becomes mandatory.

**Tech Stack:** TypeScript, Firebase Functions v2, Express, Zod, Jest, Bun

---

### Task 1: Establish the target directories and move core app assembly

**Files:**
- Create: `backend/firebase/functions/src/core/http/`
- Create: `backend/firebase/functions/src/core/routes/`
- Create: `backend/firebase/functions/src/core/`
- Modify: `backend/firebase/functions/src/index.ts`
- Move: `backend/firebase/functions/src/app.ts`
- Move: `backend/firebase/functions/src/deps.ts`
- Move: `backend/firebase/functions/src/http/builder.ts`
- Move: `backend/firebase/functions/src/http/context.ts`
- Move: `backend/firebase/functions/src/http/endpoint.ts`
- Move: `backend/firebase/functions/src/http/errors.ts`
- Move: `backend/firebase/functions/src/http/wrap.ts`
- Move: `backend/firebase/functions/src/routes/index.ts`

**Step 1: Move `http/` files under `src/core/http/`**

**Step 2: Move `app.ts`, `deps.ts`, and `routes/index.ts` under `src/core/`**

**Step 3: Update imports from `index.ts` and all moved files**

**Step 4: Run a focused backend unit subset**

Run:

```bash
cd backend/firebase/functions && bun run test -- --runInBand http.builder.unit.test.ts http.controller.unit.test.ts http.wrap.unit.test.ts
```

Expected:

- The HTTP/core tests pass after the path updates.

### Task 2: Introduce `infrastructure/` and move auth + repository abstractions

**Files:**
- Create: `backend/firebase/functions/src/infrastructure/auth/`
- Create: `backend/firebase/functions/src/infrastructure/firestore/repositories/`
- Move: `backend/firebase/functions/src/services/auth.firebase.service.ts`
- Move: `backend/firebase/functions/src/services/auth.types.ts`
- Move: `backend/firebase/functions/src/repositories/types.ts`

**Step 1: Move auth implementation and auth interface under `src/infrastructure/auth/`**

**Step 2: Move repository contract file under `src/infrastructure/firestore/repositories/`**

**Step 3: Update imports in deps, services, and tests**

**Step 4: Run auth-related tests**

Run:

```bash
cd backend/firebase/functions && bun run test -- --runInBand auth.test.ts
```

Expected:

- Auth-related paths still resolve and tests pass.

### Task 3: Move the `todos` domain into `modules/todos`

**Files:**
- Create: `backend/firebase/functions/src/modules/todos/`
- Move: `backend/firebase/functions/src/controllers/todos.controller.ts`
- Move: `backend/firebase/functions/src/services/todos.service.ts`
- Move: `backend/firebase/functions/src/services/todos.types.ts`
- Move: `backend/firebase/functions/src/schemas/todos.schema.ts`
- Move: `backend/firebase/functions/src/repositories/todos.firestore.repository.ts`

**Step 1: Move all `todos` files into `src/modules/todos/`**

**Step 2: Normalize imports so files inside the module reference each other locally when possible**

**Step 3: Update `deps.ts`, route registration, and tests to the new module paths**

**Step 4: Run `todos` unit and integration subsets**

Run:

```bash
cd backend/firebase/functions && bun run test -- --runInBand controllers.todos.unit.test.ts services.todos.unit.test.ts
cd backend/firebase/functions && bunx firebase emulators:exec --project hero-stack-local --only auth,firestore,functions "bun run test -- --runInBand todos.test.ts"
```

Expected:

- `todos` unit and integration tests pass after the move.

### Task 4: Update test support files and mocks to the new structure

**Files:**
- Modify: `backend/firebase/functions/tests/mocks/auth.verifier.mock.ts`
- Modify: `backend/firebase/functions/tests/mocks/deps.mock.ts`
- Modify: `backend/firebase/functions/tests/mocks/todos.repository.mock.ts`
- Modify: `backend/firebase/functions/tests/mocks/todos.service.mock.ts`
- Modify: `backend/firebase/functions/tests/app.async-errors.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.builder.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.controller.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.errors.unit.test.ts`
- Modify: `backend/firebase/functions/tests/http.wrap.unit.test.ts`
- Modify: `backend/firebase/functions/tests/middleware.preflight.unit.test.ts`

**Step 1: Update all test imports to `core/`, `infrastructure/`, and `modules/` paths**

**Step 2: Run the backend unit test suite**

Run:

```bash
cd backend/firebase/functions && bun run test -- --coverage=false
```

Expected:

- Unit test suite passes without unresolved imports.

### Task 5: Encode the new structure in documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/architecture/server.md`
- Modify: `docs/README.md`

**Step 1: Update `AGENTS.md`**

Add concise mandatory rules:

- backend source must be split into `core`, `infrastructure`, and `modules`
- new domain code belongs under `modules/<domain>/`
- `AGENTS.md` points to `docs/architecture/server.md` for detailed layout rules

**Step 2: Update `docs/architecture/server.md`**

Document:

- target directory tree
- allowed dependencies between `core`, `infrastructure`, `modules`
- how new domains should be added

**Step 3: Update `docs/README.md` if needed**

Make sure documentation index still points to the right server guidance.

### Task 6: Final verification

**Files:**
- Verify: `backend/firebase/functions/src/**`
- Verify: `backend/firebase/functions/tests/**`
- Verify: `AGENTS.md`
- Verify: `docs/architecture/server.md`

**Step 1: Run backend verification**

Run:

```bash
cd backend/firebase/functions && bun run test -- --coverage=false
cd /Users/guanmingliao/Documents/GitHub/hero-expo-stack-skeleton && bun run test:backend
```

Expected:

- Backend unit and emulator tests pass.

**Step 2: Review the tree**

Run:

```bash
find backend/firebase/functions/src -maxdepth 3 -type f | sort
```

Expected:

- `core/`, `infrastructure/`, and `modules/` are present and used.

**Step 3: Review diff**

Run:

```bash
git diff -- backend/firebase/functions/src backend/firebase/functions/tests AGENTS.md docs/architecture/server.md docs/README.md
```

Expected:

- Only the backend structure, test imports, and matching docs changed.
