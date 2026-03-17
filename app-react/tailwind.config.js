/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F3EF',
        foreground: '#2E2A27',
        card: '#FFFDFB',
        border: '#E9E1DA',
        sage: {
          100: '#E8EFEA',
          300: '#B7C7BC',
          500: '#7A9A87',
          700: '#4D6A58'
        },
        rose: {
          100: '#FBEAEC',
          300: '#E7BEC5',
          500: '#CC8C9A',
          700: '#9E6170'
        },
        sand: '#EDE3D7'
      },
      boxShadow: {
        premium: '0 10px 30px rgba(63, 44, 31, 0.08)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    },
  },
  plugins: [],
}
