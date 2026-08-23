import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mxHome: resolve(__dirname, 'mx/index.html'),
        mxEventos: resolve(__dirname, 'mx/eventos.html'),
        mxInscripcion: resolve(__dirname, 'mx/inscripcion.html'),
        mxReglamento: resolve(__dirname, 'mx/reglamento.html'),
        mxResultados: resolve(__dirname, 'mx/resultados.html'),
        enduroHome: resolve(__dirname, 'enduro/index.html'),
        enduroEventos: resolve(__dirname, 'enduro/eventos.html'),
        enduroInscripcion: resolve(__dirname, 'enduro/inscripcion.html'),
        enduroReglamento: resolve(__dirname, 'enduro/reglamento.html'),
        enduroResultados: resolve(__dirname, 'enduro/resultados.html'),
        admin: resolve(__dirname, 'panel-autocolombiana-gestion-2026.html'),
        adminLegacyRedirect: resolve(__dirname, 'panel-minicross-gestion-2026.html'),
        // Redirecciones de URLs antiguas en la raíz
        legacyEventos: resolve(__dirname, 'eventos.html'),
        legacyInscripcion: resolve(__dirname, 'inscripcion.html'),
        legacyReglamento: resolve(__dirname, 'reglamento.html'),
        legacyResultados: resolve(__dirname, 'resultados.html'),
      },
    },
  },
});
