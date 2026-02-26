#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

is_emulator_command() {
  [[ "${1:-}" == emulators:* || "${1:-}" == emulators ]]
}

is_projectless_command() {
  local first="${1:-}"

  if [[ -z "${first}" ]]; then
    return 0
  fi

  case "${first}" in
    --help|-h|help|--version|-V|login|login:list|logout|projects:list|projects:create)
      return 0
      ;;
  esac

  return 1
}

has_project_arg() {
  local arg
  for arg in "$@"; do
    if [[ "${arg}" == "--project" || "${arg}" == --project=* ]]; then
      return 0
    fi
  done
  return 1
}

if is_emulator_command "${1:-}"; then
  bash "${ROOT_DIR}/scripts/firebase/check-project.sh"
  cd "${ROOT_DIR}/backend/firebase"
  bunx firebase "$@"
  exit 0
fi

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT_DIR}/.env"
  set +a
fi

if has_project_arg "$@"; then
  cd "${ROOT_DIR}/backend/firebase"
  bunx firebase "$@"
  exit 0
fi

if is_projectless_command "${1:-}"; then
  cd "${ROOT_DIR}/backend/firebase"
  bunx firebase "$@"
  exit 0
fi

if [[ -z "${FIREBASE_PROJECT_ID:-}" || "${FIREBASE_PROJECT_ID}" == "hero-stack-local" ]]; then
  echo "[ERROR] FIREBASE_PROJECT_ID is not set for cloud Firebase commands."
  echo "        Run: bash scripts/firebase/setup-cloud-project.sh <your-project-id>"
  echo "        Example: bash scripts/firebase/setup-cloud-project.sh hero-stack-dev-001"
  exit 1
fi

cd "${ROOT_DIR}/backend/firebase"
bunx firebase --project "${FIREBASE_PROJECT_ID}" "$@"
