/** @type {import('tailwindcss').Config} */
const designTokens = require('./src/ui/theme/design-tokens.js')

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: designTokens.tailwindColors,
      borderRadius: designTokens.borderRadius,
      spacing: designTokens.spacingPx,
      fontSize: designTokens.fontSize,
    },
  },
  plugins: [],
}
