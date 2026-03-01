# Endpoint Typing And Success Status Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve endpoint type information across the backend HTTP DSL, decouple app-level dependency typing from the HTTP framework files, add configurable success status codes, and remove the stale client todos `uid` query parameter.

**Architecture:** Keep the current controller/service/repository split and `Deps.services` contract, but move the concrete `Deps` registry typing out of `core/http/endpoint.ts`. Make `EndpointDef` and `wrapEndpoint()` carry generic type parameters end-to-end so validated Zod input stays typed without `as any`. Add an optional success status on endpoint definitions and update todos endpoints plus client/tests to match.

**Tech Stack:** TypeScript, Express, Zod, Jest, Supertest, Bun

---

### Task 1: Define failing tests for response status behavior and client todos request shape

**Files:**
- Modify: `backend/firebase/functions/tests/core/http/wrap.unit.test.ts`
- Modify: `backend/firebase/functions/tests/modules/todos/todos.controller.unit.test.ts`
- Modify: `apps/client/tests/data/api.test.ts`

**Step 1: Write the failing tests**

- Add a wrap test for an endpoint with `successStatus: 201`.
- Update todos controller routing tests so create expects `201` and delete expects `204`.
- Update the client API test so `getTodos()` no longer appends `?uid=...`.

**Step 2: Run tests to verify they fail**

Run:

```bash
bun test backend/firebase/functions/tests/core/http/wrap.unit.test.ts
bun test backend/firebase/functions/tests/modules/todos/todos.controller.unit.test.ts
bun test apps/client/tests/data/api.test.ts
```

Expected: failures for missing configurable success statuses and stale todos query usage.

### Task 2: Refactor backend typing and response handling

**Files:**
- Add: `backend/firebase/functions/src/core/deps.types.ts`
- Modify: `backend/firebase/functions/src/core/deps.ts`
- Modify: `backend/firebase/functions/src/core/app.ts`
- Modify: `backend/firebase/functions/src/core/http/endpoint.ts`
- Modify: `backend/firebase/functions/src/core/http/wrap.ts`
- Modify: `backend/firebase/functions/src/core/http/builder.ts`
- Modify: `backend/firebase/functions/src/core/http/context.ts`
- Modify: `backend/firebase/functions/src/modules/todos/todos.controller.ts`
- Modify: `backend/firebase/functions/tests/mocks/deps.mock.ts`

**Step 1: Write minimal implementation**

- Move `Deps`/`DepsServices` typing into `core/deps.types.ts`.
- Keep `core/http/endpoint.ts` focused on endpoint DSL types.
- Make `defineEndpoint()` return `EndpointDef<...>` with preserved generics.
- Make `wrapEndpoint()` generic and use the parsed input without `as any`.
- Add optional `successStatus` to `EndpointDef` and use it when sending success responses.
- Set todos create/delete endpoint statuses accordingly.

**Step 2: Run backend tests**

Run:

```bash
bun test backend/firebase/functions/tests/core/http/wrap.unit.test.ts
bun test backend/firebase/functions/tests/core/http/builder.unit.test.ts
bun test backend/firebase/functions/tests/modules/todos/todos.controller.unit.test.ts
```

Expected: PASS.

### Task 3: Clean up client todos request and keep tests green

**Files:**
- Modify: `apps/client/src/data/api.ts`
- Modify: `apps/client/tests/data/api.test.ts`

**Step 1: Write minimal implementation**

- Remove the unused `uid` query parameter from `api.getTodos`.

**Step 2: Run client tests**

Run:

```bash
bun test apps/client/tests/data/api.test.ts
```

Expected: PASS.

### Task 4: Verify the touched areas

**Files:**
- No new files

**Step 1: Run targeted verification**

Run:

```bash
bun test backend/firebase/functions/tests/core/http/wrap.unit.test.ts
bun test backend/firebase/functions/tests/core/http/builder.unit.test.ts
bun test backend/firebase/functions/tests/modules/todos/todos.controller.unit.test.ts
bun test apps/client/tests/data/api.test.ts
```

**Step 2: Run broader repo checks if feasible**

Run:

```bash
bun run test:backend:unit
bun run test
```

Expected: PASS. If a broader suite cannot run in this session, report it explicitly.
