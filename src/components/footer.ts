import { renderAlliesBar } from './allies';

const DEVELOPER_LINK = 'https://www.linkedin.com/in/dev-mauricio-sanchez/';

export function renderFooter(): string {
  const year = new Date().getFullYear();
  return `
    ${renderAlliesBar()}
    <footer class="border-t border-white/10 bg-surface-raised">
      <div class="mx-auto max-w-7xl px-4 py-8 text-center">
        <img src="./logo-copa.png" alt="Copa Autocolombiana de Clubes MX" class="h-10 w-auto mx-auto mb-4 opacity-90 object-contain" />
        <p class="font-title text-xl tracking-wider text-white mb-1">Copa Autocolombiana de Clubes MX</p>
        <p class="text-sm text-muted mb-5">Motocross · Válidas oficiales · Inscripciones en línea</p>
        <div class="flex flex-wrap justify-center gap-4 mb-6 text-sm font-semibold">
          <a href="./eventos.html" class="text-silver hover:text-white transition-colors">Eventos</a>
          <span class="text-gray-metal">|</span>
          <a href="./inscripcion.html" class="text-silver hover:text-white transition-colors">Inscripción</a>
          <span class="text-gray-metal">|</span>
          <a href="./reglamento.html" class="text-silver hover:text-white transition-colors">Reglamento</a>
        </div>
        <p class="text-xs text-muted">© ${year} Copa Autocolombiana · Developed by <a href="${DEVELOPER_LINK}" target="_blank" rel="noopener noreferrer" class="text-silver hover:text-white hover:underline">Mauricio Sánchez Aguilar</a></p>
      </div>
    </footer>`;
}
