import type { ChampionshipId } from './types';
import { CATEGORIES, ENDURO_CATEGORIES } from './types';

export interface ChampionshipValida {
  edition: string;
  format: string;
  date: string;
  location: string;
  details: string[];
}

export interface Championship {
  id: ChampionshipId;
  /** Nombre completo, ej: "Copa Autocolombiana de Clubes MX" */
  name: string;
  /** Artículo gramatical del nombre: "la Copa...", "el Festival..." */
  article: 'la' | 'el';
  /** Título principal del hero (HTML permitido para resaltar palabras) */
  heroTitleHtml: string;
  /** Línea final del título del hero, ej: "DE CLUBES MX" */
  heroSubtitle: string;
  /** Etiqueta corta para switcher y badges */
  shortLabel: string;
  badge: string;
  logo: string;
  tagline: string;
  categoriesCount: number;
  validasCount: number;
  /** Cómo se llaman las fechas en este campeonato: "válidas" (MX) o "ediciones" (Festival) */
  validasLabel: string;
  /** Tercera stat del hero: [valor, etiqueta] */
  extraStat: [string, string];
  /** Calendario informativo (se muestra si aún no hay eventos creados) */
  calendar: ChampionshipValida[];
}

export const CHAMPIONSHIPS: Record<ChampionshipId, Championship> = {
  mx: {
    id: 'mx',
    name: 'Copa Autocolombiana de Clubes MX',
    article: 'la',
    heroTitleHtml: 'COPA <span class="text-silver">AUTOCOLOMBIANA</span>',
    heroSubtitle: 'DE CLUBES MX',
    shortLabel: 'Clubes MX',
    badge: 'De Clubes · MX',
    logo: './logo-copa.png',
    tagline:
      'El motocross por clubes que reúne a pilotos de todo Colombia. Cuatro válidas, dos mangas por categoría y puntos que cuentan en cada fecha.',
    categoriesCount: CATEGORIES.length,
    validasCount: 4,
    validasLabel: 'válidas',
    extraStat: ['$20M', 'Premiación'],
    calendar: [],
  },
  enduro: {
    id: 'enduro',
    name: 'Festival de Enduro Autocolombiana',
    article: 'el',
    heroTitleHtml: 'FESTIVAL <span class="text-silver">ENDURO</span>',
    heroSubtitle: 'AUTOCOLOMBIANA · 1.ª EDICIÓN',
    shortLabel: 'Festival Enduro',
    badge: 'Festival · 1.ª Edición',
    logo: './logo-enduro.png',
    tagline:
      'La primera edición del Festival de Enduro Autocolombiana: competencia contra el cronómetro, clasificación por tiempos y pruebas especiales que exigen todo de ti.',
    categoriesCount: ENDURO_CATEGORIES.length,
    validasCount: 2,
    validasLabel: 'ediciones',
    extraStat: ['3', 'Pruebas especiales'],
    calendar: [
      {
        edition: '1.ª Edición',
        format: 'Sprint Enduro',
        date: '30 de agosto',
        location: 'Cogua Motopark',
        details: ['Competencia contra el cronómetro', 'Clasificación por tiempos', '2 pruebas especiales'],
      },
      {
        edition: '2.ª Edición',
        format: 'Hard Scrambler',
        date: '11 de octubre',
        location: 'La Pista Off Road',
        details: ['Competencia contra el cronómetro', 'Clasificación por tiempos', '1 prueba especial'],
      },
    ],
  },
};

const STORAGE_KEY = 'copa_campeonato_v1';
const CHANGE_EVENT = 'copa:championship-change';

/** Campeonato guardado por el usuario, o null si aún no ha elegido. */
export function getStoredChampionshipId(): ChampionshipId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'mx' || raw === 'enduro' ? raw : null;
  } catch {
    return null;
  }
}

export function getActiveChampionship(): Championship {
  return CHAMPIONSHIPS[getStoredChampionshipId() ?? 'mx'];
}

export function setActiveChampionship(id: ChampionshipId): void {
  const previous = getStoredChampionshipId();
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* modo incógnito: el cambio aplica solo en memoria del evento */
  }
  if (previous !== id) {
    window.dispatchEvent(new CustomEvent<ChampionshipId>(CHANGE_EVENT, { detail: id }));
  }
}

export function onChampionshipChange(callback: (id: ChampionshipId) => void): void {
  window.addEventListener(CHANGE_EVENT, (e) => callback((e as CustomEvent<ChampionshipId>).detail));
}
