/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          DEFAULT: '#1a2e1a',
          light: '#2d4a2d',
          lighter: '#3d5c3d',
        },
        cream: {
          DEFAULT: '#fdf6e3',
          dark: '#f5e9c8',
        },
        amber: {
          food: '#d97706',
          dark: '#b45309',
        },
      },
    },
  },
  plugins: [],
}
