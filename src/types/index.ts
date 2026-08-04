export const PILOT_NUMBER_MIN = 4;
export const PILOT_NUMBER_MAX = 999;

export type ChampionshipId = 'mx' | 'enduro';

export interface Category {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
}

/** IDs legacy → categorías actuales Copa Autocolombiana. */
const LEGACY_CATEGORY_IDS: Record<string, string> = {
  '50cc-a': '50cc-4-6',
  '50cc-b': '50cc-6-8',
  '65cc-a': '65cc-a',
  '65cc-b': '65cc-b',
  '65cc-7-9': '65cc-a',
  '65cc-8-10': '65cc-b',
  '85cc-a': '85cc-a',
  '85cc-b': '85cc-b',
  '85cc-9-11': '85cc-a',
  '85cc-11-13': '85cc-b',
  '125cc-junior': '125cc',
};

export const CATEGORIES: Category[] = [
  { id: '50cc-4-6', label: '50cc — motos originales de fábrica, rin 10', minAge: 4, maxAge: 6 },
  { id: '50cc-6-8', label: '50cc', minAge: 6, maxAge: 8 },
  { id: '65cc-a', label: '65cc A', minAge: 7, maxAge: 10 },
  { id: '65cc-b', label: '65cc B', minAge: 7, maxAge: 10 },
  { id: '85cc-a', label: '85cc A', minAge: 10, maxAge: 15 },
  { id: '85cc-b', label: '85cc B', minAge: 10, maxAge: 15 },
  { id: '125cc', label: '125cc — hasta 125cc (2T) / 150–250cc (4T)', minAge: 12, maxAge: 17 },
  { id: 'mx-novatos', label: 'MX Novatos — 125–250cc (2T) / 250–450cc (4T)', minAge: 15, maxAge: 999 },
  { id: 'mx-b', label: 'MX B — 125–250cc (2T) / 250–250cc (4T)', minAge: 15, maxAge: 999 },
  { id: 'mx-a', label: 'MX A — 125–250cc (2T) / 250–250cc (4T)', minAge: 15, maxAge: 999 },
  { id: 'mx-master', label: 'MX Master — cilindraje libre', minAge: 36, maxAge: 999 },
  { id: 'femenino', label: 'Femenino — cilindraje libre desde 85cc', minAge: 12, maxAge: 999 },
  { id: 'enduro-a', label: 'Enduro A — cilindraje libre, moto enduro', minAge: 15, maxAge: 999 },
  { id: 'enduro-b', label: 'Enduro B — cilindraje libre, moto enduro', minAge: 15, maxAge: 999 },
];

/**
 * Categorías de la Copa Autocolombiana de Enduro (1.ª Edición).
 * Rangos de edad relacionados con las categorías MX equivalentes por cilindrada:
 * 50cc → 4–8, 65cc → 7–10 (ampliado a 12 por 110/125 4T), 85cc → 10–15.
 */
export const ENDURO_CATEGORIES: Category[] = [
  { id: 'end-e1-50-4t', label: 'Enduro 1 Infantil — 50cc 4T', minAge: 4, maxAge: 8 },
  { id: 'end-e1-50-2t', label: 'Enduro 1 Infantil — 50cc 2T', minAge: 4, maxAge: 8 },
  { id: 'end-e2', label: 'Enduro 2 Infantil — 65cc 2T / 110cc 4T / 125cc 4T', minAge: 7, maxAge: 12 },
  { id: 'end-e3', label: 'Enduro 3 — 85cc / 150cc 4T', minAge: 10, maxAge: 15 },
  { id: 'end-juvenil', label: 'Juvenil — cualquier cilindrada', minAge: 14, maxAge: 16 },
  { id: 'end-bronce', label: 'Bronce — pilotos novatos', minAge: 15, maxAge: 999 },
  { id: 'end-plata', label: 'Plata — nivel intermedio', minAge: 15, maxAge: 999 },
  { id: 'end-oro', label: 'Oro — abierta para pilotos expertos', minAge: 15, maxAge: 999 },
];

const ALL_CATEGORIES: Category[] = [...CATEGORIES, ...ENDURO_CATEGORIES];

export function getChampionshipCategories(championshipId: ChampionshipId): Category[] {
  return championshipId === 'enduro' ? ENDURO_CATEGORIES : CATEGORIES;
}

export function resolveCategoryId(id: string): string {
  return LEGACY_CATEGORY_IDS[id] ?? id;
}

export function formatCategoryOptionLabel(category: Category): string {
  if (category.maxAge >= 999) {
    if (category.minAge >= 36) {
      return `${category.label} (mayor a 35 años)`;
    }
    return `${category.label} (desde ${category.minAge} años)`;
  }
  return `${category.label} (${category.minAge} – ${category.maxAge} años)`;
}

export function formatCategoryDisplayLabel(categoriaId: string, fallbackLabel = ''): string {
  const ids = categoriaId.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length > 0) {
    return ids
      .map((id) => {
        const cat = getCategoryById(id);
        if (!cat) return fallbackLabel || id;
        return formatCategoryOptionLabel(cat);
      })
      .join(' | ');
  }
  return fallbackLabel.replace(/\banos\b/gi, 'años');
}

export function getCategoryById(id: string): Category | undefined {
  const resolved = resolveCategoryId(id);
  return ALL_CATEGORIES.find((c) => c.id === resolved);
}

export function getCategoriesForAge(age: number, championshipId: ChampionshipId = 'mx'): Category[] {
  if (age < 0) return [];
  return getChampionshipCategories(championshipId).filter((c) => age >= c.minAge && age <= c.maxAge);
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  city: string;
  description: string;
  active: boolean;
  finished: boolean;
  reglamentoUrl: string;
  valorInscripcion: number;
  championshipId: ChampionshipId;
}

/** Campos temporales al guardar (PDF en base64, no van a la hoja). */
export interface EventSavePayload extends Event {
  reglamentoArchivo?: string;
  reglamentoFileName?: string;
  reglamentoFileType?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventName?: string;
  nombre: string;
  apellido: string;
  identificacion: string;
  identificacionArchivo: string;
  identificacionFileName: string;
  identificacionFileType: string;
  comprobantePagoArchivo: string;
  comprobantePagoFileName: string;
  comprobantePagoFileType: string;
  fechaNacimiento: string;
  edad: number;
  email: string;
  celular: string;
  ciudad: string;
  marcaMoto: string;
  numeroPiloto: number;
  categoriaId: string;
  categoriaLabel: string;
  valorTotalInscripcion: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationFormData {
  eventId: string;
  nombre: string;
  apellido: string;
  identificacion: string;
  identificacionArchivo: string;
  identificacionFileName: string;
  identificacionFileType: string;
  comprobantePagoArchivo: string;
  comprobantePagoFileName: string;
  comprobantePagoFileType: string;
  fechaNacimiento: string;
  email: string;
  celular: string;
  ciudad: string;
  marcaMoto: string;
  numeroPiloto: number;
  categoriaIds: string[];
}

export interface AppData {
  events: Event[];
  registrations: Registration[];
}

/** Sin restricción A/B: solo aplica elegibilidad por edad al seleccionar. */
export function validateCategorySelection(_categoriaIds: string[]): string | null {
  return null;
}
