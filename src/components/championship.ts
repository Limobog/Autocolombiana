import {
  CHAMPIONSHIPS,
  getActiveChampionship,
  getStoredChampionshipId,
  setActiveChampionship,
} from '../championships';
import type { ChampionshipId } from '../types';

/** Switcher segmentado MX / Enduro para la barra de navegación. */
export function renderChampionshipSwitcher(extraClass = ''): string {
  const active = getActiveChampionship().id;
  const button = (id: ChampionshipId, label: string) => `
    <button type="button" data-champ-switch="${id}"
      class="champ-switch-btn px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
        active === id ? 'bg-white text-ink shadow-glow' : 'text-silver hover:text-white'
      }"
      aria-pressed="${active === id}">
      ${label}
    </button>`;

  return `
    <div class="champ-switcher inline-flex items-center gap-1 rounded-full border border-white/15 bg-surface-raised p-1 ${extraClass}"
         role="group" aria-label="Cambiar campeonato">
      ${button('mx', 'MX')}
      ${button('enduro', 'Enduro')}
    </div>`;
}

export function initChampionshipSwitcher(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-champ-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-champ-switch') as ChampionshipId;
      setActiveChampionship(id);
    });
  });
}

/**
 * Modal de selección de campeonato para páginas internas.
 * Devuelve el HTML del overlay solo si el usuario aún no ha elegido campeonato.
 */
export function renderChampionshipModal(): string {
  if (getStoredChampionshipId()) return '';

  const option = (id: ChampionshipId) => {
    const champ = CHAMPIONSHIPS[id];
    return `
      <button type="button" data-champ-pick="${id}"
        class="champ-modal-option group relative flex flex-col items-center gap-4 rounded-card border border-white/15 bg-surface-raised p-6 md:p-8 transition-all duration-300 hover:border-white/50 hover:shadow-glow-strong hover:-translate-y-1">
        <img src="${champ.logo}" alt="${champ.name}" class="h-20 md:h-24 w-auto object-contain drop-shadow-glow-strong transition-transform duration-300 group-hover:scale-105" />
        <span class="font-title text-xl md:text-2xl tracking-wider text-white text-center leading-tight">${champ.name}</span>
        <span class="badge-tag">${champ.badge}</span>
        <span class="text-xs font-semibold uppercase tracking-widest text-silver group-hover:text-white">Ver este campeonato →</span>
      </button>`;
  };

  return `
    <div id="champ-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 champ-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="champ-modal-title">
      <div class="w-full max-w-2xl rounded-card border border-white/15 bg-surface-elevated p-6 md:p-10 shadow-card animate-fade-in-up">
        <p class="text-silver font-semibold tracking-widest uppercase text-xs text-center mb-2">Copa Autocolombiana</p>
        <h2 id="champ-modal-title" class="font-title text-3xl md:text-4xl tracking-wider text-white text-center mb-2">
          ¿Qué campeonato quieres ver?
        </h2>
        <p class="text-muted text-sm text-center mb-8">Esta temporada corremos dos campeonatos. Elige uno para continuar.</p>
        <div class="grid gap-4 sm:grid-cols-2">
          ${option('mx')}
          ${option('enduro')}
        </div>
        <p class="text-xs text-muted text-center mt-6">
          Podrás cambiar de campeonato en cualquier momento desde la barra superior, sin recargar la página.
        </p>
      </div>
    </div>`;
}

export function initChampionshipModal(): void {
  const modal = document.getElementById('champ-modal');
  if (!modal) return;
  modal.querySelectorAll<HTMLButtonElement>('[data-champ-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-champ-pick') as ChampionshipId;
      // Si elige el campeonato por defecto (mx) no se dispara re-render, cerramos manualmente.
      modal.remove();
      setActiveChampionship(id);
    });
  });
}
