#!/usr/bin/env bash

set -euo pipefail

FLOW_PATH="${1:-maestro/flows/todo-smoke.yaml}"
DEVICE_NAME="${MAESTRO_IOS_DEVICE_NAME:-iPhone 17}"
BUNDLE_ID="${MAESTRO_IOS_BUNDLE_ID:-com.example.herostack}"
APP_PATH="ios/build/Build/Products/Release-iphonesimulator/HeroStack.app"
TODO_SUFFIX="${MAESTRO_TODO_SUFFIX:-$(date +%s)}"
BUILD_LOG_PATH="/tmp/maestro-ios-build-release.log"

# Run pod install only when Pods are missing or out of sync with Podfile.lock (same check Xcode uses).
if [ "${MAESTRO_SKIP_POD_INSTALL:-0}" != "1" ]; then
  NEED_POD_INSTALL=
  if [ ! -f "ios/Pods/Manifest.lock" ]; then
    NEED_POD_INSTALL=1
  elif ! cmp -s ios/Podfile.lock ios/Pods/Manifest.lock 2>/dev/null; then
    NEED_POD_INSTALL=1
  fi
  if [ -n "${NEED_POD_INSTALL:-}" ]; then
    echo "CocoaPods out of sync or not installed. Running pod install..."
    pushd ios >/dev/null
    pod install
    popd >/dev/null
  fi
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install via: curl -Ls \"https://get.maestro.mobile.dev\" | bash" >&2
  exit 1
fi

if [ ! -f "$FLOW_PATH" ]; then
  echo "Flow file not found: $FLOW_PATH" >&2
  exit 1
fi

# Skip build if app already exists (faster re-runs). Use MAESTRO_FORCE_BUILD=1 to always rebuild.
if [ "${MAESTRO_SKIP_BUILD:-0}" = "1" ]; then
  :
elif [ -d "$APP_PATH" ] && [ "${MAESTRO_FORCE_BUILD:-0}" != "1" ]; then
  echo "Using existing build at $APP_PATH (set MAESTRO_FORCE_BUILD=1 to rebuild)"
elif true; then
  echo "Building iOS app (Release)..."
  XCODE_ARGS=(
    -workspace ios/HeroStack.xcworkspace
    -scheme HeroStack
    -configuration Release
    -sdk iphonesimulator
    -derivedDataPath ios/build
  )
  set +e
  if command -v xcbeautify >/dev/null 2>&1; then
    xcodebuild "${XCODE_ARGS[@]}" RCT_NO_LAUNCH_PACKAGER=1 FORCE_BUNDLING=1 2>&1 | xcbeautify
  else
    xcodebuild "${XCODE_ARGS[@]}" RCT_NO_LAUNCH_PACKAGER=1 FORCE_BUNDLING=1
    echo "Tip: install xcbeautify for prettier build output: brew install xcbeautify" >&2
  fi
  xcode_ret=${PIPESTATUS[0]:-$?}
  set -e
  [ "$xcode_ret" -eq 0 ] || exit "$xcode_ret"
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
