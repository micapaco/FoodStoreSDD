/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary brand — warm gold
        brand: {
          DEFAULT: '#f2ca50',
          dark: '#d4af37',
          on: '#3c2f00',
          dim: '#e9c349',
        },
        // Dark surfaces (layered depth)
        surface: {
          DEFAULT: '#0d141d',
          lowest: '#080f17',
          low: '#151c25',
          base: '#192029',
          high: '#232a34',
          higher: '#2e353f',
          bright: '#333a44',
        },
        // Text
        ink: {
          DEFAULT: '#dce3f0',
          muted: '#d0c5af',
          inverse: '#2a313b',
        },
        // Borders
        line: {
          DEFAULT: '#99907c',
          subtle: '#4d4635',
        },
        // Status — success (tertiary green)
        success: {
          DEFAULT: '#58e7aa',
          container: '#33ca90',
          on: '#003824',
        },
        // Status — danger (error)
        danger: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
          on: '#690005',
        },
        // Status — warning (reuse brand amber tones)
        warning: {
          DEFAULT: '#f2ca50',
          container: '#554300',
          on: '#241a00',
        },
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'card-sm': '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.5)',
        'dropdown': '0 10px 15px -3px rgba(0,0,0,0.6), 0 4px 6px -4px rgba(0,0,0,0.4)',
        'glow-brand': '0 0 20px rgba(242,202,80,0.15)',
      },
    },
  },
  plugins: [],
}
