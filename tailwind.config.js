/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './eventos.html', './inscripcion.html', './panel-minicross-gestion-2026.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        accent: '#F4D000',
        red: '#D91E18',
        secondary: '#D91E18',
        muted: '#5C5C5C',
        surface: '#FFFFFF',
        'surface-warm': '#FFF9E6',
        'surface-soft': '#FFF5F5',
        'gray-light': '#5C5C5C',
        'gray-metal': '#D8D8D8',
        'yellow-light': '#FFE766',
        'red-dark': '#B01812',
        dark: '#FAFAFA',
      },
      fontFamily: {
        title: ['"Bebas Neue"', 'Oswald', 'Anton', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(10, 10, 10, 0.06)',
        'card-hover': '0 8px 28px rgba(217, 30, 24, 0.12)',
        'glow-yellow': '0 4px 20px rgba(244, 208, 0, 0.35)',
        'glow-red': '0 4px 20px rgba(217, 30, 24, 0.2)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
