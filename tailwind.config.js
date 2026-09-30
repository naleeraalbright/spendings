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
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        expense: {
          light: '#fef2f2',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
          badge: '#fee2e2',
        },
        income: {
          light: '#f0fdf4',
          DEFAULT: '#22c55e',
          dark: '#15803d',
          badge: '#dcfce7',
        }
      },
    },
  },
  plugins: [],
}
