/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
        },
        advisory: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        flow: {
          DEFAULT: '#059669',
          hover: '#047857',
        },
      },
    },
  },
  plugins: [],
};
