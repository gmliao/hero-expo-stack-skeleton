import { primitiveTokens } from "@/ui/theme/tokens";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const designTokens = require("./design-tokens.js");

/** Light theme from single source (design-tokens.js, Pen-aligned) */
const light = designTokens.colors;

const dark = {
  bg: primitiveTokens.colors.navy950,
  surface: primitiveTokens.colors.slate700,
  text: primitiveTokens.colors.slate100,
  muted: primitiveTokens.colors.slate300,
  primary: primitiveTokens.colors.blue500,
  // primarySoft: no dark-specific design; reuse light value (used by checkbox, tag badge)
  primarySoft: "#CCFBF1",
  danger: primitiveTokens.colors.red600,
  success: primitiveTokens.colors.green600,
  border: primitiveTokens.colors.slate700,
  // white: pure white is intentional (inverse text, input bg) — same in both modes
  white: primitiveTokens.colors.white,
  // overlay: modal backdrop — same in both modes
  overlay: primitiveTokens.colors.overlay60,
  focus: primitiveTokens.colors.gold500,
} as const;

export const semanticColors = {
  light,
  dark,
} as const;
