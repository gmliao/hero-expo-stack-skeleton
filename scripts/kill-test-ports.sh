#!/usr/bin/env bash
# Kill stale ports used by backend integration tests and web E2E runs.
# Mode-aware: can target dev emulators, e2e emulators, or both.
#
# Usage:
#   bash scripts/kill-test-ports.sh             # kill dev + backend + e2e (default, CI-safe)
#   bash scripts/kill-test-ports.sh dev         # kill dev-only emulator ports
#   bash scripts/kill-test-ports.sh backend     # kill backend-integration-test emulator ports
#   bash scripts/kill-test-ports.sh e2e         # kill e2e-only emulator ports
#
# Ports (each env has its own hub/logging to avoid killing a running dev server):
# - Dev:     auth 9099, firestore 8080, functions 5001, ui 4000, hub 4400, logging 4500
# - Backend: auth 9399, firestore 8280, functions 5021, ui 4020, hub 4420, logging 4520
# - E2E:     auth 9199, firestore 8180, functions 5011, ui 4010, hub 4410, logging 4510
# - Always:  8099

set -euo pipefail

mode="${1:-all}"

# Hub and logging ports are explicitly set per-environment in firebase.*.json
# to prevent cross-environment port collisions when dev is running alongside tests.
dev_ports=(9099 8080 5001 4000 4400 4500)
backend_ports=(9399 8280 5021 4020 4420 4520)
e2e_ports=(9199 8180 5011 4010 4410 4510)
always_ports=(8099)

ports=()

case "$mode" in
  dev)
    ports=("${dev_ports[@]}" "${always_ports[@]}")
    ;;
  backend)
    ports=("${backend_ports[@]}" "${always_ports[@]}")
    ;;
  e2e)
    ports=("${e2e_ports[@]}" "${always_ports[@]}")
    ;;
  all)
    ports=("${dev_ports[@]}" "${backend_ports[@]}" "${e2e_ports[@]}" "${always_ports[@]}")
    ;;
  *)
    echo "[kill-test-ports] Unknown mode '$mode' (expected: dev|backend|e2e|all)" >&2
    exit 1
    ;;
esac

for port in "${ports[@]}"; do
  if lsof -ti:"$port" >/dev/null 2>&1; then
    echo "[kill-test-ports:$mode] Killing process on port $port"
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  fi
done

# Brief wait so OS releases ports before emulators:exec
sleep 2
echo "[kill-test-ports:$mode] Done"
