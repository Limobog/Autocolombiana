/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './eventos.html', './inscripcion.html', './panel-minicross-gestion-2026.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        foreground: '#F0F0F0',
        silver: '#C8C8C8',
        secondary: '#9CA3AF',
        muted: '#8A8A8A',
        surface: '#0A0A0A',
        'surface-raised': '#141414',
        'surface-elevated': '#1C1C1C',
        'gray-metal': '#3A3A3A',
        'gray-dark': '#222222',
      },
      fontFamily: {
        title: ['"Bebas Neue"', 'Oswald', 'Anton', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 40px rgba(255, 255, 255, 0.06)',
        glow: '0 0 40px rgba(255, 255, 255, 0.08)',
        'glow-strong': '0 0 60px rgba(255, 255, 255, 0.14)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
