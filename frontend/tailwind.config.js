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
        obsidian: {
          950: '#090a0d',
          900: '#0e1015',
          850: '#13161d',
          800: '#191d26',
          700: '#232936',
          600: '#323a4c',
          500: '#47536b',
        },
        graphite: {
          950: '#0d0d0f',
          900: '#141418',
          800: '#1c1c22',
          700: '#282830',
          600: '#383844',
        },
        laser: {
          cyan: '#38bdf8',
          teal: '#2dd4bf',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          violet: '#818cf8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.015em',
        widest: '0.12em',
      },
    },
  },
  plugins: [],
}
