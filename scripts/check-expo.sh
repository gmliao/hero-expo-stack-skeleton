#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/apps/client"

export EXPO_PUBLIC_FIREBASE_PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-hero-stack-local}"
export EXPO_PUBLIC_FIREBASE_API_KEY="${EXPO_PUBLIC_FIREBASE_API_KEY:-demo-api-key}"
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-localhost}"

run_doctor() {
  bunx expo-doctor
}

if ! doctor_output="$(run_doctor 2>&1)"; then
  if printf '%s' "$doctor_output" | grep -q "Request timed out"; then
    echo "[check:expo] expo-doctor timed out once, retrying..."
    if ! doctor_output="$(run_doctor 2>&1)"; then
      if printf '%s' "$doctor_output" | grep -q "Request timed out"; then
        echo "[check:expo] WARNING: expo-doctor schema check timed out twice; continuing with compile validation."
      else
        printf '%s\n' "$doctor_output"
        exit 1
      fi
    else
      printf '%s\n' "$doctor_output"
    fi
  else
    printf '%s\n' "$doctor_output"
    exit 1
  fi
else
  printf '%s\n' "$doctor_output"
fi

bun run build:web
