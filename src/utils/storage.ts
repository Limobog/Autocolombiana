import { CONFIG } from '../config';
import type {
  AppData,
  Category,
  ChampionshipId,
  Event,
  EventBankingInfo,
  EventPromotion,
  EventResults,
  EventResultsSavePayload,
  EventSavePayload,
  PromotionType,
  Registration,
  RegistrationFormData,
  StoredCategory,
} from '../types';
import { calculateAge, generateId, parseSheetDate } from './age';
import { getCategoryById, formatCategoryOptionLabel, setCategoryStore, validateCategorySelection } from '../types';
import { computeRegistrationTotal } from './registration-total';
import { asset } from './site-context';
import {
  apiGet,
  apiPost,
  checkPilotNumberRemote,
  getAvailablePilotNumbers as fetchAvailablePilotNumbers,
  isApiEnabled,
  allPilotNumbers,
} from './api';
import { parseResultsCsv, isNumericValue, type HeatKey } from './parse-results-csv';

export { allPilotNumbers };

const LOCAL_RESULTS_MARKER = 'local';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function parseBoolField(value: unknown): boolean {
  return value === true || value === 'TRUE' || value === 'true' || value === 1 || value === '1';
}

function normalizeChampionshipId(raw: Record<string, unknown>): Event['championshipId'] {
  const value = String(raw.championshipId ?? '').trim().toLowerCase();
  if (value === 'enduro' || value === 'mx') return value;
  // Fallback para eventos creados antes de existir el campo: se infiere por el nombre.
  return /enduro/i.test(String(raw.name ?? '')) ? 'enduro' : 'mx';
}

function parseBankingInfo(raw: unknown): EventBankingInfo | undefined {
  if (!raw) return undefined;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;

  const bankAccountRaw = o.bankAccount as Record<string, unknown> | undefined;
  const breBRaw = o.breB as Record<string, unknown> | undefined;
  const neobankRaw = o.neobank as Record<string, unknown> | undefined;

  return {
    bankAccount: bankAccountRaw
      ? {
          enabled: parseBoolField(bankAccountRaw.enabled),
          bank: String(bankAccountRaw.bank ?? ''),
          accountType: String(bankAccountRaw.accountType ?? 'Ahorros'),
          accountNumber: String(bankAccountRaw.accountNumber ?? ''),
          beneficiaryName: String(bankAccountRaw.beneficiaryName ?? ''),
          beneficiaryDocument: String(bankAccountRaw.beneficiaryDocument ?? ''),
        }
      : undefined,
    breB: breBRaw
      ? {
          enabled: parseBoolField(breBRaw.enabled),
          beneficiaryName: String(breBRaw.beneficiaryName ?? ''),
          key: String(breBRaw.key ?? ''),
        }
      : undefined,
    neobank: neobankRaw
      ? {
          enabled: parseBoolField(neobankRaw.enabled),
          neobank: String(neobankRaw.neobank ?? ''),
          beneficiaryName: String(neobankRaw.beneficiaryName ?? ''),
          accountNumber: String(neobankRaw.accountNumber ?? ''),
        }
      : undefined,
  };
}

function parseCategoryPrices(raw: unknown): Record<string, number> | undefined {
  if (!raw) return undefined;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!obj || typeof obj !== 'object') return undefined;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const num = Number(v);
    if (Number.isFinite(num) && num >= 0) {
      result[k] = num;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parsePromotions(raw: unknown): EventPromotion[] | undefined {
  if (!raw) return undefined;
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(list)) return undefined;
  const promos: EventPromotion[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const it = item as Record<string, unknown>;
    const id = String(it.id || '').trim();
    const name = String(it.name || '').trim();
    const type = String(it.type || 'fixed_package') as PromotionType;
    const minCategories = Number(it.minCategories) || 2;
    const value = it.value !== undefined ? Number(it.value) : undefined;
    const active = it.active !== undefined ? parseBoolField(it.active) : true;
    const applicableCategoryIds = Array.isArray(it.applicableCategoryIds)
      ? it.applicableCategoryIds.map(String).filter(Boolean)
      : undefined;

    if (id || name) {
      promos.push({
        id: id || `promo-${promos.length + 1}`,
        name: name || 'Promoción',
        type,
        minCategories,
        value,
        applicableCategoryIds,
        active,
      });
    }
  }
  return promos.length > 0 ? promos : undefined;
}

function normalizeEvent(raw: Record<string, unknown>): Event {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    date: parseSheetDate(raw.date),
    location: String(raw.location ?? ''),
    city: String(raw.city ?? ''),
    description: String(raw.description ?? ''),
    active: parseBoolField(raw.active),
    finished: parseBoolField(raw.finished),
    reglamentoUrl: String(raw.reglamentoUrl ?? ''),
    resultadosUrl: String(raw.resultadosUrl ?? ''),
    valorInscripcion: Number(raw.valorInscripcion ?? 0) || 0,
    championshipId: normalizeChampionshipId(raw),
    bankingInfo: parseBankingInfo(raw.bankingInfo ?? raw.bankDetails),
    categoryPrices: parseCategoryPrices(raw.categoryPrices),
    promotions: parsePromotions(raw.promotions),
  };
}

export function eventHasResults(event: Event): boolean {
  return Boolean(event.resultadosUrl?.trim());
}

function normalizeRegistration(raw: Record<string, unknown>): Registration {
  return {
    id: String(raw.id ?? ''),
    eventId: String(raw.eventId ?? ''),
    eventName: String(raw.eventName ?? ''),
    nombre: String(raw.nombre ?? ''),
    apellido: String(raw.apellido ?? ''),
    identificacion: String(raw.identificacion ?? ''),
    identificacionArchivo: String(raw.identificacionArchivo ?? raw.identificacionDriveUrl ?? ''),
    identificacionFileName: String(raw.identificacionFileName ?? ''),
    identificacionFileType: String(raw.identificacionFileType ?? ''),
    comprobantePagoArchivo: String(raw.comprobantePagoArchivo ?? raw.comprobantePagoUrl ?? ''),
    comprobantePagoFileName: String(raw.comprobantePagoFileName ?? ''),
    comprobantePagoFileType: String(raw.comprobantePagoFileType ?? ''),
    fechaNacimiento: parseSheetDate(raw.fechaNacimiento),
    edad: Number(raw.edad ?? 0),
    email: String(raw.email ?? ''),
    celular: String(raw.celular ?? ''),
    ciudad: String(raw.ciudad ?? ''),
    marcaMoto: String(raw.marcaMoto ?? ''),
    numeroPiloto: Number(raw.numeroPiloto ?? 0),
    categoriaId: String(raw.categoriaId ?? ''),
    categoriaLabel: String(raw.categoriaLabel ?? ''),
    valorTotalInscripcion: Number(raw.valorTotalInscripcion ?? 0) || 0,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

// ─── Categorías dinámicas (gestionadas desde el panel) ──────────────────────

function normalizeStoredCategory(raw: Record<string, unknown>): StoredCategory | null {
  const id = String(raw.id ?? '').trim();
  const label = String(raw.label ?? '').trim();
  const champRaw = String(raw.championshipId ?? '').trim().toLowerCase();
  const championshipId: ChampionshipId = champRaw === 'enduro' ? 'enduro' : 'mx';
  const minAge = Number(raw.minAge ?? 0);
  const maxAgeRaw = Number(raw.maxAge ?? 999);
  if (!id || !label) return null;
  const activeRaw = raw.active;
  const active =
    activeRaw === undefined || activeRaw === null || activeRaw === ''
      ? true
      : activeRaw === true ||
        activeRaw === 'TRUE' ||
        activeRaw === 'true' ||
        activeRaw === 1 ||
        activeRaw === '1';
  return {
    id,
    label,
    championshipId,
    minAge: Number.isFinite(minAge) && minAge >= 0 ? minAge : 0,
    maxAge: Number.isFinite(maxAgeRaw) && maxAgeRaw > 0 ? maxAgeRaw : 999,
    active,
  };
}

function groupCategories(rows: StoredCategory[]): Partial<Record<ChampionshipId, Category[]>> {
  const store: Partial<Record<ChampionshipId, Category[]>> = {};
  for (const row of rows) {
    const list = (store[row.championshipId] ??= []);
    list.push({
      id: row.id,
      label: row.label,
      minAge: row.minAge,
      maxAge: row.maxAge,
      active: row.active !== false,
    });
  }
  return store;
}

let inMemoryCategories: StoredCategory[] | null = null;
let lastCategoriesFetchTime = 0;
const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;

export function getCachedCategoriesSync(): StoredCategory[] | null {
  if (inMemoryCategories?.length) return inMemoryCategories;
  const fromLocal = readLocal<StoredCategory[]>(CONFIG.storageKeys.categories);
  if (fromLocal?.length) {
    inMemoryCategories = fromLocal
      .map((c) => normalizeStoredCategory(c as unknown as Record<string, unknown>))
      .filter((c): c is StoredCategory => c !== null);
    return inMemoryCategories;
  }
  return null;
}

/**
 * Carga las categorías configuradas (con SWR: inmediato desde localStorage y revalidación en segundo plano).
 */
export async function initCategories(forceRefresh = false): Promise<void> {
  const cached = getCachedCategoriesSync();
  if (cached && cached.length > 0) {
    setCategoryStore(groupCategories(cached));
    const now = Date.now();
    if (!forceRefresh && now - lastCategoriesFetchTime < CATEGORIES_CACHE_TTL_MS) {
      return;
    }
    // Revalidación en segundo plano sin demorar la renderización
    if (isApiEnabled()) {
      void (async () => {
        try {
          const data = await apiGet<{ categories: Record<string, unknown>[] }>({ action: 'categories' });
          const rows = (data.categories ?? [])
            .map(normalizeStoredCategory)
            .filter((c): c is StoredCategory => c !== null);
          if (rows.length > 0) {
            inMemoryCategories = rows;
            lastCategoriesFetchTime = Date.now();
            writeLocal(CONFIG.storageKeys.categories, rows);
            setCategoryStore(groupCategories(rows));
          }
        } catch {
          /* revalidación silenciosa */
        }
      })();
    }
    return;
  }

  // Primera carga sin caché previo
  if (isApiEnabled()) {
    try {
      const data = await apiGet<{ categories: Record<string, unknown>[] }>({ action: 'categories' });
      const rows = (data.categories ?? [])
        .map(normalizeStoredCategory)
        .filter((c): c is StoredCategory => c !== null);
      if (rows.length > 0) {
        inMemoryCategories = rows;
        lastCategoriesFetchTime = Date.now();
        writeLocal(CONFIG.storageKeys.categories, rows);
        setCategoryStore(groupCategories(rows));
        return;
      }
    } catch {
      /* fallback abajo */
    }
  }

  const fromLocal = readLocal<StoredCategory[]>(CONFIG.storageKeys.categories);
  if (fromLocal?.length) {
    const rows = fromLocal
      .map((c) => normalizeStoredCategory(c as unknown as Record<string, unknown>))
      .filter((c): c is StoredCategory => c !== null);
    if (rows.length > 0) {
      inMemoryCategories = rows;
      setCategoryStore(groupCategories(rows));
    }
  }
}

/**
 * Guarda la lista completa de categorías (ambos campeonatos).
 * Devuelve true si se sincronizó con Google Sheets, false si solo quedó local.
 */
export async function saveStoredCategories(rows: StoredCategory[]): Promise<boolean> {
  inMemoryCategories = rows;
  lastCategoriesFetchTime = Date.now();
  writeLocal(CONFIG.storageKeys.categories, rows);
  setCategoryStore(groupCategories(rows));
  if (isApiEnabled()) {
    try {
      await apiPost({ action: 'saveCategories', categories: rows });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export interface LoadEventsOptions {
  forceRefresh?: boolean;
  onUpdate?: (events: Event[]) => void;
}

let inMemoryEvents: Event[] | null = null;
let lastEventsFetchTime = 0;
const EVENTS_CACHE_TTL_MS = 60 * 1000;

export function getCachedEventsSync(): Event[] | null {
  if (inMemoryEvents?.length) return inMemoryEvents;
  const fromLocal = readLocal<Event[]>(CONFIG.storageKeys.events);
  if (fromLocal?.length) {
    inMemoryEvents = fromLocal.map((e) => normalizeEvent(e as unknown as Record<string, unknown>));
    return inMemoryEvents;
  }
  return null;
}

/**
 * Carga eventos utilizando Stale-While-Revalidate (SWR).
 * Si hay datos en caché, los devuelve en 0 ms para visualización instantánea
 * y comprueba en segundo plano si hay eventos nuevos o modificados.
 */
export async function loadEvents(options: LoadEventsOptions = {}): Promise<Event[]> {
  const cached = getCachedEventsSync();
  const now = Date.now();
  const isFresh = Boolean(cached && cached.length > 0 && now - lastEventsFetchTime < EVENTS_CACHE_TTL_MS);

  // 1. Si tenemos datos en caché y no se exige refresco forzado:
  if (cached && cached.length > 0 && !options.forceRefresh) {
    // Si superó el tiempo de frescura, consultar la API en background
    if (!isFresh && isApiEnabled()) {
      void (async () => {
        try {
          const data = await apiGet<{ events: Record<string, unknown>[] }>({ action: 'events' });
          if (data.events) {
            const freshEvents = data.events.map(normalizeEvent);
            const hasChanged = JSON.stringify(freshEvents) !== JSON.stringify(cached);
            lastEventsFetchTime = Date.now();
            inMemoryEvents = freshEvents;
            writeLocal(CONFIG.storageKeys.events, freshEvents);
            if (hasChanged) {
              if (options.onUpdate) options.onUpdate(freshEvents);
              window.dispatchEvent(new CustomEvent('minicross:events-updated', { detail: { events: freshEvents } }));
            }
          }
        } catch {
          /* silencio en background revalidation */
        }
      })();
    }
    return cached;
  }

  // 2. Si no hay caché o se forzó refresco:
  if (isApiEnabled()) {
    try {
      const data = await apiGet<{ events: Record<string, unknown>[] }>({ action: 'events' });
      if (data.events) {
        const freshEvents = data.events.map(normalizeEvent);
        lastEventsFetchTime = Date.now();
        inMemoryEvents = freshEvents;
        writeLocal(CONFIG.storageKeys.events, freshEvents);
        return freshEvents;
      }
    } catch {
      /* fallback abajo */
    }
  }

  if (cached && cached.length > 0) return cached;

  const fromLocal = readLocal<Event[]>(CONFIG.storageKeys.events);
  if (fromLocal?.length) {
    const list = fromLocal.map((e) => normalizeEvent(e as unknown as Record<string, unknown>));
    inMemoryEvents = list;
    return list;
  }

  const fromFile = await fetchJson<Event[]>(asset('data/events.json'));
  const fallbackList = (fromFile ?? []).map((e) => normalizeEvent(e as unknown as Record<string, unknown>));
  if (fallbackList.length > 0) {
    inMemoryEvents = fallbackList;
    writeLocal(CONFIG.storageKeys.events, fallbackList);
  }
  return fallbackList;
}

export async function saveEvents(events: EventSavePayload[]): Promise<void> {
  inMemoryEvents = null;
  lastEventsFetchTime = 0;
  writeLocal(CONFIG.storageKeys.events, events);
  if (isApiEnabled()) {
    await apiPost({ action: 'saveEvents', events });
    return;
  }
}

export interface AdminData {
  events: Event[];
  registrations: Registration[];
  categories: StoredCategory[];
}

export async function loadRegistrations(options: { throwOnError?: boolean; timeoutMs?: number } = {}): Promise<Registration[]> {
  if (isApiEnabled()) {
    try {
      const data = await apiGet<{ registrations: Record<string, unknown>[] }>(
        { action: 'registrations' },
        { timeoutMs: options.timeoutMs ?? 45000 }
      );
      const list = (data.registrations ?? []).map(normalizeRegistration);
      writeLocal(CONFIG.storageKeys.registrations, list);
      return list;
    } catch (err) {
      if (options.throwOnError || (err instanceof Error && err.message === 'No autorizado')) {
        throw err;
      }
      /* fallback below */
    }
  }

  const fromLocal = readLocal<Registration[]>(CONFIG.storageKeys.registrations);
  const fromFile = await fetchJson<Registration[]>(asset('data/registrations.json'));

  const merged = new Map<string, Registration>();
  for (const reg of fromFile ?? []) merged.set(reg.id, normalizeRegistration(reg as unknown as Record<string, unknown>));
  for (const reg of fromLocal ?? []) merged.set(reg.id, normalizeRegistration(reg as unknown as Record<string, unknown>));

  return Array.from(merged.values());
}

/**
 * Carga todos los datos del panel administrativo (eventos, inscripciones y categorías)
 * en una única petición HTTP atómica (action=all) para evitar cuellos de botella y bloqueos concurrentes.
 */
export async function loadAdminData(options: { forceRefresh?: boolean; throwOnError?: boolean } = {}): Promise<AdminData> {
  if (isApiEnabled()) {
    try {
      const data = await apiGet<{
        events?: Record<string, unknown>[];
        registrations?: Record<string, unknown>[];
        categories?: Record<string, unknown>[];
      }>({ action: 'all' }, { timeoutMs: 50000 });

      if (data.registrations && Array.isArray(data.registrations)) {
        const freshRegs = data.registrations.map(normalizeRegistration);
        writeLocal(CONFIG.storageKeys.registrations, freshRegs);

        let freshEvents: Event[] = [];
        if (data.events && Array.isArray(data.events)) {
          freshEvents = data.events.map(normalizeEvent);
          inMemoryEvents = freshEvents;
          lastEventsFetchTime = Date.now();
          writeLocal(CONFIG.storageKeys.events, freshEvents);
        } else {
          freshEvents = await loadEvents({ forceRefresh: options.forceRefresh });
        }

        let freshCategories: StoredCategory[] = [];
        if (data.categories && Array.isArray(data.categories)) {
          freshCategories = data.categories
            .map(normalizeStoredCategory)
            .filter((c): c is StoredCategory => c !== null);
          inMemoryCategories = freshCategories;
          lastCategoriesFetchTime = Date.now();
          writeLocal(CONFIG.storageKeys.categories, freshCategories);
          setCategoryStore(groupCategories(freshCategories));
        } else {
          const cachedCat = getCachedCategoriesSync();
          if (cachedCat) freshCategories = cachedCat;
        }

        return {
          events: freshEvents,
          registrations: freshRegs,
          categories: freshCategories,
        };
      }
    } catch (err) {
      if (options.throwOnError || (err instanceof Error && err.message === 'No autorizado')) {
        throw err;
      }
    }
  }

  // Fallback si la versión del backend no devuelve registrations en action=all:
  const [events, registrations] = await Promise.all([
    loadEvents({ forceRefresh: options.forceRefresh }),
    loadRegistrations({ throwOnError: options.throwOnError, timeoutMs: 45000 }),
    initCategories(options.forceRefresh).catch(() => undefined),
  ]);
  const categories = getCachedCategoriesSync() || [];

  return {
    events,
    registrations,
    categories,
  };
}

export async function saveRegistrations(registrations: Registration[]): Promise<void> {
  if (isApiEnabled()) {
    await apiPost({ action: 'saveRegistrations', registrations });
    return;
  }
  writeLocal(CONFIG.storageKeys.registrations, registrations);
}

export function getTakenPilotNumbers(
  registrations: Registration[],
  eventId: string,
  excludeId?: string
): Set<number> {
  return new Set(
    registrations
      .filter((r) => r.eventId === eventId && r.id !== excludeId)
      .map((r) => r.numeroPiloto)
  );
}

export function isPilotNumberAvailable(
  registrations: Registration[],
  eventId: string,
  number: number,
  excludeId?: string
): boolean {
  return !getTakenPilotNumbers(registrations, eventId, excludeId).has(number);
}

export async function isPilotNumberAvailableAsync(
  eventId: string,
  number: number,
  excludeId?: string
): Promise<boolean> {
  if (isApiEnabled()) {
    return checkPilotNumberRemote(eventId, number, excludeId);
  }
  const registrations = await loadRegistrations();
  return isPilotNumberAvailable(registrations, eventId, number, excludeId);
}

export async function getAvailablePilotNumbers(eventId: string): Promise<number[]> {
  if (isApiEnabled()) {
    const numbers = await fetchAvailablePilotNumbers(eventId);
    if (numbers.length) return numbers;
  }
  const registrations = await loadRegistrations();
  const taken = getTakenPilotNumbers(registrations, eventId);
  return allPilotNumbers().filter((n) => !taken.has(n));
}

function resolveCategoryFields(categoriaIds: string[]): { categoriaId: string; categoriaLabel: string } {
  const labels = categoriaIds.map((id) => {
    const cat = getCategoryById(id);
    return cat ? formatCategoryOptionLabel(cat) : id;
  });
  return {
    categoriaId: categoriaIds.join(','),
    categoriaLabel: labels.join('|'),
  };
}

export async function createRegistration(data: RegistrationFormData): Promise<Registration> {
  const categoryError = validateCategorySelection(data.categoriaIds);
  if (categoryError) throw new Error(categoryError);

  const { categoriaId, categoriaLabel } = resolveCategoryFields(data.categoriaIds);
  const events = await loadEvents();
  const event = events.find((e) => e.id === data.eventId);
  const edad = calculateAge(data.fechaNacimiento, event?.date);
  const now = new Date().toISOString();
  const valorTotalInscripcion = computeRegistrationTotal(event, data.categoriaIds);

  const registration: Registration = {
    id: generateId(),
    eventId: data.eventId,
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    identificacion: data.identificacion.trim(),
    identificacionArchivo: data.identificacionArchivo,
    identificacionFileName: data.identificacionFileName,
    identificacionFileType: data.identificacionFileType,
    comprobantePagoArchivo: data.comprobantePagoArchivo,
    comprobantePagoFileName: data.comprobantePagoFileName,
    comprobantePagoFileType: data.comprobantePagoFileType,
    fechaNacimiento: data.fechaNacimiento,
    edad,
    email: data.email.trim(),
    celular: data.celular.trim(),
    ciudad: data.ciudad.trim(),
    marcaMoto: data.marcaMoto.trim(),
    numeroPiloto: data.numeroPiloto,
    categoriaId,
    categoriaLabel,
    valorTotalInscripcion,
    createdAt: now,
    updatedAt: now,
  };

  if (isApiEnabled()) {
    const result = await apiPost<{ success: boolean; registration: Registration }>({
      action: 'createRegistration',
      data: registration,
    });
    return result.registration ?? registration;
  }

  const registrations = await loadRegistrations();
  if (!isPilotNumberAvailable(registrations, data.eventId, data.numeroPiloto)) {
    throw new Error(`El numero de piloto ${data.numeroPiloto} ya esta registrado en este evento.`);
  }

  registrations.push(registration);
  await saveRegistrations(registrations);
  return registration;
}

export async function updateRegistration(
  id: string,
  updates: Partial<Registration>
): Promise<Registration> {
  if (isApiEnabled()) {
    const result = await apiPost<{ registration: Registration }>({
      action: 'updateRegistration',
      id,
      data: updates,
    });
    return result.registration;
  }

  const registrations = await loadRegistrations();
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Inscripción no encontrada.');

  const current = registrations[index];
  const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
  const events = await loadEvents();
  const event = events.find((e) => e.id === merged.eventId);

  if (
    updates.numeroPiloto !== undefined &&
    !isPilotNumberAvailable(registrations, merged.eventId, merged.numeroPiloto, id)
  ) {
    throw new Error(`El numero de piloto ${merged.numeroPiloto} ya esta en uso.`);
  }

  if (updates.fechaNacimiento) {
    merged.fechaNacimiento = parseSheetDate(updates.fechaNacimiento);
    merged.edad = calculateAge(merged.fechaNacimiento, event?.date);
  }

  if (updates.categoriaId) {
    const categoryIds = updates.categoriaId.split(',').map((id) => id.trim()).filter(Boolean);
    const categoryError = validateCategorySelection(categoryIds);
    if (categoryError) throw new Error(categoryError);
    merged.categoriaId = categoryIds.join(',');
    merged.categoriaLabel = categoryIds
      .map((id) => {
        const cat = getCategoryById(id);
        return cat ? formatCategoryOptionLabel(cat) : id;
      })
      .join('|');
  }

  merged.valorTotalInscripcion = computeRegistrationTotal(
    event,
    merged.categoriaId.split(',').map((id) => id.trim()).filter(Boolean)
  );

  registrations[index] = merged;
  await saveRegistrations(registrations);
  return merged;
}

export async function deleteRegistration(id: string): Promise<void> {
  if (isApiEnabled()) {
    await apiPost({ action: 'deleteRegistration', id });
    return;
  }
  const registrations = await loadRegistrations();
  await saveRegistrations(registrations.filter((r) => r.id !== id));
}

export async function exportAllData(): Promise<AppData> {
  const [events, registrations] = await Promise.all([loadEvents(), loadRegistrations()]);
  return { events, registrations };
}

export async function importData(data: AppData, mode: 'merge' | 'replace' = 'merge'): Promise<void> {
  if (mode === 'replace') {
    await saveEvents(data.events);
    await saveRegistrations(data.registrations);
    return;
  }

  const [existingEvents, existingRegs] = await Promise.all([loadEvents(), loadRegistrations()]);
  const eventMap = new Map(existingEvents.map((e) => [e.id, e]));
  const regMap = new Map(existingRegs.map((r) => [r.id, r]));

  for (const e of data.events) eventMap.set(e.id, e);
  for (const r of data.registrations) regMap.set(r.id, r);

  await saveEvents(Array.from(eventMap.values()));
  await saveRegistrations(Array.from(regMap.values()));
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readLocalResultsMap(): Record<string, EventResults> {
  return readLocal<Record<string, EventResults>>(CONFIG.storageKeys.results) ?? {};
}

function writeLocalResultsMap(map: Record<string, EventResults>): void {
  writeLocal(CONFIG.storageKeys.results, map);
}

function stripUploadsFromResults(payload: EventResultsSavePayload): EventResults {
  const mode = payload.mode ?? (payload.singlePdfUpload || payload.singlePdfUrl ? 'single_pdf' : 'categories');
  return {
    eventId: payload.eventId,
    updatedAt: new Date().toISOString(),
    mode,
    singlePdfUrl: payload.singlePdfUpload?.archivo ?? payload.singlePdfUrl,
    categories: (payload.categories || []).map((cat) => {
      const next: EventResults['categories'][number] = {
        categoryId: cat.categoryId,
        categoryLabel: cat.categoryLabel,
      };
      for (const heat of ['manga1', 'manga2', 'manga3', 'final'] as const) {
        const heatData = cat[heat];
        if (!heatData) continue;
        next[heat] = {
          columns: heatData.columns,
          rows: heatData.rows,
          commentColumn: heatData.commentColumn ?? null,
          pdfUrl: heatData.pdfUrl,
          csvUrl: heatData.csvUrl,
        };
      }
      return next;
    }),
  };
}

export function sanitizeEventResults(results: EventResults | null): EventResults | null {
  if (!results || !Array.isArray(results.categories)) return results;

  let changed = false;
  const categories = results.categories.map((cat) => {
    const updatedCat = { ...cat };
    for (const heatKey of ['manga1', 'manga2', 'manga3', 'final'] as const) {
      const heatData = updatedCat[heatKey];
      if (
        !heatData ||
        !Array.isArray(heatData.columns) ||
        !Array.isArray(heatData.rows) ||
        heatData.rows.length === 0
      ) {
        continue;
      }

      // Caso 1: CSV guardado previamente en 1 sola columna con delimitadores adentro (sobre-comillado de Excel)
      if (heatData.columns.length === 1) {
        const colName = heatData.columns[0];
        if (colName && (colName.includes(',') || colName.includes(';') || colName.includes('\t'))) {
          const rawLines = [
            colName,
            ...heatData.rows.map((r) => r[colName] ?? Object.values(r)[0] ?? ''),
          ];
          try {
            const parsed = parseResultsCsv(rawLines.join('\n'), heatKey as HeatKey);
            updatedCat[heatKey] = {
              ...heatData,
              columns: parsed.columns,
              rows: parsed.rows,
              commentColumn: parsed.commentColumn ?? heatData.commentColumn,
            };
            changed = true;
            continue;
          } catch {
            // Mantener original si falla
          }
        }
      }

      // Caso 2: Celdas con filas de otros pilotos absorbidas (comilla abierta en fila 1 que tragó filas 2, 3...)
      const hasConcatenatedRows = heatData.rows.some((r) =>
        Object.values(r).some(
          (val) =>
            typeof val === 'string' &&
            (/\b[2-9]\d*,\d+,[A-Za-z]/.test(val) || (val.includes('\n') && /\d+/.test(val)))
        )
      );

      if (hasConcatenatedRows) {
        const csvLines: string[] = [heatData.columns.join(',')];
        for (const r of heatData.rows) {
          const lineCells = heatData.columns.map((c) => r[c] ?? '');
          const lineStr = lineCells.join(',');
          const normalized = lineStr.replace(/\s+([2-9]\d*,\d+,[A-Za-z])/g, '\n$1');
          csvLines.push(normalized);
        }
        try {
          const parsed = parseResultsCsv(csvLines.join('\n'), heatKey as HeatKey);
          if (parsed.rows.length > heatData.rows.length) {
            updatedCat[heatKey] = {
              ...heatData,
              columns: parsed.columns,
              rows: parsed.rows,
              commentColumn: parsed.commentColumn ?? heatData.commentColumn,
            };
            changed = true;
            continue;
          }
        } catch {
          // Mantener si falla
        }
      }

      // Caso 3: Filas desplazadas donde se coló el nombre de categoría en una columna de puntos (ej: Juan Castañeda en MX Novatos)
      const currentRows = updatedCat[heatKey]?.rows ?? heatData.rows;
      const currentCols = updatedCat[heatKey]?.columns ?? heatData.columns;
      const totalCol = currentCols.find((c) => /total.*punto|puntos/i.test(c));
      const m1Col = currentCols.find((c) => /^m1$|^r1$/i.test(c));
      const m2Col = currentCols.find((c) => /^m2$|^r2$/i.test(c));

      if (totalCol && m1Col) {
        let rowsFixed = false;
        const newRows = currentRows.map((r) => {
          const row = { ...r };
          const totalVal = (row[totalCol] ?? '').trim();
          if (totalVal && !isNumericValue(totalVal) && isNumericValue(row[m1Col] ?? '')) {
            const realTotal = Number(String(row[m1Col]).replace(',', '.'));
            const realM1 =
              m2Col && isNumericValue(row[m2Col] ?? '') ? Number(String(row[m2Col]).replace(',', '.')) : 0;
            const realM2 = realTotal >= realM1 ? realTotal - realM1 : 0;

            row[totalCol] = String(realTotal);
            row[m1Col] = String(realM1);
            if (m2Col) {
              row[m2Col] = String(realM2);
            }
            rowsFixed = true;
          }
          return row;
        });

        if (rowsFixed) {
          updatedCat[heatKey] = {
            ...(updatedCat[heatKey] ?? heatData),
            rows: newRows,
          };
          changed = true;
        }
      }
    }
    return updatedCat;
  });

  if (!changed) return results;
  return {
    ...results,
    categories,
  };
}

export async function loadEventResults(
  eventId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<EventResults | null> {
  const map = readLocalResultsMap();
  const rawCached = map[eventId] ?? null;
  const cached = sanitizeEventResults(rawCached);
  if (cached && cached !== rawCached) {
    map[eventId] = cached;
    writeLocalResultsMap(map);
  }

  if (cached && !options.forceRefresh) {
    if (isApiEnabled()) {
      // Revalidar en segundo plano
      void (async () => {
        try {
          const data = await apiGet<{ results: EventResults | null }>({
            action: 'results',
            eventId,
          });
          const sanitized = sanitizeEventResults(data.results);
          if (sanitized) {
            const currentMap = readLocalResultsMap();
            currentMap[eventId] = sanitized;
            writeLocalResultsMap(currentMap);
          }
        } catch {
          /* ignorar error de fondo */
        }
      })();
    }
    return cached;
  }

  if (isApiEnabled()) {
    try {
      const data = await apiGet<{ results: EventResults | null }>({
        action: 'results',
        eventId,
      });
      const sanitized = sanitizeEventResults(data.results);
      if (sanitized) {
        const currentMap = readLocalResultsMap();
        currentMap[eventId] = sanitized;
        writeLocalResultsMap(currentMap);
        return sanitized;
      }
      return cached;
    } catch {
      return cached;
    }
  }

  return cached;
}

export async function loadAllPublishedResults(
  championshipId?: ChampionshipId
): Promise<{ event: Event; results: EventResults }[]> {
  const events = await loadEvents();
  const filteredEvents = championshipId
    ? events.filter((e) => e.championshipId === championshipId && eventHasResults(e))
    : events.filter(eventHasResults);

  const resultsList = await Promise.all(
    filteredEvents.map(async (event) => {
      const results = await loadEventResults(event.id);
      return results ? { event, results } : null;
    })
  );

  return resultsList.filter((item): item is { event: Event; results: EventResults } => item !== null);
}

export async function saveEventResults(
  payload: EventResultsSavePayload
): Promise<{ results: EventResults; resultadosUrl: string }> {
  if (isApiEnabled()) {
    const data = await apiPost<{
      success?: boolean;
      results: EventResults;
      resultadosUrl: string;
    }>({
      action: 'saveResults',
      data: payload,
    });
    return {
      results: data.results,
      resultadosUrl: data.resultadosUrl,
    };
  }

  const results = stripUploadsFromResults(payload);
  const map = readLocalResultsMap();
  map[payload.eventId] = results;
  writeLocalResultsMap(map);

  const localMarker = results.mode === 'single_pdf' && results.singlePdfUrl ? results.singlePdfUrl : LOCAL_RESULTS_MARKER;
  const events = await loadEvents();
  const updated = events.map((e) =>
    e.id === payload.eventId ? { ...e, resultadosUrl: localMarker } : e
  );
  await saveEvents(updated);

  return { results, resultadosUrl: localMarker };
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export { isApiEnabled } from './api';