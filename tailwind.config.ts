import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',
        'teal-accent': '#2dd4bf',
        'teal-primary': '#0f766e',
        'teal-hover': '#0d9488',
        'teal-light': '#ccfbf1',
        'main-bg': '#f0fdf4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
