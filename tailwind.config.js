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
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
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
          50: '#FFFDF0',
          100: '#FFF8D6',
          200: '#FFEEA3',
          300: '#FFE066',
          400: '#FFD700', // Pure Gold
          500: '#D4AF37', // Metallic Gold - PRIMARY
          600: '#B8960C',
          700: '#9A7D0A',
          800: '#7D6608',
          900: '#5C4A05',
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
        'gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        'gold-xl': '0 0 60px rgba(212, 175, 55, 0.5)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.15)',
      },
      borderColor: {
        'gold-dim': 'rgba(212, 175, 55, 0.2)',
        'gold-mid': 'rgba(212, 175, 55, 0.4)',
      },
    },
  },
  plugins: [],
}