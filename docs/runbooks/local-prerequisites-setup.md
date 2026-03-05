# Local Prerequisites Setup (macOS)

This runbook documents the correct local installation steps for this repo.

## What this prepares

- `fnm` + Node 20 for repo-local runtime alignment
- Homebrew (required)
- bun
- Java runtime (OpenJDK) for Firebase Emulator Suite
- Android local toolchain (Android Studio + SDK + Emulator + adb)
- Android command-line tools (`android-commandlinetools` via Homebrew cask)
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
6. Installs `android-commandlinetools` (Homebrew cask) if missing.
7. Verifies Firebase CLI through `bunx firebase --version`.
8. Runs `bun install` at repo root.
9. Creates `backend/firebase/.firebaserc` from `.firebaserc.example` if missing.
10. Runs project guard check and emulator smoke test.

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

## Android setup (for `expo run:android`)

The setup script now bootstraps Android command-line tools (`android-commandlinetools`) automatically. For full Android emulator/device development, you still need Android Studio + SDK components below.

For command-line tools only (without opening Android Studio first), you can install via:

```bash
brew install --cask android-commandlinetools
```

### 1) Install Android Studio + SDK components

In Android Studio -> SDK Manager, install:

- Android SDK Platform (target the version recommended by current Expo SDK)
- Android SDK Platform-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator

### 2) Configure environment variables (macOS)

Add to `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Reload shell:

```bash
source ~/.zshrc
```

### 3) Create an Android emulator (AVD)

In Android Studio -> Device Manager:

1. Click **Create device**.
2. Pick a phone profile (for example, **Pixel 8**).
3. Choose a system image (recommend API level aligned with your installed SDK, x86_64/arm64 depending on host).
4. Complete wizard and save the AVD.

CLI alternative (optional):

```bash
# list installed targets
avdmanager list target

# create one AVD (replace target id/name as needed)
avdmanager create avd -n HeroApi35 -k "system-images;android-35;google_apis;arm64-v8a"
```

### 4) Start emulator and verify adb visibility

Start the created emulator from Android Studio Device Manager (or `emulator -avd HeroApi35`), then run:

```bash
adb devices
```

Expected: at least one `emulator-*` device in `device` state.

### 5) Install/run Android dev client from repo root

```bash
bun run app:android
```

This runs `expo run:android` in `apps/client` and installs/launches the app on the running emulator.

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
- `expo run:android` cannot find Android SDK
  - Check `ANDROID_HOME` / `ANDROID_SDK_ROOT` and PATH entries.
  - Verify `adb devices` shows a running emulator.
- Android emulator starts but app install fails
  - Recreate emulator with Play Store image disabled/enabled as needed.
  - Run `bun run app:android` again after emulator fully boots.
