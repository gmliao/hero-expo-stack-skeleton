#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
EXAMPLE_FILE="${ROOT_DIR}/.env.example"

usage() {
  echo "Usage: bash scripts/firebase/setup-cloud-project.sh <firebase-project-id>"
  echo "Example: bash scripts/firebase/setup-cloud-project.sh hero-stack-dev-001"
}

if [[ $# -gt 1 ]]; then
  usage
  exit 1
fi

PROJECT_ID="${1:-}"

if [[ -z "${PROJECT_ID}" ]]; then
  if [[ -t 0 ]]; then
    read -r -p "Enter Firebase cloud project id: " PROJECT_ID
  fi
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "[ERROR] Missing project id."
  usage
  exit 1
fi

if [[ "${PROJECT_ID}" == "hero-stack-local" ]]; then
  echo "[ERROR] 'hero-stack-local' is reserved for local emulators only."
  exit 1
fi

if [[ ! "${PROJECT_ID}" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
  echo "[ERROR] Invalid Firebase project id format: ${PROJECT_ID}"
  echo "        Must match: ^[a-z][a-z0-9-]{4,28}[a-z0-9]$"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
  echo "[INFO] Created .env from .env.example"
fi

tmp_file="${ENV_FILE}.tmp"
awk -v project_id="${PROJECT_ID}" '
BEGIN {
  saw_project = 0
  saw_public_project = 0
  saw_auth_domain = 0
  saw_public_auth_domain = 0
  saw_storage_bucket = 0
}
{
  if ($0 ~ /^FIREBASE_PROJECT_ID=/) {
    print "FIREBASE_PROJECT_ID=" project_id
    saw_project = 1
  } else if ($0 ~ /^EXPO_PUBLIC_FIREBASE_PROJECT_ID=/) {
    print "EXPO_PUBLIC_FIREBASE_PROJECT_ID=" project_id
    saw_public_project = 1
  } else if ($0 ~ /^FIREBASE_AUTH_DOMAIN=/) {
    print "FIREBASE_AUTH_DOMAIN=" project_id ".firebaseapp.com"
    saw_auth_domain = 1
  } else if ($0 ~ /^EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=/) {
    print "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=" project_id ".firebaseapp.com"
    saw_public_auth_domain = 1
  } else if ($0 ~ /^FIREBASE_STORAGE_BUCKET=/) {
    print "FIREBASE_STORAGE_BUCKET=" project_id ".appspot.com"
    saw_storage_bucket = 1
  } else {
    print $0
  }
}
END {
  if (!saw_project) print "FIREBASE_PROJECT_ID=" project_id
  if (!saw_public_project) print "EXPO_PUBLIC_FIREBASE_PROJECT_ID=" project_id
  if (!saw_auth_domain) print "FIREBASE_AUTH_DOMAIN=" project_id ".firebaseapp.com"
  if (!saw_public_auth_domain) print "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=" project_id ".firebaseapp.com"
  if (!saw_storage_bucket) print "FIREBASE_STORAGE_BUCKET=" project_id ".appspot.com"
}
' "${ENV_FILE}" > "${tmp_file}"

mv "${tmp_file}" "${ENV_FILE}"

echo "[DONE] Updated .env with cloud project id: ${PROJECT_ID}"
echo "       FIREBASE_PROJECT_ID=${PROJECT_ID}"
echo "       EXPO_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}"
