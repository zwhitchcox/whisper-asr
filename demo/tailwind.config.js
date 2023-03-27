module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'media',
  theme: {
    extend: {
      backgroundColor: {
        'pastel-blue': '#23903d',
        'pastel-red': '#e66767',
      },
      textColor: {
        'pastel-blue': '#84a9c0',
        'pastel-red': '#e66767',
      },
    },
  },
  variants: {},
  plugins: [],
};

