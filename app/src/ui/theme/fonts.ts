import { createFont } from 'tamagui'

export const interFont = createFont({
  family: 'Inter',
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 32 },
  lineHeight: { 1: 16, 2: 20, 3: 24, 4: 26, 5: 28, 6: 32, 7: 40 },
  weight: { 4: '400', 5: '400', 6: '700', 7: '700' },
  face: {
    400: { normal: 'Inter' },
    700: { normal: 'InterBold' },
  },
  letterSpacing: { 4: 0, 7: -0.5 },
})
