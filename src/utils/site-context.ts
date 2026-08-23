import type { ChampionshipId } from '../types';

/** Detecta el campeonato a partir de la ruta (/mx/... o /enduro/...). */
export function detectChampionshipFromPath(): ChampionshipId | null {
  const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  if (/\/enduro(\/|$)/.test(path)) return 'enduro';
  if (/\/mx(\/|$)/.test(path)) return 'mx';
  return null;
}

/** true cuando la página vive dentro de /mx o /enduro. */
export function isChampionshipSite(): boolean {
  return detectChampionshipFromPath() !== null;
}

/**
 * Ruta a un archivo de `public/` (logos, PDF, data/).
 * Desde /mx o /enduro sube un nivel; en la raíz del sitio usa ./.
 */
export function asset(path: string): string {
  const clean = path.replace(/^\.\//, '').replace(/^\//, '');
  return isChampionshipSite() ? `../${clean}` : `./${clean}`;
}

/** Página actual (ej. eventos.html). */
export function currentPageFile(): string {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  return file.includes('.') ? file : 'index.html';
}

/** Enlace a la misma página (o inicio) del otro campeonato. */
export function otherChampionshipHref(target: ChampionshipId): string {
  const page = currentPageFile();
  const safePage =
    page === 'index.html' ||
    page === 'eventos.html' ||
    page === 'inscripcion.html' ||
    page === 'reglamento.html' ||
    page === 'resultados.html'
      ? page
      : 'index.html';
  return `../${target}/${safePage}${window.location.search}${window.location.hash}`;
}
