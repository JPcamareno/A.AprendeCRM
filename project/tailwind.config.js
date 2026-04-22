/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f9',
          100: '#cceff3',
          200: '#99dfe7',
          300: '#66cfdb',
          400: '#33bfcf',
          500: '#007991', // Principal
          600: '#006174',
          700: '#004957',
          800: '#00303a',
          900: '#00181d',
        },
        secondary: {
          50: '#f0fffe',
          100: '#d4fffa',
          200: '#a9fff5',
          300: '#78ffd6', // Turquesa brillante
          400: '#4dffcb',
          500: '#00d4aa',
          600: '#00a896',
          700: '#007d71',
          800: '#00534c',
          900: '#002a27',
        },
        accent: {
          teal: '#007991',
          turquoise: '#78ffd6',
          mint: '#00d4aa',
          ocean: '#00a896',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};