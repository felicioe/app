/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta extraída da identidade visual oficial (logo Thera Financial).
        brand: {
          navy: '#122641',
          'navy-light': '#1C3759',
          slate: '#575E6B',
          cream: '#D8D0C8',
          'cream-light': '#F4F1EC',
          gold: '#B08D4F',
          'gold-dark': '#8E6F3A',
        },
      },
    },
  },
  plugins: [],
};
