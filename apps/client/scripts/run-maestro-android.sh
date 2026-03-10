#!/usr/bin/env bash

set -euo pipefail

FLOW_PATH="${1:-maestro/flows/todo-smoke-android.yaml}"
BUNDLE_ID="${MAESTRO_ANDROID_BUNDLE_ID:-com.example.herostack}"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
TODO_SUFFIX="${MAESTRO_TODO_SUFFIX:-$(date +%s)}"
BUILD_LOG_PATH="/tmp/maestro-android-build-release.log"
EMULATOR_LOG_PATH="/tmp/maestro-android-emulator.log"
BOOT_TIMEOUT_SECONDS="${MAESTRO_ANDROID_BOOT_TIMEOUT_SECONDS:-180}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install via: curl -Ls \"https://get.maestro.mobile.dev\" | bash" >&2
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android SDK Platform-Tools and ensure adb is on PATH." >&2
  exit 1
fi

if ! command -v emulator >/dev/null 2>&1; then
  echo "Android emulator binary not found. Ensure Android SDK emulator tools are on PATH." >&2
  exit 1
fi

if [ ! -f "$FLOW_PATH" ]; then
  echo "Flow file not found: $FLOW_PATH" >&2
  exit 1
fi

if [ "${MAESTRO_SKIP_BUILD:-0}" != "1" ]; then
  echo "Building Android app (Release)..."
  (
    cd android
    ./gradlew assembleRelease
  )
fi

if [ ! -f "$APK_PATH" ]; then
  echo "Missing built apk at $APK_PATH" >&2
  echo "If build failed, check: $BUILD_LOG_PATH" >&2
  exit 1
fi

# Prefer emulator devices: e2e uses 10.0.2.2 for Auth/Functions; physical devices cannot reach that.
pick_online_emulator() {
  adb devices | awk '$2 == "device" && $1 ~ /^emulator-/ { print $1; exit }'
}

pick_online_device() {
  # Fallback: any device when explicitly requested via MAESTRO_ANDROID_DEVICE
  adb devices | awk '$2 == "device" { print $1; exit }'
}

wait_for_online_device() {
  local waited_seconds=0
  while [ "$waited_seconds" -lt "$BOOT_TIMEOUT_SECONDS" ]; do
    local serial
    serial="$(pick_online_emulator)"
    if [ -n "$serial" ]; then
      echo "$serial"
      return 0
    fi
    sleep 2
    waited_seconds=$((waited_seconds + 2))
  done
  return 1
}

# Use emulator by default; MAESTRO_ANDROID_DEVICE overrides (e.g. for physical device with port forwarding).
DEVICE_SERIAL="${MAESTRO_ANDROID_DEVICE:-$(pick_online_emulator)}"

if [ -z "$DEVICE_SERIAL" ]; then
  AVD_NAME="${MAESTRO_ANDROID_AVD:-$(emulator -list-avds | head -n 1)}"
  if [ -z "$AVD_NAME" ]; then
    echo "No Android device/emulator is online and no AVD is available to boot." >&2
    exit 1
  fi

  echo "No Android device is online. Booting AVD \"$AVD_NAME\"..."
  nohup emulator -avd "$AVD_NAME" -no-snapshot-save >"$EMULATOR_LOG_PATH" 2>&1 &

  if ! DEVICE_SERIAL="$(wait_for_online_device)"; then
    echo "Timed out waiting for Android emulator \"$AVD_NAME\" to come online." >&2
    echo "Check emulator logs at: $EMULATOR_LOG_PATH" >&2
    exit 1
  fi
fi

adb -s "$DEVICE_SERIAL" wait-for-device
until [ "$(adb -s "$DEVICE_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 2
done
until [ "$(adb -s "$DEVICE_SERIAL" shell getprop init.svc.bootanim 2>/dev/null | tr -d '\r')" = "stopped" ]; do
  sleep 2
done
# Give post-boot broadcasts time to settle so Maestro's driver stays attached.
sleep "${MAESTRO_ANDROID_SETTLE_SECONDS:-10}"

if [ "${MAESTRO_SKIP_INSTALL:-0}" != "1" ]; then
  adb -s "$DEVICE_SERIAL" uninstall "$BUNDLE_ID" >/dev/null 2>&1 || true
  adb -s "$DEVICE_SERIAL" install -r "$APK_PATH"
fi

maestro test --device "$DEVICE_SERIAL" --env MAESTRO_TODO_SUFFIX="$TODO_SUFFIX" "$FLOW_PATH"
