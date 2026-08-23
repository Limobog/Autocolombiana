import { CHAMPIONSHIPS, type Championship } from '../championships';
import { getEnabledChampionshipCategories } from '../types';
import { asset } from '../utils/site-context';

function renderGatewayPanel(champ: Championship): string {
  return `
    <a href="./${champ.id}/index.html" class="split-panel split-panel--${champ.id}"
       aria-label="Ir a ${champ.name}">
      <div class="split-inner">
        <img src="${asset(champ.logo)}" alt="${champ.name}" class="split-logo" />
        <div>
          <p class="font-title text-3xl md:text-4xl lg:text-5xl leading-none tracking-wider text-white">
            ${champ.heroTitleHtml}
          </p>
          <p class="mt-1 font-title text-lg md:text-xl tracking-widest text-white/80">${champ.heroSubtitle}</p>
        </div>
        <p class="text-muted text-sm md:text-base leading-relaxed max-w-md hidden sm:block">${champ.tagline}</p>
        <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-silver">
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${getEnabledChampionshipCategories(champ.id).length} categorías</span>
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${champ.validasCount} ${champ.validasLabel}</span>
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${champ.extraStat[0]} ${champ.extraStat[1].toLowerCase()}</span>
        </div>
        <span class="split-cta inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 font-bold text-ink text-sm">
          Entrar
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </span>
      </div>
    </a>`;
}

/**
 * Puerta de entrada en la raíz: elige MX o Festival Enduro
 * y navega a /mx o /enduro (páginas separadas, más claras para todos).
 */
export function initGatewayPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <main class="split-hero min-h-screen" aria-label="Elige tu campeonato">
      ${renderGatewayPanel(CHAMPIONSHIPS.mx)}
      <div class="split-divider" aria-hidden="true"></div>
      ${renderGatewayPanel(CHAMPIONSHIPS.enduro)}
    </main>
    <p class="fixed bottom-4 left-0 right-0 z-20 text-center text-xs text-muted pointer-events-none px-4">
      Elige un campeonato para continuar · MX a la izquierda · Enduro a la derecha
    </p>
  `;
}
