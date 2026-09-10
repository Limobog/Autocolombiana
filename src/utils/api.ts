import { CONFIG } from '../config';
import { PILOT_NUMBER_MAX, PILOT_NUMBER_MIN } from '../types';

export function isApiEnabled(): boolean {
  return Boolean(CONFIG.apiUrl.trim());
}

function buildUrl(params: Record<string, string>): string {
  const url = new URL(CONFIG.apiUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

const inFlightGets = new Map<string, Promise<unknown>>();

export async function apiGet<T>(params: Record<string, string> = {}, options: { timeoutMs?: number } = {}): Promise<T> {
  const password = sessionStorage.getItem('minicross_admin_password');
  const finalParams = { ...params };
  if (password) {
    finalParams.password = password;
  }
  const url = buildUrl(finalParams);

  // Si ya hay una petición idéntica en vuelo, reutilizar la misma promesa
  const existing = inFlightGets.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const timeoutMs = options.timeoutMs ?? 18000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('No se pudo conectar con Google Sheets.');
      const data = (await res.json()) as T & { success?: boolean; error?: string };
      if (data.success === false && data.error) throw new Error(data.error);
      return data;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado al consultar el servidor.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
      inFlightGets.delete(url);
    }
  })();

  inFlightGets.set(url, fetchPromise);
  return fetchPromise;
}

export async function apiPost<T>(body: unknown): Promise<T> {
  // Limpiar peticiones en vuelo al mutar
  inFlightGets.clear();
  const password = sessionStorage.getItem('minicross_admin_password');
  let finalBody = body;
  if (password && typeof body === 'object' && body !== null) {
    finalBody = { ...body, password };
  }
  const res = await fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(finalBody),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error('Error al enviar datos a Google Sheets.');
  const data = (await res.json()) as T & { success?: boolean; error?: string };
  if (data.success === false && data.error) throw new Error(data.error);
  return data;
}

export async function getAvailablePilotNumbers(eventId: string): Promise<number[]> {
  if (isApiEnabled()) {
    const data = await apiGet<{ numbers: number[] }>({
      action: 'availablePilots',
      eventId,
    });
    return data.numbers ?? [];
  }
  return [];
}

export async function checkPilotNumberRemote(
  eventId: string,
  numero: number,
  excludeId?: string
): Promise<boolean> {
  const params: Record<string, string> = {
    action: 'checkPilot',
    eventId,
    numero: String(numero),
  };
  if (excludeId) params.excludeId = excludeId;

  const data = await apiGet<{ available: boolean }>(params);
  return data.available;
}

export function allPilotNumbers(): number[] {
  const nums: number[] = [];
  for (let n = PILOT_NUMBER_MIN; n <= PILOT_NUMBER_MAX; n++) nums.push(n);
  return nums;
}
