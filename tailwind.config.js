/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#1a1a1a',
          800: '#2a2a2a',
          700: '#3a3a3a',
          600: '#4a4a4a',
          500: '#5a5a5a',
          400: '#6a6a6a',
          300: '#7a7a7a',
          200: '#8a8a8a',
          100: '#9a9a9a',
        },
      },
    },
  },
  plugins: [],
};