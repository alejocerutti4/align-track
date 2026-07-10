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
        brand: {
          bg: {
            light: '#F4F4F6',
            dark: '#09090B',
          },
          card: {
            light: '#FFFFFF',
            dark: '#18181B',
          },
          border: {
            light: '#E4E4E7',
            dark: '#27272A',
          },
          accent: {
            light: '#18181B',
            dark: '#F4F4F5',
          },
          green: {
            DEFAULT: '#10B981',
            light: '#D1FAE5',
            dark: '#064E3B',
          },
          orange: {
            DEFAULT: '#F97316',
            light: '#FFEDD5',
            dark: '#7C2D12',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tcstandard: '0.2px',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.98)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
