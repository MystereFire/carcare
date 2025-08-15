/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff'
        }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
