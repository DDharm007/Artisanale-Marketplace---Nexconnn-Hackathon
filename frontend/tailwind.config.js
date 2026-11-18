/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#171717',
          hover: '#262626',
        },
        accent: {
          DEFAULT: '#D6B875',
          hover: '#C5A45E',
          light: '#F7EFCF',
          dark: '#B8964B',
        },
        ivory: {
          DEFAULT: '#F5F1E8',
          dark: '#EAE4D5',
          light: '#FAF8F3',
        },
        border: {
          ivory: '#E4DEC8',
        },
        brand: {
          DEFAULT: '#171717',
          50: '#FAF8F3',
          100: '#F5F1E8',
          200: '#E4DEC8',
          300: '#D6B875',
          400: '#C5A45E',
          500: '#171717',
          600: '#171717',
          700: '#000000',
          800: '#171717',
          900: '#171717',
          gold: '#D6B875',
          ivory: '#F5F1E8',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Poppins"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
