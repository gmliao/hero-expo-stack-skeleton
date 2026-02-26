#!/usr/bin/env bash
set -euo pipefail

EXPECTED_PROJECT="hero-stack-local"
FIREBASERC_PATH="backend/firebase/.firebaserc"

if [[ ! -f "${FIREBASERC_PATH}" ]]; then
  echo "Missing ${FIREBASERC_PATH}. Run: cp backend/firebase/.firebaserc.example backend/firebase/.firebaserc"
  exit 1
fi

ACTIVE_PROJECT="$(sed -nE 's/.*"default"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "${FIREBASERC_PATH}" | head -n1)"

if [[ -z "${ACTIVE_PROJECT}" || "${ACTIVE_PROJECT}" != "${EXPECTED_PROJECT}" ]]; then
  echo "Expected Firebase default project: ${EXPECTED_PROJECT}, got: ${ACTIVE_PROJECT:-<empty>}"
  echo "Update ${FIREBASERC_PATH} default project before running firebase commands."
  exit 1
fi
