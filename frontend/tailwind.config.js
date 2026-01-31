/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        trading: {
          // Background colors
          bg: '#0f0f0f',
          panel: '#1a1a1a',
          surface: '#151c2c',
          hover: '#1e2a3e',
          active: '#243044',

          // Border colors
          border: '#262626',
          'border-subtle': '#1e293b',
          'border-strong': '#3b4a63',

          // Text colors
          text: '#e5e5e5',
          'text-secondary': '#a3a3a3',
          'text-muted': '#64748b',

          // Accent colors - semantic
          green: '#22c55e',
          'green-light': '#10b981',
          red: '#ef4444',
          'red-light': '#ff4757',
          blue: '#3b82f6',
          cyan: '#0ea5e9',
          yellow: '#f59e0b',

          // Chart grid
          grid: '#262626',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
