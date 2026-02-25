#!/usr/bin/env bash
set -euo pipefail

bash scripts/firebase/check-project.sh
cd backend/firebase
bunx firebase "$@"
