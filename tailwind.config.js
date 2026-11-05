/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./apps/web/src/**/*.{js,ts,jsx,tsx,mdx}', './packages/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#0a0b0d', // Deepest background
          900: '#121418', // Primary background
          850: '#181b21', // Surface card background
          800: '#20242c', // Panel background
          700: '#2c323d', // Borders
          600: '#424a59',
          400: '#8c95a6',
          200: '#d0d5dd'
        },
        orange: {
          accent: '#ff5c00', // Futuristic Orange
          hover: '#e04f00',
          subtle: 'rgba(255, 92, 0, 0.12)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
