/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce7ff',
          200: '#bcd0ff',
          300: '#8db0fe',
          400: '#5c85fc',
          500: '#3d5ef8',
          600: '#2c3eec',
          700: '#2230d0',
          800: '#2029a8',
          900: '#1e2784',
          950: '#141751',
        },
      },
    },
  },
  plugins: [],
}
