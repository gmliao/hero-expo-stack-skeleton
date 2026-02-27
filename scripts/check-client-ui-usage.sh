#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TARGETS=("apps/client/app" "apps/client/src/features")

forbidden_gluestack_imports="$(rg -n "from ['\"]@gluestack-ui/|require\(['\"]@gluestack-ui/" "${TARGETS[@]}" || true)"
if [[ -n "$forbidden_gluestack_imports" ]]; then
  echo "[check:client:ui] Forbidden direct gluestack imports found in route/feature layer:"
  echo "$forbidden_gluestack_imports"
  echo "Use '@/ui/components' wrappers instead."
  exit 1
fi

forbidden_tamagui_imports="$(rg -n "from ['\"]tamagui['\"]|from ['\"]@tamagui/|require\(['\"]tamagui['\"]|require\(['\"]@tamagui/" "${TARGETS[@]}" || true)"
if [[ -n "$forbidden_tamagui_imports" ]]; then
  echo "[check:client:ui] Forbidden Tamagui imports found in route/feature layer:"
  echo "$forbidden_tamagui_imports"
  exit 1
fi

forbidden_inline_styles="$(rg -n "style=\{\{" "${TARGETS[@]}" || true)"
if [[ -n "$forbidden_inline_styles" ]]; then
  echo "[check:client:ui] Forbidden inline style object literals found:"
  echo "$forbidden_inline_styles"
  echo "Move styles to App components, className, or StyleSheet constants."
  exit 1
fi

echo "[check:client:ui] PASS"
