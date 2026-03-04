/**
 * Single source of truth for design tokens (Pen-aligned).
 * Consumed by: tailwind.config.ts, tokens.ts, semantic.ts
 * See: docs/design-system/color-scheme.md
 */
const colors = {
  bg: '#F0FDFA',
  surface: '#FFFFFF',
  text: '#134E4A',
  muted: '#0F766E',
  primary: '#0D9488',
  primarySoft: '#CCFBF1',
  danger: '#ef4444',
  success: '#16A34A',
  border: '#99f6e4',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.6)',
  focus: '#D4A017',
}

const tagPalette = {
  tagTeal: { bg: '#CCFBF1', text: '#115E59', border: '#5EEAD4' },
  tagBlue: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  tagGreen: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  tagAmber: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  tagRose: { bg: '#FFE4E6', text: '#BE123C', border: '#FDA4AF' },
}

const radii = {
  sm: 8,
  md: 12,
  lg: 16,
}

/** Spacing scale (numbers, px). Tailwind gets via spacingPx getter. */
const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
}

/** Font size [px, lineHeight] for Tailwind; numbers for app from typographyBody */
const typographyBody = { sm: 14, md: 16, lg: 18, xl: 22 }
const fontSize = {
  sm: ['14px', '20px'],
  md: ['16px', '22px'],
  lg: ['18px', '24px'],
  xl: ['22px', '30px'],
}

/** Tailwind theme.extend.colors (primary-soft for class name) */
const tailwindColors = { ...colors, 'primary-soft': colors.primarySoft }

/** Tailwind theme.extend.spacing: spacing as px strings */
const spacingPx = Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`]))

module.exports = {
  colors,
  tagPalette,
  tailwindColors,
  radii,
  spacing,
  spacingPx,
  typographyBody,
  fontSize,
  /** Tailwind theme.extend.borderRadius: radii as px strings */
  get borderRadius() {
    return Object.fromEntries(Object.entries(radii).map(([k, v]) => [k, `${v}px`]))
  },
}
