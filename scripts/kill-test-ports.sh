#!/usr/bin/env bash
# Kill stale ports used by backend integration tests and web E2E runs.
# Includes: auth/firestore/functions (default + e2e), UI, emulator hub, logging.
set -euo pipefail

# Default: auth 9099, firestore 8080, functions 5001, ui 4000
# E2E:     auth 9199, firestore 8180, functions 5011, ui 4010
# Hub 4400, logging 4500 (avoid "multiple instances" / "unable to start on port")
for port in 9099 8080 5001 4000 9199 8180 5011 4010 8099 4400 4401 4500 4501; do
  if lsof -ti:"$port" >/dev/null 2>&1; then
    echo "[kill-test-ports] Killing process on port $port"
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  fi
done

# Brief wait so OS releases ports before emulators:exec
sleep 2
echo "[kill-test-ports] Done"
