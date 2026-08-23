// Panel admin oculto: panel-autocolombiana-gestion-2026.html

import { getActiveChampionship } from '../championships';
import { asset, otherChampionshipHref } from '../utils/site-context';
import type { ChampionshipId } from '../types';

export function renderNavbar(activePage: 'home' | 'eventos' | 'inscripcion' | 'reglamento' = 'home'): string {
  const champ = getActiveChampionship();
  const links = [
    { href: './index.html', label: 'Inicio', key: 'home' },
    { href: './eventos.html', label: 'Eventos', key: 'eventos' },
    { href: './inscripcion.html', label: 'Inscripción', key: 'inscripcion' },
    { href: './reglamento.html', label: 'Reglamento', key: 'reglamento' },
  ];

  const navLinks = links
    .map(
      (link) => `
      <a href="${link.href}"
         class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
           activePage === link.key
             ? 'bg-white text-ink shadow-glow'
             : 'text-silver hover:bg-white/5 hover:text-white'
         }">
        ${link.label}
      </a>`
    )
    .join('');

  const switcher = (extraClass = '') => {
    const button = (id: ChampionshipId, label: string) => {
      const active = champ.id === id;
      if (active) {
        return `<span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-ink shadow-glow">${label}</span>`;
      }
      return `<a href="${otherChampionshipHref(id)}"
        class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-silver hover:text-white transition-colors">${label}</a>`;
    };
    return `
      <div class="champ-switcher inline-flex items-center gap-1 rounded-full border border-white/15 bg-surface-raised p-1 ${extraClass}"
           role="navigation" aria-label="Cambiar campeonato">
        ${button('mx', 'MX')}
        ${button('enduro', 'Enduro')}
      </div>`;
  };

  return `
    <header>
      <nav class="sticky top-0 z-50 border-b border-white/10 bg-surface/90 backdrop-blur-md">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a href="./index.html" class="flex items-center gap-3 min-w-0">
            <img src="${asset(champ.logo)}" alt="${champ.name}" class="h-10 w-auto object-contain md:h-12 shrink-0" />
            <div class="hidden lg:block min-w-0 border-l border-white/10 pl-3">
              <p class="font-title text-lg tracking-wider text-white leading-none truncate">Copa Autocolombiana</p>
              <p class="text-[10px] text-muted font-medium uppercase tracking-widest mt-0.5">${champ.shortLabel}</p>
            </div>
          </a>
          <div class="hidden md:flex items-center gap-1">${navLinks}</div>
          <div class="flex items-center gap-3 shrink-0">
            ${switcher('hidden sm:inline-flex')}
            <a href="../index.html" class="hidden lg:inline text-xs text-muted hover:text-silver shrink-0" title="Elegir otro campeonato">Inicio</a>
            <a href="./inscripcion.html" class="hidden sm:inline-flex btn-primary text-sm py-2 px-4 shrink-0">Inscríbete</a>
            <button id="mobile-menu-btn" class="md:hidden p-2 text-white shrink-0" aria-label="Menú">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="mobile-menu" class="hidden md:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-surface-raised">
          <div class="flex justify-center py-2 sm:hidden">${switcher()}</div>
          ${navLinks}
          <a href="./inscripcion.html" class="btn-primary w-full text-center mt-2">Inscríbete</a>
          <a href="../index.html" class="block text-center text-xs text-muted mt-3 hover:text-silver">← Volver al inicio general</a>
        </div>
      </nav>
    </header>`;
}

export function initNavbar(): void {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  btn?.addEventListener('click', () => menu?.classList.toggle('hidden'));
}
