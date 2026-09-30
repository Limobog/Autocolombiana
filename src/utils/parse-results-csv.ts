import type { HeatKey } from '../types';

export type { HeatKey };

export const HEAT_LABELS: Record<HeatKey, string> = {
  manga1: 'Manga 1',
  manga2: 'Manga 2',
  manga3: 'Manga 3',
  final: 'Final',
};

export const HEAT_KEYS: HeatKey[] = ['manga1', 'manga2', 'manga3', 'final'];

/** Orden preferido de columnas para mangas (la columna Comentario no se muestra). */
const MANGA_COLUMN_ORDER = [
  'Pos.',
  'N°',
  'Nombre',
  'Clase',
  'MOTO',
  'Mejor Tm',
  'Vueltas',
  'En Vuelta',
  'Puntos',
  'Dif. resp. 1°',
  'Dif. resp. anterior',
];

/** Orden preferido de columnas para la final. */
const FINAL_COLUMN_ORDER = [
  'Pos.',
  'N°',
  'Nombre',
  'Clase',
  'Total puntos',
  'Dif. resp. 1°',
  'M1',
  'M2',
  'M3',
  'DOC/EPS',
  'MOTO',
  'R1.',
  'R2.',
  'R3.',
];

const COMMENT_ALIASES = ['comentario', 'comentarios', 'comment', 'comments'];

export interface ParsedResultsTable {
  columns: string[];
  rows: Array<Record<string, string>>;
  commentColumn: string | null;
}

function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function isCommentHeader(header: string): boolean {
  return COMMENT_ALIASES.includes(normalizeHeaderKey(header));
}

/**
 * Detecta automáticamente el delimitador del CSV (',', ';' o '\t')
 * analizando la consistencia de columnas en las primeras líneas.
 */
export function detectDelimiter(text: string): string {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 10);

  if (lines.length === 0) return ',';

  const candidates = [';', ',', '\t'];
  const scores: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };

  for (const delim of candidates) {
    let consistentCols = -1;
    let matchingLines = 0;

    for (const line of lines) {
      let count = 0;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (!inQuotes && ch === delim) {
          count++;
        }
      }

      if (count > 0) {
        if (consistentCols === -1) {
          consistentCols = count;
          matchingLines = 1;
        } else if (consistentCols === count) {
          matchingLines++;
        }
      }
    }

    if (consistentCols > 0) {
      scores[delim] = matchingLines * 10 + consistentCols;
    }
  }

  // Si punto y coma es igual o mejor que coma, se prefiere ';'
  // (caso estándar de Excel en español para no colisionar con decimales "1,25")
  if (scores[';'] > 0 && scores[';'] >= scores[','] && scores[';'] >= scores['\t']) {
    return ';';
  }
  if (scores['\t'] > 0 && scores['\t'] > scores[','] && scores['\t'] > scores[';']) {
    return '\t';
  }
  if (scores[','] > 0) {
    return ',';
  }

  return ',';
}

export function isNumericValue(str: string): boolean {
  if (!str) return false;
  const cleaned = str.replace(',', '.').trim();
  return !isNaN(Number(cleaned)) && isFinite(Number(cleaned));
}

function parseRawCsv(text: string, delimiter?: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const input = text.replace(/^\uFEFF/, '');
  const delim = delimiter || detectDelimiter(input);

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      } else if (ch === '"') {
        inQuotes = false;
        continue;
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        // En resultados deportivos, si la siguiente línea comienza con un número de posición (ej: "2," o 2,),
        // el salto de línea nunca es parte de un campo de texto; es una nueva fila con comilla mal cerrada.
        const rest = input.slice(ch === '\r' ? i + 2 : i + 1).trimStart();
        if (/^"?\d+"?[,;\t]/.test(rest)) {
          inQuotes = false;
          row.push(field);
          field = '';
          if (row.some((cell) => cell.trim() !== '')) rows.push(row);
          row = [];
          if (ch === '\r') i++;
          continue;
        }
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === delim) {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      if (ch === '\r') i++;
      continue;
    }

    if (ch === '\r') {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  return rows;
}

/**
 * Parseo CSV con soporte de:
 * 1. Autodetección de delimitador (',', ';', '\t').
 * 2. Comillas estándar y saltos de línea dentro de campos.
 * 3. Autocorrección de CSV "sobre-comillado" (cuando Excel exporta cada fila como una celda única entre comillas).
 */
export function parseCsvText(text: string, delimiter?: string): string[][] {
  let matrix = parseRawCsv(text, delimiter);

  // Si todas las filas o la fila de encabezados quedaron en 1 sola columna,
  // pero el contenido dentro de esa columna tiene delimitadores que forman un CSV
  // (caso típico cuando se pega el CSV completo en la Columna A de Excel y se guarda como CSV),
  // des-envolvemos automáticamente el contenido.
  for (let pass = 0; pass < 2; pass++) {
    if (
      matrix.length > 0 &&
      matrix[0].length === 1 &&
      (matrix.length === 1 || matrix[1]?.length === 1)
    ) {
      const candidateText = matrix.map((row) => row[0] ?? '').join('\n');
      const candidateDelim = delimiter || detectDelimiter(candidateText);
      const unwrapped = parseRawCsv(candidateText, candidateDelim);
      if (unwrapped.length > 0 && unwrapped[0].length > 1) {
        matrix = unwrapped;
        continue;
      }
    }
    break;
  }

  return matrix;
}

function orderColumns(headers: string[], preferred: string[]): string[] {
  const remaining = [...headers];
  const ordered: string[] = [];

  for (const pref of preferred) {
    const prefKey = normalizeHeaderKey(pref);
    const idx = remaining.findIndex((h) => normalizeHeaderKey(h) === prefKey);
    if (idx >= 0) {
      ordered.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
  }

  return [...ordered, ...remaining];
}

/**
 * Parsea un CSV de resultados de manga o final.
 * Las columnas se muestran en orden preferido; columnas extra al final.
 * La columna Comentario no forma parte de `columns` (queda en cada fila).
 */
export function parseResultsCsv(text: string, heat: HeatKey): ParsedResultsTable {
  const matrix = parseCsvText(text);
  if (matrix.length < 2) {
    throw new Error('El CSV no tiene filas de datos.');
  }

  const rawHeaders = matrix[0].map((h) => h.trim().replace(/^["']+|["']+$/g, ''));
  if (rawHeaders.every((h) => !h)) {
    throw new Error('El CSV no tiene encabezados validos.');
  }

  let commentColumn: string | null = null;
  const dataHeaders: string[] = [];

  for (const header of rawHeaders) {
    if (!header) continue;
    if (isCommentHeader(header)) {
      commentColumn = header;
      continue;
    }
    dataHeaders.push(header);
  }

  if (dataHeaders.length === 0) {
    throw new Error('El CSV no tiene columnas de resultados.');
  }

  const preferred = heat === 'final' ? FINAL_COLUMN_ORDER : MANGA_COLUMN_ORDER;
  const columns = orderColumns(dataHeaders, preferred);

  const rows = matrix.slice(1).map((rawCells) => {
    let cells = rawCells.map((c) => c.trim().replace(/^["']+|["']+$/g, ''));

    // 1. Expandir celdas fusionadas (ej: "15,15" en vez de dos celdas 15 y 15 por error de comillas en el CSV)
    if (cells.length < rawHeaders.length) {
      const expanded: string[] = [];
      for (const cell of cells) {
        if (cell.includes(',') && expanded.length + (cells.length - expanded.length) <= rawHeaders.length) {
          const sub = cell.split(',').map((s) => s.trim().replace(/^["']+|["']+$/g, ''));
          if (sub.length > 1) {
            expanded.push(...sub);
            continue;
          }
        }
        expanded.push(cell);
      }
      if (expanded.length === rawHeaders.length) {
        cells = expanded;
      }
    }

    // 2. Si la fila tiene una columna extra con el nombre de la categoría/clase entre el nombre y los puntos
    // Ejemplo: [Pos, N°, Nombre, "MX Novatos", Total puntos, M1, M2] cuando rawHeaders solo tiene [Pos, N°, Nombre, Total puntos, M1, M2]
    if (cells.length === rawHeaders.length + 1) {
      const h3 = rawHeaders[3]?.toLowerCase() || '';
      const isPointsHeader = h3.includes('punto') || h3.includes('total') || h3.includes('m1') || h3.includes('r1');
      const val3 = cells[3]?.trim();
      const val4 = cells[4]?.trim();
      if (isPointsHeader && !isNumericValue(val3) && isNumericValue(val4)) {
        cells.splice(3, 1);
      }
    }

    const record: Record<string, string> = {};
    rawHeaders.forEach((header, i) => {
      if (!header) return;
      record[header] = (cells[i] ?? '').trim();
    });
    if (commentColumn && !(commentColumn in record)) {
      record[commentColumn] = '';
    }
    return record;
  });

  return { columns, rows, commentColumn };
}

/**
 * Lee un archivo de texto soportando tanto UTF-8 (con o sin BOM)
 * como codificaciones ANSI / Windows-1252 / ISO-8859-1 típicas de Excel en Windows.
 */
export async function readFileAsText(file: File): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof file.arrayBuffer === 'function') {
    buffer = await file.arrayBuffer();
  } else {
    buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo CSV.'));
      reader.readAsArrayBuffer(file);
    });
  }

  const bytes = new Uint8Array(buffer);

  // 1. Intentar UTF-8 estricto (fatal: true falla si hay secuencias ANSI de Windows que no sean UTF-8 válido)
  if (typeof TextDecoder !== 'undefined') {
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      const text = utf8Decoder.decode(bytes);
      if (!text.includes('\uFFFD')) {
        return text;
      }
    } catch {
      // Secuencia no válida en UTF-8 -> proviene de Excel Windows ANSI (Windows-1252)
    }

    // 2. Probar Windows-1252 (estándar de Excel en español: tildes, eñes, °, etc.)
    try {
      const win1252Decoder = new TextDecoder('windows-1252');
      return win1252Decoder.decode(bytes);
    } catch {
      // Continuar al siguiente fallback
    }

    // 3. Fallback a ISO-8859-1
    try {
      const isoDecoder = new TextDecoder('iso-8859-1');
      return isoDecoder.decode(bytes);
    } catch {
      // Continuar al FileReader
    }
  }

  // Fallback final
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo CSV.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function getRowComment(row: Record<string, string>, commentColumn?: string | null): string {
  if (commentColumn && row[commentColumn]?.trim()) return row[commentColumn].trim();
  for (const [key, value] of Object.entries(row)) {
    if (isCommentHeader(key) && value.trim()) return value.trim();
  }
  return '';
}
