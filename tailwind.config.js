/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fatfx: {
          bg: '#F8F9FA',           // Clean futuristic off-white
          surface: '#FFFFFF',      // Pure surface
          'surface-subtle': '#F1F5F4', // Light subtle panel
          border: '#E2E8F0',       // Crisp border
          'border-dark': '#CBD5E1',
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#0D9488',        // Core vibrant teal
            600: '#0F766E',        // Deep teal
            700: '#115E59',
            800: '#134E4A',
            900: '#042F2E',
            glow: '#0D948840',
          },
          dark: {
            900: '#090D10',
            800: '#111820',
            700: '#1B242C',
            600: '#2E3D49',
          },
          win: {
            bg: '#DCFCE7',         // Light green for win days
            text: '#166534',
            border: '#86EFAC',
            solid: '#10B981',      // Bright green for buy signals
            bright: '#00E676',
          },
          loss: {
            bg: '#FEE2E2',        // Light red for loss days
            text: '#991B1B',
            border: '#FCA5A5',
            solid: '#EF4444',     // Bright red for sell signals
            bright: '#FF334B',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'futuristic': '0 4px 20px -2px rgba(13, 148, 136, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'futuristic-hover': '0 10px 25px -3px rgba(13, 148, 136, 0.2), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'glow-teal': '0 0 15px rgba(13, 148, 136, 0.35)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [],
}
