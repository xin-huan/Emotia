/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wysa-green':       '#567357',
        'wysa-green-light': '#7A9B7B',
        'wysa-green-pale':  '#E8F0E8',
        'wysa-pink':        '#F9F0ED',
        'wysa-cream':       '#FFF8F3',
        'wysa-coral':       '#F0A9AA',
        'wysa-coral-light': '#FAD8D9',
        'wysa-coral-deep':  '#D07A7B',
        'wysa-dark':        '#3A4A3B',
        'brand-blue':       '#E58889',
      },
    },
  },
  plugins: [],
}