/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './eventos.html', './inscripcion.html', './panel-minicross-gestion-2026.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        ink: '#0A0A0A',
        foreground: '#E8E8E8',
        accent: '#F4D000',
        red: '#D91E18',
        secondary: '#D91E18',
        muted: '#A3A3A3',
        surface: '#1A1A1A',
        'surface-raised': '#262626',
        'surface-warm': '#242220',
        'surface-soft': '#2A2220',
        'gray-light': '#A3A3A3',
        'gray-metal': '#404040',
        'yellow-light': '#FFE766',
        'red-dark': '#B01812',
        dark: '#141414',
      },
      fontFamily: {
        title: ['"Bebas Neue"', 'Oswald', 'Anton', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 8px 28px rgba(217, 30, 24, 0.2)',
        'glow-yellow': '0 4px 20px rgba(244, 208, 0, 0.25)',
        'glow-red': '0 4px 20px rgba(217, 30, 24, 0.25)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
