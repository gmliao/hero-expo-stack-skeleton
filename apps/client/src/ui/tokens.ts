import { primitiveTokens } from '@/ui/theme/tokens'

export const tokens = {
  colors: {
    bg: primitiveTokens.colors.slate100,
    surface: primitiveTokens.colors.white,
    text: primitiveTokens.colors.slate900,
    muted: primitiveTokens.colors.slate500,
    primary: primitiveTokens.colors.blue600,
    primarySoft: primitiveTokens.colors.slate200,
    danger: primitiveTokens.colors.red600,
    success: primitiveTokens.colors.green600,
    border: primitiveTokens.colors.slate300,
    white: primitiveTokens.colors.white,
    overlay: primitiveTokens.colors.overlay60,
  },
  spacing: {
    1: primitiveTokens.spacing[1],
    2: primitiveTokens.spacing[2],
    3: primitiveTokens.spacing[3],
    4: primitiveTokens.spacing[4],
    5: primitiveTokens.spacing[5],
    6: primitiveTokens.spacing[6],
    7: primitiveTokens.spacing[7],
    8: primitiveTokens.spacing[8],
  },
  radii: primitiveTokens.radii,
  fontSize: {
    sm: primitiveTokens.typography.body.sm,
    md: primitiveTokens.typography.body.md,
    lg: primitiveTokens.typography.body.lg,
    xl: primitiveTokens.typography.body.xl,
  },
} as const

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
export type AppComponentSize = 'sm' | 'md' | 'lg'
