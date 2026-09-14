import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6de',
          300: '#5cecc9',
          400: '#2dd4af',
          500: '#2A9D8F',
          600: '#238276',
          700: '#1c6760',
          800: '#154c4a',
          900: '#0d3131',
        },
        coral: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd0c1',
          300: '#ffb09a',
          400: '#ff8a6b',
          500: '#E76F51',
          600: '#d4573a',
          700: '#b04128',
          800: '#8c2f1b',
          900: '#681f10',
        },
        charcoal: {
          DEFAULT: '#1A1A1A',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#1A1A1A',
          700: '#111111',
          800: '#0a0a0a',
          900: '#050505',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config