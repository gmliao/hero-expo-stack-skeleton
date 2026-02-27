import { primitiveTokens } from '@/ui/theme/tokens'

const light = {
  bg: primitiveTokens.colors.slate100,
  surface: primitiveTokens.colors.white,
  text: primitiveTokens.colors.slate900,
  muted: primitiveTokens.colors.slate500,
  primary: primitiveTokens.colors.blue600,
  danger: primitiveTokens.colors.red600,
  success: primitiveTokens.colors.green600,
  border: primitiveTokens.colors.slate300,
  focus: primitiveTokens.colors.gold500,
} as const

const dark = {
  bg: primitiveTokens.colors.navy950,
  surface: primitiveTokens.colors.slate900,
  text: primitiveTokens.colors.slate100,
  muted: primitiveTokens.colors.slate300,
  primary: primitiveTokens.colors.blue500,
  danger: primitiveTokens.colors.red600,
  success: primitiveTokens.colors.green600,
  border: primitiveTokens.colors.slate700,
  focus: primitiveTokens.colors.gold500,
} as const

export const semanticColors = {
  light,
  dark,
} as const

