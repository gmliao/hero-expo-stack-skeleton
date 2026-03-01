#!/usr/bin/env bash
# Kill stale ports used by backend integration tests and web E2E runs.
set -euo pipefail

for port in 9099 8080 5001 9199 8180 5011 8099; do
  if lsof -ti:"$port" >/dev/null 2>&1; then
    echo "[kill-test-ports] Killing process on port $port"
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  fi
done

echo "[kill-test-ports] Done"
