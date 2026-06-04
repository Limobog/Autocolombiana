/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './eventos.html', './inscripcion.html', './panel-minicross-gestion-2026.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        secondary: '#0038A8',
        accent: '#F4D000',
        red: '#D91E18',
        dark: '#2B2B2B',
        'gray-metal': '#BFC3C7',
        'gray-light': '#EAEAEA',
        'yellow-light': '#FFE766',
        'red-dark': '#8B0000',
        'blue-dark': '#001F5C',
      },
      fontFamily: {
        title: ['"Bebas Neue"', 'Oswald', 'Anton', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 18px rgba(0, 56, 168, 0.3)',
        'glow-yellow': '0 0 18px rgba(244, 208, 0, 0.25)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
