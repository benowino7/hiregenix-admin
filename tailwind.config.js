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
        theme_color: '#0097A7',
        background: '#FAFBFC',
        sidebar: '#FFF',
        dark: {
          theme_color: '#0097A7',
          background: '#1E1E1E',
          sidebar: '#111827',
        },
      }
    },
  },
  plugins: [],
}
