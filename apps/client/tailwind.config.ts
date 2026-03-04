import type { Config } from 'tailwindcss'
import * as designTokens from './src/ui/theme/design-tokens.js'

const tailwindFontSize = designTokens.fontSize as unknown as Record<string, [string, string]>

const config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: designTokens.tailwindColors,
      borderRadius: designTokens.borderRadius,
      spacing: designTokens.spacingPx,
      fontSize: tailwindFontSize,
    },
  },
  plugins: [],
} satisfies Config

export default config
