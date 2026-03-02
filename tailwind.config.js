/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'brand-purple': {
          DEFAULT: '#3d1c47',
          light: '#6a327b',
          dark: '#241029'
        },
        'brand-gold': {
          DEFAULT: '#d4af37',
          light: '#e6c86a',
          dark: '#9a7f28'
        },
        'brand-white': '#f8f9fa'
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif']
      }
    }
  },
  plugins: []
};
