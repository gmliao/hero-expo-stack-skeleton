# Maestro Mobile E2E

## Prerequisites

1. Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Ensure target device is available:

- iOS: simulator runtime available (`iPhone 17` by default)
- Android: emulator is running and visible in `adb devices`

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

## Run Android Maestro E2E

From repository root:

```bash
bun run e2e:android
```

What it does:

1. Starts Firebase emulators (Auth/Firestore/Functions)
2. Seeds test data
3. Builds Android release APK with embedded JS
4. Reinstalls app on the first online device from `adb devices`
5. Runs Maestro flow: `apps/client/maestro/flows/todo-smoke-android.yaml`

## Useful options

- Skip rebuild and reuse existing binaries:

```bash
cd apps/client
MAESTRO_SKIP_BUILD=1 bun run maestro:test:ios
MAESTRO_SKIP_BUILD=1 bun run maestro:test:android
```

- Use a different flow:

```bash
cd apps/client
bun run maestro:test:ios -- maestro/flows/todo-smoke.yaml
bun run maestro:test:android -- maestro/flows/todo-smoke-android.yaml
```
