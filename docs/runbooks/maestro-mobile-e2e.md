# Maestro Mobile E2E

## Prerequisites

1. Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Ensure iOS simulator runtime is available (`iPhone 17` by default).

## Run iOS Maestro E2E

From repository root:

```bash
bun run e2e:ios
```

What it does:

1. Starts Firebase emulators (Auth/Firestore/Functions)
2. Seeds test data
3. Builds iOS release app with prebundled JS
4. Reinstalls app on simulator
5. Runs Maestro flow: `apps/client/maestro/flows/todo-smoke.yaml`

## Useful options

- Skip rebuild and reuse existing release binary:

```bash
cd apps/client
MAESTRO_SKIP_BUILD=1 bun run maestro:test:ios
```

- Use a different flow:

```bash
cd apps/client
bun run maestro:test:ios -- maestro/flows/todo-smoke.yaml
```
