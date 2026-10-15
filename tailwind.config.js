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
        navy: {
          950: '#060A13', // deepest background
          900: '#0A0F1D', // primary dark background
          850: '#0E162A', // card background
          800: '#141E38', // active/hover card
          700: '#1C2B4E', // subtle border / dividers
          600: '#2A3C6B', // muted text / active border
        },
        brand: {
          blue: '#3B82F6',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          accent: '#6366F1',
        },
        surface: {
          dark: 'rgba(14, 22, 42, 0.75)',
          darkHover: 'rgba(20, 30, 56, 0.85)',
          darkBorder: 'rgba(255, 255, 255, 0.08)',
          darkBorderHighlight: 'rgba(139, 92, 246, 0.3)',
          light: 'rgba(255, 255, 255, 0.85)',
          lightHover: 'rgba(248, 250, 252, 0.95)',
          lightBorder: 'rgba(226, 232, 240, 0.8)',
          lightBorderHighlight: 'rgba(99, 102, 241, 0.35)',
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'glass-glow': '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'glass-glow-lg': '0 0 40px -5px rgba(139, 92, 246, 0.3)',
        'light-glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
