/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#FDF8F3',
        surface: '#FFFBF7',
        text: '#4A3728',
        muted: '#8B7355',
        primary: '#7BA05B',
        'primary-soft': '#E8F0E3',
        danger: '#C45C4A',
        success: '#2D6A4F',
        border: '#E8DED5',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
      },
      fontSize: {
        sm: ['14px', '20px'],
        md: ['16px', '22px'],
        lg: ['18px', '24px'],
        xl: ['22px', '30px'],
      },
    },
  },
  plugins: [],
}
