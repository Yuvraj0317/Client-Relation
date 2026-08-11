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
        mono: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#CCCCCC',
          400: '#999999',
          500: '#777777',
          600: '#555555',
          700: '#333333',
          800: '#222222',
          850: '#181818',
          900: '#111111',
          920: '#0D0D0D',
          950: '#050505',
          black: '#000000',
          white: '#FFFFFF',
        },
        surface: {
          dark: '#050505',
          cardDark: '#0D0D0D',
          borderDark: '#222222',
          light: '#F5F5F5',
          cardLight: '#FFFFFF',
          borderLight: '#E5E5E5',
        },
      },
    },
  },
  plugins: [],
}
