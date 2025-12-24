/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006738',
        secondary: '#FDD000',
        background: '#F7F7F7',
        surface: '#FFFFFF',
        lightGreen: '#E6F4EA',
        lightYellow: '#FFF9E6',
      },
    },
  },
  plugins: [],
};

