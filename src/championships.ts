import type { ChampionshipId } from './types';
import { detectChampionshipFromPath } from './utils/site-context';

export interface ChampionshipValida {
  edition: string;
  format: string;
  date: string;
  location: string;
  details: string[];
}

export interface ChampionshipBankDetails {
  bank: string;
  accountHolder: string;
  /** NIT o cédula */
  idLabel: string;
  idValue: string;
  accountType: string;
  accountNumber: string;
  /** Llave de pagos (Bre-B / Nequi / etc.), opcional */
  paymentKey?: string;
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
  /** Nombre del archivo en public/ (sin ./) */
  logo: string;
  tagline: string;
  validasCount: number;
  /** Cómo se llaman las fechas en este campeonato: "válidas" (MX) o "ediciones" (Festival) */
  validasLabel: string;
  /** Tercera stat del hero: [valor, etiqueta] */
  extraStat: [string, string];
  /** Calendario informativo (se muestra si aún no hay eventos creados) */
  calendar: ChampionshipValida[];
  /** Datos bancarios para consignar la inscripción */
  bankDetails: ChampionshipBankDetails;
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
    logo: 'logo-copa-mx.png',
    tagline:
      'El motocross por clubes que reúne a pilotos de todo Colombia. Cuatro válidas, dos mangas por categoría y puntos que cuentan en cada fecha.',
    validasCount: 4,
    validasLabel: 'válidas',
    extraStat: ['$20M', 'Premiación'],
    calendar: [],
    bankDetails: {
      bank: 'Bre-B',
      accountHolder: 'LIMOBOG',
      idLabel: 'NIT',
      idValue: '860080966',
      accountType: 'Llave Bre-B',
      accountNumber: '3146105217',
      paymentKey: '3146105217',
    },
  },
  enduro: {
    id: 'enduro',
    name: 'Festival de Enduro Autocolombiana',
    article: 'el',
    heroTitleHtml: 'FESTIVAL <span class="text-silver">ENDURO</span>',
    heroSubtitle: 'AUTOCOLOMBIANA · 1.ª EDICIÓN',
    shortLabel: 'Festival Enduro',
    badge: 'Festival · 1.ª Edición',
    logo: 'logo-enduro.png',
    tagline:
      'La primera edición del Festival de Enduro Autocolombiana: competencia contra el cronómetro, 2 pruebas especiales en Sprint Enduro y un Hard Scramble que exigen todo de ti.',
    validasCount: 2,
    validasLabel: 'ediciones',
    extraStat: ['2+1', 'Pruebas + Hard Scramble'],
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
        format: 'Hard Scramble',
        date: '11 de octubre',
        location: 'La Pista Off Road',
        details: ['Competencia contra el cronómetro', 'Clasificación por tiempos', 'Hard Scramble'],
      },
    ],
    bankDetails: {
      bank: 'BBVA',
      accountHolder: 'Wilman Esteban Chivata Corredor',
      idLabel: 'Cédula',
      idValue: '1010234134',
      accountType: 'Ahorros',
      accountNumber: '0021357124',
      paymentKey: '@bbva3146105217',
    },
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

/**
 * Campeonato activo: la URL (/mx o /enduro) manda;
 * si estamos en la raíz (panel / puerta), se usa lo guardado o MX.
 */
export function getActiveChampionship(): Championship {
  const fromPath = detectChampionshipFromPath();
  return CHAMPIONSHIPS[fromPath ?? getStoredChampionshipId() ?? 'mx'];
}

/** Fija el campeonato según la carpeta de la URL y lo recuerda en localStorage. */
export function lockChampionshipFromPath(): ChampionshipId | null {
  const fromPath = detectChampionshipFromPath();
  if (!fromPath) return null;
  try {
    localStorage.setItem(STORAGE_KEY, fromPath);
  } catch {
    /* modo incógnito */
  }
  return fromPath;
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
