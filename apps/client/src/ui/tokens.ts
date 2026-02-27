export const tokens = {
  colors: {
    bg: '#FDF8F3',
    surface: '#FFFBF7',
    text: '#4A3728',
    muted: '#8B7355',
    primary: '#7BA05B',
    primarySoft: '#E8F0E3',
    danger: '#C45C4A',
    success: '#2D6A4F',
    border: '#E8DED5',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.45)',
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  fontSize: {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
  },
} as const

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type AppComponentSize = 'sm' | 'md' | 'lg'
