/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse-custom': 'pulse 2s infinite',
        'glow': 'glow 2s infinite',
        'gold-glow': 'goldGlow 2s ease-in-out infinite',
        'sidebar-glow': 'sidebarGlow 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        gold: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8', // Premium Light Accent
          500: '#6366f1', // Premium Indigo - PRIMARY
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        dark: {
          50: '#2A2A2A',
          100: '#222222',
          200: '#1C1C1C',
          300: '#161616',
          400: '#121212', // Main bg
          500: '#0E0E0E',
          600: '#0B0B0B', // Deep bg
          700: '#080808',
          800: '#050505',
          900: '#000000',
        },
        'rich-black': {
          DEFAULT: '#0B0B0B',
          50: '#2A2A2A',
          100: '#1C1C1C',
          200: '#141414',
          300: '#0F0F0F',
          400: '#0B0B0B',
          500: '#080808',
          600: '#050505',
          700: '#030303',
          800: '#010101',
          900: '#000000',
        }
      },
      boxShadow: {
        'gold': '0 0 20px rgba(99, 102, 241, 0.2)',
        'gold-lg': '0 0 40px rgba(99, 102, 241, 0.3)',
        'gold-xl': '0 0 60px rgba(99, 102, 241, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.1)',
      },
      borderColor: {
        'gold-dim': 'rgba(99, 102, 241, 0.15)',
        'gold-mid': 'rgba(99, 102, 241, 0.3)',
      },
    },
  },
  plugins: [],
}