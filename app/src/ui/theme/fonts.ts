import { createFont } from 'tamagui'

const size = { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 32 }
const lineHeight = { 1: 16, 2: 20, 3: 24, 4: 26, 5: 28, 6: 32, 7: 40 }

export const interFont = createFont({
  family: 'Inter',
  size,
  lineHeight,
  weight: { 4: '400', 5: '400', 6: '700', 7: '700' },
  face: {
    400: { normal: 'Inter' },
    700: { normal: 'InterBold' },
  },
  letterSpacing: { 4: 0, 7: -0.5 },
})

export const varelaRoundFont = createFont({
  family: 'Varela Round',
  size,
  lineHeight,
  weight: { 4: '400', 5: '400', 6: '400', 7: '400' },
  face: {
    400: { normal: 'Varela Round' },
    700: { normal: 'Varela Round' },
  },
  letterSpacing: { 4: 0, 7: -0.5 },
})

export const nunitoSansFont = createFont({
  family: 'Nunito Sans',
  size,
  lineHeight,
  weight: { 4: '400', 5: '400', 6: '700', 7: '700' },
  face: {
    400: { normal: 'Nunito Sans' },
    700: { normal: 'Nunito Sans Bold' },
  },
  letterSpacing: { 4: 0, 7: -0.5 },
})
