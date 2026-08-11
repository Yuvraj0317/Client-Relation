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
        apple: {
          blue: '#0071E3',
          blueHover: '#0077ED',
          blueDark: '#0058B0',
        },
        surface: {
          dark: '#050505',
          cardDark: '#0B0B0B',
          borderDark: '#242424',
          light: '#F5F5F5',
          cardLight: '#FFFFFF',
          borderLight: '#E5E5E5',
        },
      },
    },
  },
  plugins: [],
}
