#!/usr/bin/env bash

set -euo pipefail

FLOW_PATH="${1:-maestro/flows/todo-smoke.yaml}"
DEVICE_NAME="${MAESTRO_IOS_DEVICE_NAME:-iPhone 17}"
BUNDLE_ID="${MAESTRO_IOS_BUNDLE_ID:-com.example.herostack}"
APP_PATH="ios/build/Build/Products/Release-iphonesimulator/HeroStack.app"
TODO_SUFFIX="${MAESTRO_TODO_SUFFIX:-$(date +%s)}"
BUILD_LOG_PATH="/tmp/maestro-ios-build-release.log"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install via: curl -Ls \"https://get.maestro.mobile.dev\" | bash" >&2
  exit 1
fi

if [ ! -f "$FLOW_PATH" ]; then
  echo "Flow file not found: $FLOW_PATH" >&2
  exit 1
fi

if [ "${MAESTRO_SKIP_BUILD:-0}" != "1" ]; then
  echo "Building iOS app (Release)..."
  xcodebuild \
    -workspace ios/HeroStack.xcworkspace \
    -scheme HeroStack \
    -configuration Release \
    -sdk iphonesimulator \
    -derivedDataPath ios/build \
    RCT_NO_LAUNCH_PACKAGER=1 \
    FORCE_BUNDLING=1 \
    > "$BUILD_LOG_PATH" 2>&1
fi

if [ ! -d "$APP_PATH" ]; then
  echo "Missing built app at $APP_PATH" >&2
  echo "If build failed, check: $BUILD_LOG_PATH" >&2
  exit 1
fi

UDID="$(
  xcrun simctl list devices available \
    | grep -F "$DEVICE_NAME" \
    | sed -nE 's/.*\(([0-9A-F-]+)\).*/\1/p' \
    | head -n 1
)"

if [ -z "$UDID" ]; then
  echo "Unable to find an available simulator named \"$DEVICE_NAME\"." >&2
  exit 1
fi

xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1 || true
open -a Simulator --args -CurrentDeviceUDID "$UDID" >/dev/null 2>&1 || true

# Always reinstall to keep runs isolated.
xcrun simctl uninstall "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$APP_PATH"

maestro test --device "$UDID" --env MAESTRO_TODO_SUFFIX="$TODO_SUFFIX" "$FLOW_PATH"
