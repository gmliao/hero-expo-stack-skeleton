#!/usr/bin/env bash
# Kill processes on dev ports so `bun run dev` starts clean.
# Ports: Auth 9099, Firestore 8080, Functions 5001, Emulator UI 4000, Expo 8081.
set -euo pipefail

for port in 9099 8080 5001 4000 8081; do
  if lsof -ti:"$port" >/dev/null 2>&1; then
    echo "[kill-dev-ports] Killing process on port $port"
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  fi
done
echo "[kill-dev-ports] Done"
