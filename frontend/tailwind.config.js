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
        charcoal: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#0f1626',
          800: '#141d31',
          700: '#1e2942',
          600: '#2d3b5b',
        },
        graphite: {
          900: '#111318',
          800: '#1a1d24',
          700: '#262a34',
          600: '#383e4d',
        },
        electric: {
          cyan: '#00f2fe',
          violet: '#8a2be2',
          purple: '#a855f7',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 242, 254, 0.25)',
        'glow-violet': '0 0 20px -3px rgba(138, 43, 226, 0.25)',
      }
    },
  },
  plugins: [],
}
