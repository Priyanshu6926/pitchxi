/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cricket: {
          pitch: '#0d1f14',
          grass: '#15803d',
          crease: '#f8fafc',
          stumps: '#eab308'
        },
        pitch: {
          900: '#070c14',
          800: '#0d1522',
          700: '#142033',
          600: '#1f2e47',
          accent: '#10b981',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
