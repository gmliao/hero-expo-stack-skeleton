#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIREBASE_DIR="${ROOT_DIR}/backend/firebase"
FIREBASERC_EXAMPLE="${FIREBASE_DIR}/.firebaserc.example"
FIREBASERC_FILE="${FIREBASE_DIR}/.firebaserc"
JAVA_BIN="/opt/homebrew/opt/openjdk/bin"

need_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "[ERROR] Missing command: ${cmd}"
    echo "        ${hint}"
    exit 1
  fi
}

echo "[1/7] Checking Homebrew"
need_cmd "brew" "Install Homebrew first: https://brew.sh"

echo "[2/7] Checking bun"
if ! command -v bun >/dev/null 2>&1; then
  echo "[INFO] Installing bun via Homebrew"
  brew install bun
fi

echo "[3/7] Checking Java (for Firebase emulators)"
if ! command -v java >/dev/null 2>&1 && [[ ! -x "${JAVA_BIN}/java" ]]; then
  echo "[INFO] Installing openjdk via Homebrew"
  brew install openjdk
fi

if [[ -x "${JAVA_BIN}/java" ]]; then
  export PATH="${JAVA_BIN}:${PATH}"
fi

need_cmd "java" "Install openjdk (brew install openjdk) and add /opt/homebrew/opt/openjdk/bin to PATH"

echo "[4/7] Verifying Firebase CLI availability via bunx"
cd "${ROOT_DIR}"
bunx firebase --version >/dev/null

echo "[5/7] Installing project dependencies"
bun install

echo "[6/7] Ensuring backend/firebase/.firebaserc exists"
if [[ ! -f "${FIREBASERC_FILE}" ]]; then
  if [[ -f "${FIREBASERC_EXAMPLE}" ]]; then
    cp "${FIREBASERC_EXAMPLE}" "${FIREBASERC_FILE}"
    echo "[INFO] Created ${FIREBASERC_FILE} from example"
  else
    echo "[ERROR] Missing ${FIREBASERC_EXAMPLE}"
    exit 1
  fi
fi

echo "[7/7] Validating Firebase project guard + emulator smoke"
bash "${ROOT_DIR}/scripts/firebase/check-project.sh"
cd "${FIREBASE_DIR}"
bunx firebase emulators:exec --project hero-stack-local --only auth,firestore,functions "node -e \"console.log('emulator-ready')\"" >/dev/null

echo "[DONE] Prerequisites are ready."
echo "       Next: cp .env.example .env && bun run dev"
