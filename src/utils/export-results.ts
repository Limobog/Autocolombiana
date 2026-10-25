import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import type {
  CategoryResults,
  Event,
  EventResults,
  HeatKey,
  ResultsTable,
} from '../types';
import { HEAT_LABELS, getRowComment, isNumericValue } from './parse-results-csv';
import type { ChampionshipCategoryStandings } from './championship';

/**
 * Sanitiza nombres de archivos eliminando caracteres no válidos.
 */
export function sanitizeFileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 60) || 'resultados'
  );
}

/**
 * Sanitiza el nombre de una hoja de Excel (máx 31 caracteres y sin caracteres prohibidos).
 */
export function sanitizeSheetName(name: string, existingNames?: Set<string>): string {
  let clean = name
    .replace(/[\\/?*[\]:]/g, '')
    .trim()
    .slice(0, 31) || 'Resultados';

  if (!existingNames) return clean;

  let candidate = clean;
  let counter = 2;
  while (existingNames.has(candidate.toLowerCase())) {
    const suffix = ` (${counter})`;
    const maxBaseLen = 31 - suffix.length;
    candidate = `${clean.slice(0, maxBaseLen)}${suffix}`;
    counter++;
  }
  existingNames.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Calcula anchos de columnas basados en el contenido para un diseño ordenado y legible.
 */
function autoFitColumns(data: (string | number | undefined)[][]): XLSX.ColInfo[] {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const len = cell !== undefined && cell !== null ? String(cell).length : 0;
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 10, len + 3);
    });
  });
  return colWidths.map((w) => ({ wch: Math.min(Math.max(w, 10), 45) }));
}

/**
 * Muestra notificación flotante al iniciar la descarga.
 */
function notifyDownload(filename: string): void {
  void Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Descargando archivo Excel...',
    text: filename,
    showConfirmButton: false,
    timer: 2500,
    background: '#141414',
    color: '#ffffff',
    customClass: {
      popup: 'rounded-xl border border-emerald-500/30 bg-surface-raised shadow-glow p-4 text-left',
      title: 'font-title text-base text-emerald-400 font-bold',
      htmlContainer: 'text-xs text-silver mt-1',
    },
  });
}

/**
 * Convierte un ResultsTable (manga o final) en una matriz Array-of-Arrays (AoA) lista para hoja de Excel.
 */
function resultsTableToAoA(table: ResultsTable): (string | number)[][] {
  const hasComments = table.rows.some((r) => Boolean(getRowComment(r, table.commentColumn)));
  const headers = [...table.columns];
  if (hasComments && !headers.some((h) => /comentario|incidencia/i.test(h))) {
    headers.push('Incidencias / Comentarios');
  }

  const rowsData: (string | number)[][] = table.rows.map((row) => {
    const cells = table.columns.map((col) => {
      const rawVal = row[col] ?? '';
      const trimmed = rawVal.trim();

      // Convertir a numérico solo columnas que representan números puros de puntuación o vuelta
      const isPos = /^pos(\.|\b)/i.test(col);
      const isPoints = /puntos?|pts/i.test(col);
      const isLaps = /^vueltas?$|^en vuelta$/i.test(col);

      if ((isPos || isPoints || isLaps) && isNumericValue(trimmed)) {
        const num = Number(trimmed.replace(',', '.'));
        if (Number.isFinite(num)) {
          return num;
        }
      }
      return trimmed;
    });

    if (hasComments && headers[headers.length - 1] === 'Incidencias / Comentarios') {
      cells.push(getRowComment(row, table.commentColumn));
    }

    return cells;
  });

  return [headers, ...rowsData];
}

/**
 * Convierte los datos de una categoría de la Tabla General en matriz AoA.
 */
function generalCategoryToAoA(catStandings: ChampionshipCategoryStandings): (string | number)[][] {
  const eventHeaders = catStandings.events.map((ev) => `${ev.shortLabel} (${ev.name})`);
  const headers = [
    'Posición',
    'N° Piloto',
    'Números usados',
    'Nombre Piloto',
    'Moto',
    ...eventHeaders,
    'Total Puntos',
    'Dif. al 1°',
  ];

  const rowsData: (string | number)[][] = catStandings.standings.map((rider) => {
    const eventPoints = catStandings.events.map((ev) => {
      const pts = rider.pointsByEvent[ev.id];
      return pts !== undefined ? pts : 0;
    });

    const diff = rider.position === 1 ? 'Líder' : rider.diffToFirst > 0 ? `-${rider.diffToFirst}` : '0';

    return [
      rider.position,
      rider.number || '-',
      rider.allNumbers.join(' / ') || '-',
      rider.name,
      rider.bike !== '-' ? rider.bike : 'Moto',
      ...eventPoints,
      rider.totalPoints,
      diff,
    ];
  });

  return [headers, ...rowsData];
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN DE RESULTADOS POR VÁLIDA
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Descarga en Excel una manga o final específica de una categoría.
 */
export function exportHeatResultsToExcel(
  event: Event,
  categoryLabel: string,
  heat: HeatKey,
  table: ResultsTable
): void {
  const aoa = resultsTableToAoA(table);
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = autoFitColumns(aoa);

  const workbook = XLSX.utils.book_new();
  const sheetName = sanitizeSheetName(`${categoryLabel} - ${HEAT_LABELS[heat]}`);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const filename = `Resultados_${sanitizeFileName(event.name)}_${sanitizeFileName(categoryLabel)}_${HEAT_LABELS[heat]}.xlsx`;
  notifyDownload(filename);
  XLSX.writeFile(workbook, filename);
}

/**
 * Descarga en Excel todas las mangas / final de una categoría de una válida en un solo libro con pestañas.
 */
export function exportCategoryValidaResultsToExcel(
  event: Event,
  category: CategoryResults
): void {
  const workbook = XLSX.utils.book_new();
  const sheetNames = new Set<string>();
  const heatOrder: HeatKey[] = ['final', 'manga1', 'manga2', 'manga3'];

  let sheetsAdded = 0;
  for (const heat of heatOrder) {
    const table = category[heat];
    if (!table) continue;

    const aoa = resultsTableToAoA(table);
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = autoFitColumns(aoa);

    const sheetName = sanitizeSheetName(HEAT_LABELS[heat], sheetNames);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    sheetsAdded++;
  }

  if (sheetsAdded === 0) {
    throw new Error('No hay resultados disponibles en esta categoría para exportar.');
  }

  const filename = `Resultados_${sanitizeFileName(event.name)}_${sanitizeFileName(category.categoryLabel)}.xlsx`;
  notifyDownload(filename);
  XLSX.writeFile(workbook, filename);
}

/**
 * Descarga en Excel la VÁLIDA COMPLETA (todas las categorías y mangas) en un solo archivo con pestañas.
 */
export function exportEventResultsToExcel(
  event: Event,
  results: EventResults
): void {
  if (!results.categories || results.categories.length === 0) {
    throw new Error('No hay categorías con resultados procesados para este evento.');
  }

  const workbook = XLSX.utils.book_new();
  const sheetNames = new Set<string>();
  const heatOrder: HeatKey[] = ['final', 'manga1', 'manga2', 'manga3'];

  let sheetsAdded = 0;

  for (const cat of results.categories) {
    // Determinar qué mangas están disponibles
    const available = heatOrder.filter((h) => Boolean(cat[h]));
    if (available.length === 0) continue;

    // Si solo tiene clasificación final, nombramos la pestaña simplemente con la categoría
    if (available.length === 1 && available[0] === 'final' && cat.final) {
      const aoa = resultsTableToAoA(cat.final);
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!cols'] = autoFitColumns(aoa);
      const sheetName = sanitizeSheetName(cat.categoryLabel, sheetNames);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      sheetsAdded++;
      continue;
    }

    // Si tiene múltiples mangas (ej: Manga 1, Manga 2, Final)
    for (const heat of available) {
      const table = cat[heat];
      if (!table) continue;

      const aoa = resultsTableToAoA(table);
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!cols'] = autoFitColumns(aoa);

      const labelShort = cat.categoryLabel.split(' — ')[0].trim().slice(0, 18);
      const heatShort = heat === 'final' ? 'Final' : heat.replace('manga', 'M');
      const sheetName = sanitizeSheetName(`${labelShort} ${heatShort}`, sheetNames);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      sheetsAdded++;
    }
  }

  if (sheetsAdded === 0) {
    throw new Error('No se encontraron tablas de resultados en este evento para exportar.');
  }

  const filename = `Resultados_Completos_${sanitizeFileName(event.name)}.xlsx`;
  notifyDownload(filename);
  XLSX.writeFile(workbook, filename);
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN DE TABLA GENERAL (ACUMULADO DEL CAMPEONATO)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Descarga en Excel la Tabla General acumulada de UNA SOLA categoría.
 */
export function exportGeneralCategoryToExcel(
  catStandings: ChampionshipCategoryStandings,
  champName: string
): void {
  const aoa = generalCategoryToAoA(catStandings);
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = autoFitColumns(aoa);

  const workbook = XLSX.utils.book_new();
  const sheetName = sanitizeSheetName(catStandings.categoryLabel);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const filename = `General_${sanitizeFileName(champName)}_${sanitizeFileName(catStandings.categoryLabel)}.xlsx`;
  notifyDownload(filename);
  XLSX.writeFile(workbook, filename);
}

/**
 * Descarga en Excel la TABLA GENERAL COMPLETA (todas las categorías del campeonato) en un solo archivo con pestañas.
 */
export function exportCompleteGeneralStandingsToExcel(
  standings: ChampionshipCategoryStandings[],
  champName: string
): void {
  if (!standings || standings.length === 0) {
    throw new Error('No hay clasificaciones generales disponibles para exportar.');
  }

  const workbook = XLSX.utils.book_new();
  const sheetNames = new Set<string>();

  for (const cat of standings) {
    const aoa = generalCategoryToAoA(cat);
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = autoFitColumns(aoa);

    const sheetName = sanitizeSheetName(cat.categoryLabel, sheetNames);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const filename = `Tabla_General_Completa_${sanitizeFileName(champName)}.xlsx`;
  notifyDownload(filename);
  XLSX.writeFile(workbook, filename);
}
