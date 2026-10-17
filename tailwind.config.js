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
        forest: {
          950: '#051F20', // Deep Forest Green
          900: '#0B2B26', // Dark Teal Green
          850: '#10332C',
          800: '#163832', // Forest Green
          700: '#235347', // Emerald Green
          600: '#2D6A5B',
          500: '#779886', // Muted text with readable contrast on forest surfaces
          400: '#8EB69B', // Sage Mint
          300: '#B0CEB9',
          200: '#C7E2CE',
          100: '#DAF1DE', // Pale Mint
          50: '#F4FAF6',  // Light Mode Mint-White
        },
        mint: {
          500: '#52796F',
          400: '#8EB69B', // Sage Mint
          300: '#B0CEB9',
          200: '#C7E2CE',
          100: '#DAF1DE', // Pale Mint
          50: '#F4FAF6',
        },
        navy: {
          950: '#051F20', // Mapped to Deep Forest Green
          900: '#0B2B26', // Mapped to Dark Teal Green
          850: '#10332C', // Mapped to Elevated Forest
          800: '#163832', // Mapped to Forest Green
          700: '#235347', // Mapped to Emerald Green
          600: '#2D6A5B',
        },
        brand: {
          forest: '#051F20',
          teal: '#0B2B26',
          emerald: '#235347',
          mint: '#8EB69B',
          pale: '#DAF1DE',
          blue: '#8EB69B',   // Harmonized with Sage Mint
          violet: '#235347', // Harmonized with Emerald Green
          cyan: '#8EB69B',   // Harmonized with Sage Mint
          accent: '#235347',
        },
        surface: {
          dark: 'rgba(22, 56, 50, 0.65)',
          darkHover: 'rgba(35, 83, 71, 0.75)',
          darkBorder: 'rgba(218, 241, 222, 0.14)',
          darkBorderHighlight: 'rgba(218, 241, 222, 0.35)',
          light: 'rgba(255, 255, 255, 0.88)',
          lightHover: 'rgba(244, 250, 246, 0.98)',
          lightBorder: 'rgba(35, 83, 71, 0.16)',
          lightBorderHighlight: 'rgba(35, 83, 71, 0.4)',
        }
      },
      backgroundImage: {
        'gradient-forest': 'linear-gradient(145deg, #051F20 0%, #0B2B26 45%, #163832 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #0B2B26 0%, #163832 45%, #235347 100%)',
        'gradient-mint': 'linear-gradient(135deg, #8EB69B 0%, #DAF1DE 100%)',
        'gradient-accent': 'linear-gradient(120deg, #051F20 0%, #163832 55%, #235347 100%)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '18px',
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.18)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-glow': '0 0 25px -5px rgba(35, 83, 71, 0.45)',
        'glass-glow-lg': '0 0 45px -5px rgba(142, 182, 155, 0.35)',
        'glass-mint': '0 0 20px -3px rgba(218, 241, 222, 0.25)',
        'light-glass': '0 8px 32px 0 rgba(5, 31, 32, 0.08)',
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
  plugins: [
    // `light:` is used throughout the UI alongside the `html.light` theme class.
    // Tailwind only provides `dark:` by default, so register the matching variant.
    function ({ addVariant }) {
      addVariant('light', '.light &')
    },
  ],
}
