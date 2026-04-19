/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wysa-green': '#567357',
        'wysa-pink':  '#F9F0ED',
        'wysa-coral': '#E58889',
        'brand-blue': '#E58889',
      },
    },
  },
  plugins: [],
}