module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(9, 10, 21)', // main background
        secondary: '#16a394', // accent color
        uiText: '#ffffff'
      }
    },
  },
  plugins: [],
};
