// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scans all HTML and JS files in the root to tree-shake unused CSS
  content: ["./*.{html,js}"], 
  theme: {
    extend: {},
  },
  plugins: [],
}