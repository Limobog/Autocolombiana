import { renderAlliesBar } from './allies';
import { getActiveChampionship } from '../championships';
import { asset, isChampionshipSite } from '../utils/site-context';

const DEVELOPER_LINK = 'https://www.linkedin.com/in/dev-mauricio-sanchez/';

export function renderFooter(): string {
  const year = new Date().getFullYear();
  const champ = getActiveChampionship();
  const generalHome = isChampionshipSite() ? '../index.html' : './index.html';
  const siteLinks = isChampionshipSite()
    ? `
          <a href="./eventos.html" class="text-silver hover:text-white transition-colors">Eventos</a>
          <span class="text-gray-metal">|</span>
          <a href="./inscripcion.html" class="text-silver hover:text-white transition-colors">Inscripción</a>
          <span class="text-gray-metal">|</span>
          <a href="./reglamento.html" class="text-silver hover:text-white transition-colors">Reglamento</a>
          <span class="text-gray-metal">|</span>
          <a href="${generalHome}" class="text-silver hover:text-white transition-colors">Inicio general</a>`
    : `
          <a href="${generalHome}" class="text-silver hover:text-white transition-colors">Inicio</a>`;

  return `
    ${renderAlliesBar()}
    <footer class="border-t border-white/10 bg-surface-raised">
      <div class="mx-auto max-w-7xl px-4 py-8 text-center">
        <img src="${asset(champ.logo)}" alt="${champ.name}" class="h-10 w-auto mx-auto mb-4 opacity-90 object-contain" />
        <p class="font-title text-xl tracking-wider text-white mb-1">${isChampionshipSite() ? champ.name : 'Copa Autocolombiana'}</p>
        <p class="text-sm text-muted mb-5">${
          isChampionshipSite()
            ? `${champ.id === 'mx' ? 'Motocross · Válidas oficiales' : 'Enduro · Ediciones oficiales'} · Inscripciones en línea`
            : 'Motocross · Enduro · Inscripciones en línea'
        }</p>
        <div class="flex flex-wrap justify-center gap-4 mb-6 text-sm font-semibold">
          ${siteLinks}
        </div>
        <p class="text-xs text-muted">© ${year} Copa Autocolombiana · Developed by <a href="${DEVELOPER_LINK}" target="_blank" rel="noopener noreferrer" class="text-silver hover:text-white hover:underline">Mauricio Sánchez Aguilar</a></p>
      </div>
    </footer>`;
}
