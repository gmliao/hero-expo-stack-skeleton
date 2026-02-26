# Local Prerequisites Setup (macOS)

This runbook documents the correct local installation steps for this repo.

## What this prepares

- Homebrew (required)
- bun
- Java runtime (OpenJDK) for Firebase Emulator Suite
- Firebase CLI access via `bunx firebase`
- Repo dependencies (`bun install`)
- `backend/firebase/.firebaserc` from example if missing
- Emulator smoke check (Auth/Firestore/Functions)

## One-command setup

From repo root:

```bash
bash scripts/setup-prerequisites.sh
```

## What the script does

1. Verifies `brew` is installed.
2. Installs `bun` with Homebrew if missing.
3. Installs `openjdk` if Java is missing.
4. Adds `/opt/homebrew/opt/openjdk/bin` into current shell PATH for this run.
5. Verifies Firebase CLI through `bunx firebase --version`.
6. Runs `bun install` at repo root.
7. Creates `backend/firebase/.firebaserc` from `.firebaserc.example` if missing.
8. Runs project guard check and emulator smoke test.

## Expected success signal

Script ends with:

```text
[DONE] Prerequisites are ready.
```

Then continue with:

```bash
cp .env.example .env
bun run dev
```

## Troubleshooting

- `Missing command: brew`
  - Install Homebrew first: https://brew.sh
- `Missing command: java`
  - Run `brew install openjdk`
  - For persistent shell config, add `/opt/homebrew/opt/openjdk/bin` to your shell PATH.
- Firebase project guard failure
  - Ensure `backend/firebase/.firebaserc` exists and default project is `hero-stack-local`.
