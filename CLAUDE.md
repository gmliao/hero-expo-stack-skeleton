# CLAUDE.md — Hero Expo Stack Skeleton

This is a production reference skeleton for React Native / Expo + Firebase projects.
Read this file before touching any code.

---

## Package Manager

**Always use `bun`.** Never use `npm`, `yarn`, or `pnpm`.

```bash
bun install          # install deps
bun run <script>     # run scripts
bun add <pkg>        # add dependency
bun add -d <pkg>     # add dev dependency
```

---

## Architecture Rules (Non-Negotiable)

### 1. API-first — App never touches Firestore directly

```
App → data/api.ts → Firebase Functions (HTTP) → Firestore
```

- **NEVER** call `getDoc`, `setDoc`, `collection`, `onSnapshot`, or any Firestore SDK method from app code.
- **NEVER** import `firebase/firestore` in `app/src/`.
- All data access goes through `app/src/data/api.ts` which calls Firebase Functions HTTP endpoints.

### 2. State separation — TanStack Query for server, Zustand for UI only

| What | Where |
|------|-------|
| todos, profile, settings (re-fetchable data) | TanStack Query |
| filter, selected item, modal open, banner | Zustand |

- **NEVER** put server data into a Zustand store.
- **NEVER** use `useState` to cache data that comes from an API call — use `useQuery`.

### 3. QueryKey factory — never hardcode query key arrays

```ts
// ❌ WRONG — never do this
useQuery({ queryKey: ['todos', uid, filter] })
queryClient.invalidateQueries({ queryKey: ['todos'] })

// ✅ CORRECT — always use the factory
import { queryKeys } from '@/data/queryKeys'
useQuery({ queryKey: queryKeys.todos.list(uid, filter) })
queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(uid) })
```

All query keys live in `app/src/data/queryKeys.ts`. Add new keys there, nowhere else.

---

## Directory Conventions

```
app/src/
├── ui/          # Tamagui components and theme only. No business logic.
├── data/        # api.ts, queryKeys.ts, and TanStack Query hooks
├── stores/      # Zustand stores (UI state only)
├── features/    # Feature modules. Each feature owns its screens + local components.
├── lib/         # Pure helpers: logger, env, error mapping. No React.
└── types/       # TypeScript types for the app layer only.

shared/types/    # Types shared between app and backend. Never import app code here.
backend/firebase/functions/src/  # Firebase Functions. No app imports allowed.
```

**Rule:** `shared/types/` has zero dependencies. Both `app/` and `backend/` may import from it.

---

## Code Patterns

### API client (`app/src/data/api.ts`)

- Always injects the Firebase Auth token via `Authorization: Bearer <token>`.
- Maps HTTP error codes: `401 → AuthError`, `403 → PermissionError`, `4xx → ApiError`.
- Has a timeout (default: 10s) and retry logic (2 retries on network errors, not on 4xx).
- Returns typed responses using types from `shared/types/api.ts`.

### TanStack Query hooks (`app/src/data/`)

- Hooks live alongside the query key: e.g., `useTodosQuery.ts` next to the relevant section in `queryKeys.ts`.
- On mutation success, **always** call `queryClient.invalidateQueries` with the correct factory key.
- Never use `refetchOnWindowFocus: false` unless there is a documented reason.

### Zustand stores (`app/src/stores/`)

- Keep actions as plain functions inside the store definition.
- Write stores so their logic can be tested as pure functions (no React hooks inside action logic).
- One store per domain: `useUIStore`, `useAuthStore` (token/user only, not profile data).

### Firebase Functions (`backend/firebase/functions/src/`)

- Every endpoint must verify the Firebase Auth token. Unauthenticated → `401`. Wrong uid → `403`.
- Use Firestore transactions for any multi-document write.
- Always set `updatedAt` on writes.
- Validate request body with a schema (zod or similar) before touching Firestore.

---

## Testing Conventions

### General

- **Emulator-first**: all tests that touch Firebase run against the local emulator, never production.
- Seed data is in `scripts/seed-emulator.ts`. Tests must not create their own data unless isolated.
- Test accounts: `test1@example.com / password`, `test2@example.com / password`.

### App unit tests (`app/tests/`)

- Use Jest + React Native Testing Library.
- Mock `data/api.ts` at the module level, not inside individual tests.
- Every new TanStack Query hook needs: `success`, `error`, and `loading` test cases.
- Every new mutation hook needs a test that verifies `invalidateQueries` was called with the correct key.
- `queryKeys` tests must assert the output is stable across calls (same input → same serialized key).

### Backend tests (`backend/firebase/functions/tests/`)

- Tests run against the Firebase Functions Emulator (not unit-mocked Firestore).
- Each test file seeds its own isolated data using a unique uid to avoid cross-test pollution.
- Must test: authenticated happy path, unauthenticated (401), wrong uid (403).

### Web E2E (`e2e-web/tests/`)

- Use Playwright. Tests run against the Expo web build + Emulators.
- Use the seeded test accounts for login. Do not create accounts in E2E tests.
- After mutations (create/toggle), assert that the list reflects the new state — this validates TanStack Query invalidation.

### Mobile E2E (`app/e2e/`)

- Detox, iOS-first. At minimum: login → create → toggle happy path.
- Not required in CI. Must pass locally before merging features that touch mobile flows.

---

## What NOT to Do

- Do not import `firebase/firestore` anywhere in `app/src/`.
- Do not store API response data in Zustand.
- Do not write inline query key arrays (use the factory).
- Do not add `console.log` in committed code — use `lib/logger.ts`.
- Do not add `any` types. If a type is unknown, define it in `shared/types/api.ts` or `app/src/types/`.
- Do not call `firebase deploy` or push to production without explicit user instruction.
- Do not modify `.env` — only `.env.example`. Never commit real credentials.
- Do not skip emulator tests by mocking the Firebase SDK in backend tests.

---

## Running the Project

```bash
bun run dev            # app + emulators + seed (full local env)
bun run test           # app unit tests
bun run test:backend   # backend emulator tests
bun run e2e:web        # Playwright web e2e
bun run e2e:ios        # Detox mobile e2e (local only)
bun run ci             # full pipeline (unit + backend + web e2e)
```

Firebase Emulator ports:
- Auth: `localhost:9099`
- Firestore: `localhost:8080`
- Functions: `localhost:5001`

---

## Shared Types Contract

`shared/types/api.ts` is the single source of truth for request/response shapes between app and backend.

- When adding a new endpoint, define its request/response types here first.
- The backend function validates against this type; the api client deserializes to this type.
- Never duplicate these types in `app/src/types/` or `backend/`.
