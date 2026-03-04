// eslint-disable-next-line @typescript-eslint/no-require-imports
const designTokens = require('./theme/design-tokens.js')

/** App design tokens — single source: design-tokens.js (Pen-aligned) */
export const tokens = {
  colors: designTokens.colors,
  tagPalette: designTokens.tagPalette,
  spacing: designTokens.spacing,
  radii: designTokens.radii,
  fontSize: designTokens.typographyBody,
} as const

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
export type AppComponentSize = 'sm' | 'md' | 'lg'
