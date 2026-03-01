# Local Prerequisites Setup (macOS)

This runbook documents the correct local installation steps for this repo.

## What this prepares

- `fnm` + Node 20 for repo-local runtime alignment
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
brew install fnm
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
fnm install 20
fnm use 20
node -v   # expect v20.x
```

Then run:

```bash
bash scripts/setup-prerequisites.sh
```

## What the script does

1. Assumes `fnm` is installed and repo is running on Node 20 (`.node-version`).
2. Verifies `brew` is installed.
3. Installs `bun` with Homebrew if missing.
4. Installs `openjdk` if Java is missing.
5. Adds `/opt/homebrew/opt/openjdk/bin` into current shell PATH for this run.
6. Verifies Firebase CLI through `bunx firebase --version`.
7. Runs `bun install` at repo root.
8. Creates `backend/firebase/.firebaserc` from `.firebaserc.example` if missing.
9. Runs project guard check and emulator smoke test.

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

Node should remain on `v20.x` while you are inside this repo.

## Troubleshooting

- `Missing command: brew`
  - Install Homebrew first: https://brew.sh
- `Missing command: java`
  - Run `brew install openjdk`
  - For persistent shell config, add `/opt/homebrew/opt/openjdk/bin` to your shell PATH.
- Wrong Node version
  - Run `fnm use`
  - Confirm `node -v` prints `v20.x`
- Firebase project guard failure
  - Ensure `backend/firebase/.firebaserc` exists and default project is `hero-stack-local`.
