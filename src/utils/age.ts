export function calculateAge(birthDate: string, referenceDate: Date | string = new Date()): number {
  const birthStr = parseSheetDate(birthDate);
  if (!birthStr) return -1;
  const birth = new Date(birthStr + 'T12:00:00');
  if (Number.isNaN(birth.getTime())) return -1;

  let ref: Date;
  if (typeof referenceDate === 'string') {
    const refStr = parseSheetDate(referenceDate);
    ref = new Date(refStr ? refStr + 'T12:00:00' : referenceDate);
  } else if (referenceDate instanceof Date) {
    ref = referenceDate;
  } else {
    ref = new Date();
  }

  if (Number.isNaN(ref.getTime())) return -1;

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  const dayDiff = ref.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
  return age;
}

/**
 * Calcula la edad del piloto al 1ro de enero del año del evento (o fecha de referencia).
 */
export function calculateAgeOnJan1(birthDate: string, referenceDate: Date | string = new Date()): number {
  const birthStr = parseSheetDate(birthDate);
  if (!birthStr) return -1;

  let refYear: number;
  if (typeof referenceDate === 'string') {
    const refStr = parseSheetDate(referenceDate);
    const refDateObj = new Date(refStr ? refStr + 'T12:00:00' : referenceDate);
    refYear = Number.isNaN(refDateObj.getTime()) ? new Date().getFullYear() : refDateObj.getFullYear();
  } else if (referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())) {
    refYear = referenceDate.getFullYear();
  } else {
    refYear = new Date().getFullYear();
  }

  const jan1 = new Date(refYear, 0, 1, 12, 0, 0);
  return calculateAge(birthStr, jan1);
}

/**
 * Valida si un piloto cumple con la edad para una categoría:
 * - Edad mínima: se valida con la edad al día del evento (si el día del evento cumple años, es válido).
 * - Edad máxima: se valida con la edad al 1ro de enero del año correspondiente (en caso de que para la fecha del evento sea mayor).
 */
export function isPilotAgeValidForCategory(
  minAge: number,
  maxAge: number,
  birthDate: string,
  eventDate?: Date | string
): boolean {
  const birthStr = parseSheetDate(birthDate);
  if (!birthStr) return false;

  const ageOnEvent = calculateAge(birthStr, eventDate || new Date());
  if (ageOnEvent < 0) return false;

  const ageOnJan1 = calculateAgeOnJan1(birthStr, eventDate || new Date());
  if (ageOnJan1 < 0) return false;

  // Edad mínima se valida al día del evento
  if (ageOnEvent < minAge) return false;

  // Edad máxima se valida al 1 de enero del año correspondiente
  if (ageOnJan1 > maxAge) return false;

  return true;
}

/** Normaliza fechas de Google Sheets (serial, ISO, texto). */
export function parseSheetDate(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && value > 1000) {
    const utc = new Date((value - 25569) * 86400 * 1000);
    if (!Number.isNaN(utc.getTime())) return utc.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  const d = new Date(str.includes('T') ? str : str + 'T12:00:00');
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return str;
}

export function formatDate(dateInput: unknown): string {
  const dateStr = parseSheetDate(dateInput);
  if (!dateStr) return 'Fecha por confirmar';
  const date = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}