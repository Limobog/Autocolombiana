import { isPilotAgeValidForCategory } from '../utils/age';

export const PILOT_NUMBER_MIN = 4;
export const PILOT_NUMBER_MAX = 999;

export type ChampionshipId = 'mx' | 'enduro';

export interface Category {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  /**
   * false = inhabilitada para nuevas inscripciones / eventos futuros.
   * Si se omite se considera habilitada. No se elimina si ya hay inscritos.
   */
  active?: boolean;
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
 * Categorías del Festival de Enduro Autocolombiana (1.ª Edición).
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

/** Categoría almacenada con su campeonato (formato de la hoja Categories). */
export interface StoredCategory extends Category {
  championshipId: ChampionshipId;
}

/**
 * Store mutable de categorías. Arranca con las listas por defecto del código
 * y puede ser reemplazado con lo configurado desde el panel de gestión
 * (Google Sheets / localStorage) vía setCategoryStore.
 */
const categoryStore: Record<ChampionshipId, Category[]> = {
  mx: [...CATEGORIES],
  enduro: [...ENDURO_CATEGORIES],
};

/**
 * Reemplaza las categorías de uno o ambos campeonatos.
 * Solo actualiza las claves presentes y con al menos una categoría
 * (lista vacía = se mantienen las actuales / por defecto).
 */
export function setCategoryStore(store: Partial<Record<ChampionshipId, Category[]>>): void {
  if (store.mx && store.mx.length > 0) categoryStore.mx = store.mx.map((c) => ({ ...c }));
  if (store.enduro && store.enduro.length > 0) {
    categoryStore.enduro = store.enduro.map((c) => ({ ...c }));
  }
}

export function getChampionshipCategories(championshipId: ChampionshipId): Category[] {
  return categoryStore[championshipId];
}

/** Categorías habilitadas (aparecen en home, reglamento e inscripciones nuevas). */
export function getEnabledChampionshipCategories(championshipId: ChampionshipId): Category[] {
  return getChampionshipCategories(championshipId).filter(isCategoryEnabled);
}

export function isCategoryEnabled(category: Category): boolean {
  return category.active !== false;
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
  return (
    categoryStore.mx.find((c) => c.id === resolved) ??
    categoryStore.enduro.find((c) => c.id === resolved) ??
    // Categorías eliminadas del panel pero referenciadas por inscripciones antiguas.
    CATEGORIES.find((c) => c.id === resolved) ??
    ENDURO_CATEGORIES.find((c) => c.id === resolved)
  );
}

export type AgeValidationContext =
  | number
  | {
      birthDate: string;
      eventDate?: string | Date;
    };

/**
 * Categorías elegibles por edad.
 * - Si se pasa un contexto con fecha de nacimiento y fecha de evento:
 *   La edad mínima se valida con la edad al día del evento (si cumple años el día del evento es válido).
 *   La edad máxima se valida con la edad al 1ro de enero del año correspondiente.
 * - Si se pasa un número de edad, se valida directamente en el rango [minAge, maxAge].
 * Por defecto solo habilita las activas; `includeIds` permite mostrar
 * categorías inhabilitadas ya seleccionadas (edición de inscripciones).
 */
export function getCategoriesForAge(
  ageOrContext: AgeValidationContext,
  championshipId: ChampionshipId = 'mx',
  options?: { includeIds?: string[] }
): Category[] {
  const include = new Set((options?.includeIds ?? []).map(resolveCategoryId));
  return getChampionshipCategories(championshipId).filter((c) => {
    if (typeof ageOrContext === 'number') {
      if (ageOrContext < 0 || ageOrContext < c.minAge || ageOrContext > c.maxAge) return false;
    } else if (ageOrContext && typeof ageOrContext === 'object') {
      if (!isPilotAgeValidForCategory(c.minAge, c.maxAge, ageOrContext.birthDate, ageOrContext.eventDate)) {
        return false;
      }
    } else {
      return false;
    }
    return isCategoryEnabled(c) || include.has(c.id);
  });
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
  /** URL del JSON de resultados en Drive (o "local" en modo sin API). */
  resultadosUrl: string;
  valorInscripcion: number;
  championshipId: ChampionshipId;
}

/** Campos temporales al guardar (PDF en base64, no van a la hoja). */
export interface EventSavePayload extends Event {
  reglamentoArchivo?: string;
  reglamentoFileName?: string;
  reglamentoFileType?: string;
}

export type HeatKey = 'manga1' | 'manga2' | 'manga3' | 'final';

export interface ResultsTable {
  columns: string[];
  rows: Array<Record<string, string>>;
  commentColumn?: string | null;
  pdfUrl?: string;
  csvUrl?: string;
}

export interface CategoryResults {
  categoryId: string;
  categoryLabel: string;
  manga1?: ResultsTable;
  manga2?: ResultsTable;
  manga3?: ResultsTable;
  final?: ResultsTable;
}

export type ResultsMode = 'categories' | 'single_pdf';

export interface EventResults {
  eventId: string;
  updatedAt: string;
  mode?: ResultsMode;
  singlePdfUrl?: string;
  categories: CategoryResults[];
}

/** Archivo pendiente de subir a Drive (base64 data URL). */
export interface ResultsFileUpload {
  archivo: string;
  fileName: string;
  fileType: string;
}

export interface ResultsHeatSavePayload {
  columns: string[];
  rows: Array<Record<string, string>>;
  commentColumn?: string | null;
  pdfUrl?: string;
  csvUrl?: string;
  pdfUpload?: ResultsFileUpload;
  csvUpload?: ResultsFileUpload;
}

export interface CategoryResultsSavePayload {
  categoryId: string;
  categoryLabel: string;
  manga1?: ResultsHeatSavePayload;
  manga2?: ResultsHeatSavePayload;
  manga3?: ResultsHeatSavePayload;
  final?: ResultsHeatSavePayload;
}

export interface EventResultsSavePayload {
  eventId: string;
  eventName: string;
  mode?: ResultsMode;
  singlePdfUrl?: string;
  singlePdfUpload?: ResultsFileUpload;
  categories: CategoryResultsSavePayload[];
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
