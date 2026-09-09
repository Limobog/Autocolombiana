import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import { getActiveChampionship } from '../championships';
import { eventHasResults, loadEvents, loadAllPublishedResults } from '../utils/storage';
import { formatDate } from '../utils/age';
import { HEAT_KEYS, HEAT_LABELS, getRowComment } from '../utils/parse-results-csv';
import {
  computeChampionshipStandings,
  type ChampionshipCategoryStandings,
  type ChampionshipRiderStanding,
} from '../utils/championship';
import type { CategoryResults, Event, EventResults, HeatKey, ResultsTable } from '../types';
import Swal from 'sweetalert2';

type ResultsViewMode = 'general' | 'valida';

function getUrlParams(): { eventId: string | null; vista: ResultsViewMode } {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('evento');
  const vistaParam = params.get('vista');

  let vista: ResultsViewMode = 'general';
  if (vistaParam === 'valida' || (eventId && vistaParam !== 'general')) {
    vista = 'valida';
  }

  return { eventId, vista };
}

function updateUrl(params: { eventId?: string | null; vista: ResultsViewMode }): void {
  const url = new URL(window.location.href);
  url.searchParams.set('vista', params.vista);
  if (params.eventId) {
    url.searchParams.set('evento', params.eventId);
  } else {
    url.searchParams.delete('evento');
  }
  window.history.pushState(null, '', url.toString());
}

function availableHeats(category: CategoryResults): HeatKey[] {
  return HEAT_KEYS.filter((key) => Boolean(category[key]));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getDriveEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([-\w]{25,})/i) ||
    trimmed.match(/[?&]id=([-\w]{25,})/i) ||
    trimmed.match(/[-\w]{25,}/);

  if (fileIdMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    const fileId = fileIdMatch[1] || fileIdMatch[0];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return trimmed;
}

export function getDriveDirectViewUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([-\w]{25,})/i) ||
    trimmed.match(/[?&]id=([-\w]{25,})/i) ||
    trimmed.match(/[-\w]{25,}/);

  if (fileIdMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    const fileId = fileIdMatch[1] || fileIdMatch[0];
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }
  return trimmed;
}

// ─── TABLA DE RESULTADOS DE MANGA / FINAL ────────────────────────────────────

function renderTable(table: ResultsTable, heat: HeatKey, categoryId: string): string {
  const commentCol = table.commentColumn;
  const rowsHtml = table.rows
    .map((row, rowIndex) => {
      const comment = getRowComment(row, commentCol);
      const cells = table.columns
        .map((col) => `<td class="px-4 py-3 text-sm whitespace-nowrap text-silver">${escapeHtml(row[col] ?? '')}</td>`)
        .join('');
      const commentBtn = comment
        ? `<td class="px-4 py-3 text-center">
            <button type="button"
              class="comment-btn inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white hover:border-white hover:bg-white/15 transition-all text-xs font-bold shadow-glow cursor-pointer"
              data-category="${categoryId}" data-heat="${heat}" data-row="${rowIndex}"
              title="Ver incidencia/comentario" aria-label="Ver comentario">!</button>
          </td>`
        : '<td class="px-4 py-3"></td>';
      return `<tr class="border-t border-white/10 hover:bg-white/5 transition-colors">${cells}${commentBtn}</tr>`;
    })
    .join('');

  const headers = table.columns
    .map((col) => `<th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-silver">${escapeHtml(col)}</th>`)
    .join('');

  return `
    <div class="overflow-x-auto rounded-xl border border-white/15 bg-surface-raised/40">
      <table class="min-w-full">
        <thead class="bg-surface-elevated border-b border-white/10">
          <tr>${headers}<th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-silver text-center">Info</th></tr>
        </thead>
        <tbody class="divide-y divide-white/5">${rowsHtml || '<tr><td class="px-4 py-8 text-center text-muted text-sm" colspan="' + (table.columns.length + 1) + '">Sin filas de resultados</td></tr>'}</tbody>
      </table>
    </div>`;
}

function renderHeatPanel(category: CategoryResults, heat: HeatKey, active: boolean): string {
  const table = category[heat];
  if (!table) return '';

  const pdfUrl = table.pdfUrl ? getDriveDirectViewUrl(table.pdfUrl) : '';
  const pdfBtn =
    heat !== 'final' && pdfUrl
      ? `<a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Vuelta a vuelta (PDF)</a>`
      : heat !== 'final'
        ? '<span class="text-xs text-muted">Sin PDF adjunto</span>'
        : '';

  return `
    <div class="heat-panel ${active ? '' : 'hidden'} space-y-4" data-heat-panel="${category.categoryId}:${heat}">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h3 class="font-title text-2xl tracking-wider text-white">${HEAT_LABELS[heat]}</h3>
        ${pdfBtn}
      </div>
      ${renderTable(table, heat, category.categoryId)}
    </div>`;
}

function renderCategoryPanel(category: CategoryResults, active: boolean): string {
  const heats = availableHeats(category);
  if (heats.length === 0) return '';

  const heatTabs = heats
    .map(
      (heat, i) => `
      <button type="button"
        class="heat-tab rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
          i === 0
            ? 'bg-white text-ink font-bold shadow-glow'
            : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
        }"
        data-category="${category.categoryId}" data-heat="${heat}">
        ${HEAT_LABELS[heat]}
      </button>`
    )
    .join('');

  return `
    <div class="category-panel ${active ? '' : 'hidden'} space-y-5" data-category-panel="${category.categoryId}">
      ${heats.length > 1 ? `<div class="flex flex-wrap gap-2.5">${heatTabs}</div>` : ''}
      ${heats.map((heat, i) => renderHeatPanel(category, heat, i === 0)).join('')}
    </div>`;
}

// ─── TABLA GENERAL DEL CAMPEONATO (ACUMULADO) ──────────────────────────────

function renderPodiumCard(rider: ChampionshipRiderStanding | undefined, position: 1 | 2 | 3): string {
  if (!rider) return '';

  const config = {
    1: {
      medal: '🥇',
      label: '1° LUGAR',
      cardBorder: 'border-yellow-500/50 hover:border-yellow-400',
      bgGradient: 'from-yellow-500/15 via-surface-elevated to-yellow-500/5',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      orderClass: 'order-1 md:order-2 md:-translate-y-2',
    },
    2: {
      medal: '🥈',
      label: '2° LUGAR',
      cardBorder: 'border-slate-300/40 hover:border-slate-200',
      bgGradient: 'from-slate-300/10 via-surface-elevated to-slate-400/5',
      badgeBg: 'bg-slate-400/20 text-slate-200 border border-slate-400/30',
      orderClass: 'order-2 md:order-1',
    },
    3: {
      medal: '🥉',
      label: '3° LUGAR',
      cardBorder: 'border-amber-700/40 hover:border-amber-600',
      bgGradient: 'from-amber-700/15 via-surface-elevated to-amber-900/5',
      badgeBg: 'bg-amber-700/20 text-amber-300 border border-amber-700/30',
      orderClass: 'order-3 md:order-3',
    },
  }[position];

  return `
    <div class="rounded-2xl border ${config.cardBorder} bg-gradient-to-b ${config.bgGradient} p-5 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 shadow-card ${config.orderClass}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-2xl">${config.medal}</span>
        <span class="text-xs font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${config.badgeBg}">
          ${config.label}
        </span>
      </div>
      <p class="font-title text-xl md:text-2xl text-white mt-1 leading-tight tracking-wide">${escapeHtml(rider.name)}</p>
      <div class="mt-2 flex items-center justify-center gap-2">
        <span class="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-white border border-white/15">
          ${escapeHtml(rider.number || '#-')}
        </span>
        <span class="text-xs text-silver">${escapeHtml(rider.bike !== '-' ? rider.bike : 'Moto')}</span>
      </div>
      <div class="mt-4 pt-3 border-t border-white/10 w-full flex items-baseline justify-center gap-1.5">
        <span class="font-title text-3xl md:text-4xl font-bold text-white tracking-wider">${rider.totalPoints}</span>
        <span class="text-xs uppercase tracking-wide text-silver font-medium">pts</span>
      </div>
    </div>`;
}

function renderGeneralCategoryPanel(catStandings: ChampionshipCategoryStandings, active: boolean): string {
  const riders = catStandings.standings;
  const events = catStandings.events;

  const top1 = riders[0];
  const top2 = riders[1];
  const top3 = riders[2];

  const podiumHtml =
    riders.length > 0
      ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-4xl mx-auto">
          ${renderPodiumCard(top2, 2)}
          ${renderPodiumCard(top1, 1)}
          ${renderPodiumCard(top3, 3)}
        </div>`
      : '';

  const eventHeaders = events
    .map(
      (ev) => `
      <th class="px-3 py-3 text-center text-xs uppercase tracking-wider text-silver font-bold" title="${escapeHtml(ev.name)} (${formatDate(ev.date)})">
        ${escapeHtml(ev.shortLabel)}
      </th>`
    )
    .join('');

  const rowsHtml = riders
    .map((rider) => {
      const posClass =
        rider.position === 1
          ? 'bg-yellow-500/10 text-yellow-300 font-bold'
          : rider.position === 2
            ? 'bg-slate-400/10 text-slate-200 font-bold'
            : rider.position === 3
              ? 'bg-amber-700/10 text-amber-300 font-bold'
              : 'text-silver';

      const posBadge =
        rider.position === 1
          ? '<span class="inline-flex items-center gap-1">🥇 1</span>'
          : rider.position === 2
            ? '<span class="inline-flex items-center gap-1">🥈 2</span>'
            : rider.position === 3
              ? '<span class="inline-flex items-center gap-1">🥉 3</span>'
              : `<span>${rider.position}</span>`;

      const eventPointsCells = events
        .map((ev) => {
          const pts = rider.pointsByEvent[ev.id];
          const ptsFormatted = pts !== undefined ? pts : '-';
          return `<td class="px-3 py-2.5 text-center text-sm font-mono whitespace-nowrap text-silver">${ptsFormatted}</td>`;
        })
        .join('');

      const diffText = rider.position === 1 ? 'Líder' : rider.diffToFirst > 0 ? `-${rider.diffToFirst}` : '0';

      return `
        <tr class="border-t border-white/10 hover:bg-white/5 transition-colors">
          <td class="px-3 py-2.5 text-center text-sm whitespace-nowrap ${posClass}">
            ${posBadge}
          </td>
          <td class="px-3 py-2.5 text-center text-sm font-mono font-bold text-white whitespace-nowrap">
            <span>${escapeHtml(rider.number || '-')}</span>
            ${
              rider.allNumbers.length > 1
                ? `<span class="block text-[10px] text-muted font-normal" title="Números usados: ${escapeHtml(rider.allNumbers.join(', '))}">(${escapeHtml(rider.allNumbers.join(' / '))})</span>`
                : ''
            }
          </td>
          <td class="px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap">
            ${escapeHtml(rider.name)}
          </td>
          <td class="px-3 py-2.5 text-sm text-silver whitespace-nowrap">
            ${escapeHtml(rider.bike || '-')}
          </td>
          ${eventPointsCells}
          <td class="px-4 py-2.5 text-center text-sm font-title font-bold text-white bg-white/5 whitespace-nowrap">
            ${rider.totalPoints}
          </td>
          <td class="px-3 py-2.5 text-center text-xs text-silver whitespace-nowrap">
            ${diffText}
          </td>
        </tr>`;
    })
    .join('');

  return `
    <div class="general-category-panel ${active ? '' : 'hidden'} space-y-6" data-general-category-panel="${catStandings.categoryId}">
      ${podiumHtml}

      <div class="rounded-2xl border border-white/15 overflow-hidden bg-surface-raised/60 shadow-card">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-surface-elevated border-b border-white/10">
              <tr>
                <th class="px-3 py-3 text-center text-xs uppercase tracking-wider text-silver">Pos.</th>
                <th class="px-3 py-3 text-center text-xs uppercase tracking-wider text-silver font-mono">N°</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider text-silver">Piloto</th>
                <th class="px-3 py-3 text-left text-xs uppercase tracking-wider text-silver">Moto</th>
                ${eventHeaders}
                <th class="px-4 py-3 text-center text-xs uppercase tracking-wider text-white bg-white/10 font-bold">Total Pts</th>
                <th class="px-3 py-3 text-center text-xs uppercase tracking-wider text-silver">Dif. 1°</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td class="px-4 py-8 text-center text-muted" colspan="' + (events.length + 6) + '">No hay datos de pilotos en esta categoría.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted px-1">
        <p>ℹ️ <strong>Criterio oficial:</strong> Sumatoria calculada con los puntos de la clasificación final (o manga única) de cada válida disputada.</p>
        <div class="flex flex-wrap items-center gap-2">
          ${events.map((ev) => `<span class="border border-white/10 bg-surface-elevated rounded-lg px-2.5 py-1 text-silver"><strong>${escapeHtml(ev.shortLabel)}:</strong> ${escapeHtml(ev.name)}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderGeneralView(standings: ChampionshipCategoryStandings[], champTitle: string): string {
  if (standings.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white mb-4 text-3xl">
          🏆
        </div>
        <h2 class="font-title text-2xl text-white mb-2">Sin válidas finalizadas aún</h2>
        <p class="text-muted max-w-md mx-auto mb-6">
          Aún no se han publicado resultados de mangas finales o clasificaciones oficiales para calcular el acumulado de puntos de este campeonato.
        </p>
        <a href="./eventos.html" class="btn-primary inline-block">Ver calendario de eventos</a>
      </div>`;
  }

  const categoryTabs = standings
    .map(
      (cat, i) => `
      <button type="button"
        class="general-category-tab rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
          i === 0
            ? 'bg-white text-ink font-bold shadow-glow'
            : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
        }"
        data-general-category="${cat.categoryId}">
        ${escapeHtml(cat.categoryLabel)}
      </button>`
    )
    .join('');

  return `
    <div class="space-y-6">
      <div class="text-center max-w-2xl mx-auto mb-6">
        <h2 class="font-title text-3xl md:text-4xl tracking-wider text-white mb-2">Tabla General de Posiciones</h2>
        <p class="text-sm text-silver font-semibold">${escapeHtml(champTitle)}</p>
        <p class="text-xs text-muted mt-1">
          Sumatoria oficial de puntos acumulados válida a válida (clasificación final consolidada)
        </p>
      </div>

      <div class="flex flex-wrap gap-2 justify-center mb-6">
        ${categoryTabs}
      </div>

      <div id="general-category-panels">
        ${standings.map((cat, i) => renderGeneralCategoryPanel(cat, i === 0)).join('')}
      </div>
    </div>`;
}

// ─── VISTA DE DOCUMENTO PDF ÚNICO ──────────────────────────────────────────

function renderSinglePdfContent(
  event: Event,
  pdfUrl: string,
  allPublishedEvents: Event[],
  results?: EventResults | null
): string {
  const embedUrl = getDriveEmbedUrl(pdfUrl);
  const openUrl = getDriveDirectViewUrl(pdfUrl);
  const hasCategories = results?.categories && results.categories.length > 0;

  const eventPills =
    allPublishedEvents.length > 1
      ? `<div class="mb-6 flex flex-wrap items-center justify-center gap-2">
          <span class="text-xs text-muted font-medium self-center mr-1">Válida:</span>
          ${allPublishedEvents
            .map(
              (e) => `
            <a href="./resultados.html?evento=${e.id}&vista=valida"
               class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                 e.id === event.id
                   ? 'bg-white text-ink font-bold shadow-glow'
                   : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
               }">
              ${escapeHtml(e.name)}
            </a>`
            )
            .join('')}
        </div>`
      : '';

  const championshipBanner = hasCategories
    ? `<div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-white/15 bg-surface-elevated shadow-card">
        <div class="flex items-center gap-2.5">
          <span class="text-lg">🏆</span>
          <div>
            <p class="text-xs font-bold text-white">Clasificación general acumulada disponible</p>
            <p class="text-[11px] text-silver">Los puntos de esta válida ya están sumados a la tabla del campeonato.</p>
          </div>
        </div>
        <a href="./resultados.html?vista=general" class="btn-secondary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5">
          Ver Tabla General de Posiciones →
        </a>
      </div>`
    : '';

  return `
    <div class="text-left space-y-6">
      ${eventPills}
      <div class="text-center mb-6">
        <h2 class="font-title text-3xl tracking-wide text-white mb-1">${escapeHtml(event.name)}</h2>
        <p class="text-silver font-semibold text-sm">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
        <p class="text-xs text-muted mt-1">Documento oficial único de resultados</p>
      </div>

      ${championshipBanner}

      <div class="flex flex-wrap items-center justify-center gap-3">
        <a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary text-sm font-bold px-6 py-3 inline-flex items-center gap-2 shadow-glow cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Abrir / Descargar PDF Oficial
        </a>
        <a href="${embedUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline text-sm font-semibold px-5 py-3 inline-flex items-center gap-2 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          Pestaña completa
        </a>
      </div>

      <div class="rounded-2xl border border-white/15 bg-surface-raised overflow-hidden shadow-2xl">
        <div class="bg-surface-elevated px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span class="text-xs font-semibold text-silver flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Planilla Oficial de Resultados
          </span>
          <a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-silver hover:text-white underline font-medium">Ver en ventana externa</a>
        </div>
        <div class="w-full h-[75vh] min-h-[500px] bg-neutral-900">
          <iframe src="${embedUrl}" class="w-full h-full border-0" title="Resultados del evento ${escapeHtml(event.name)}" allow="autoplay"></iframe>
        </div>
      </div>

      <div class="text-center pt-4">
        <a href="./eventos.html" class="btn-outline inline-block">Volver a eventos</a>
      </div>
    </div>`;
}

// ─── VISTA POR VÁLIDA INDIVIDUAL ───────────────────────────────────────────

function renderValidaView(
  event: Event,
  results: EventResults | null,
  allPublishedEvents: Event[]
): string {
  // Comprobar si el evento está en modo PDF único
  const singlePdf =
    results?.singlePdfUrl ||
    (event.resultadosUrl &&
    (event.resultadosUrl.toLowerCase().includes('.pdf') ||
      event.resultadosUrl.startsWith('data:application/pdf') ||
      (results?.mode === 'single_pdf' && event.resultadosUrl !== 'local'))
      ? event.resultadosUrl
      : undefined);

  if ((results?.mode === 'single_pdf' && singlePdf) || (singlePdf && (!results || results.categories.length === 0))) {
    return renderSinglePdfContent(event, singlePdf, allPublishedEvents, results);
  }

  const eventPills =
    allPublishedEvents.length > 1
      ? `<div class="mb-6 flex flex-wrap items-center justify-center gap-2">
          <span class="text-xs text-muted font-medium self-center mr-1">Válida:</span>
          ${allPublishedEvents
            .map(
              (e) => `
            <a href="./resultados.html?evento=${e.id}&vista=valida"
               class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                 e.id === event.id
                   ? 'bg-white text-ink font-bold shadow-glow'
                   : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
               }">
              ${escapeHtml(e.name)}
            </a>`
            )
            .join('')}
        </div>`
      : '';

  if (!results || results.categories.length === 0) {
    return `
      <div class="text-left">
        ${eventPills}
        <div class="text-center py-8">
          <h2 class="font-title text-2xl mb-2 text-white">${escapeHtml(event.name)}</h2>
          <p class="text-sm text-silver mb-4">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
          <p class="text-muted">Aún no hay tablas de resultados publicadas para este evento.</p>
          <a href="./eventos.html" class="btn-outline inline-block mt-6">Volver a eventos</a>
        </div>
      </div>`;
  }

  const categories = results.categories.filter((c) => availableHeats(c).length > 0);
  if (categories.length === 0) {
    return `
      <div class="text-left">
        ${eventPills}
        <div class="text-center py-8">
          <h2 class="font-title text-2xl mb-2 text-white">${escapeHtml(event.name)}</h2>
          <p class="text-sm text-silver mb-4">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
          <p class="text-muted">Aún no hay resultados procesados para este evento.</p>
        </div>
      </div>`;
  }

  const categoryTabs = categories
    .map(
      (cat, i) => `
      <button type="button"
        class="category-tab rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
          i === 0
            ? 'bg-white text-ink font-bold shadow-glow-strong'
            : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
        }"
        data-category="${cat.categoryId}">
        ${escapeHtml(cat.categoryLabel)}
      </button>`
    )
    .join('');

  return `
    <div class="text-left space-y-6">
      ${eventPills}
      <div class="text-center mb-6">
        <h2 class="font-title text-3xl tracking-wide text-white mb-1">${escapeHtml(event.name)}</h2>
        <p class="text-silver font-semibold text-sm">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
        <p class="text-xs text-muted mt-1">Clasificación oficial por categorías</p>
      </div>
      <div class="flex flex-wrap gap-2 mb-6 justify-center">${categoryTabs}</div>
      ${categories.map((cat, i) => renderCategoryPanel(cat, i === 0)).join('')}
      <div class="text-center mt-8">
        <a href="./eventos.html" class="btn-outline inline-block">Ver todos los eventos</a>
      </div>
    </div>`;
}

// ─── CONTROLADOR PRINCIPAL Y CONMUTADOR ────────────────────────────────────

function renderViewSwitcher(activeMode: ResultsViewMode): string {
  return `
    <div class="flex justify-center mb-8">
      <div class="inline-flex rounded-xl p-1 bg-surface-elevated border border-white/15 shadow-glow">
        <button type="button" id="view-mode-general"
          class="flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
            activeMode === 'general'
              ? 'bg-white text-ink font-bold shadow-glow'
              : 'text-silver hover:text-white hover:bg-white/5'
          }">
          <span>🏆</span>
          <span>Tabla General (Acumulado)</span>
        </button>
        <button type="button" id="view-mode-valida"
          class="flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
            activeMode === 'valida'
              ? 'bg-white text-ink font-bold shadow-glow'
              : 'text-silver hover:text-white hover:bg-white/5'
          }">
          <span>🏁</span>
          <span>Resultados por Válida</span>
        </button>
      </div>
    </div>`;
}

export async function initResultsPage(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const champ = getActiveChampionship();

  app.innerHTML = `
    ${renderNavbar('resultados')}
    <main class="mx-auto max-w-6xl px-4 py-12">
      <div class="text-center mb-6">
        <h1 class="section-title mb-2">Clasificaciones y Resultados</h1>
        <p class="text-muted max-w-xl mx-auto text-sm">
          Sigue el desempeño de los pilotos en cada fecha y la sumatoria acumulada de puntos ${champ.article === 'el' ? 'del' : 'de la'} ${champ.name}.
        </p>
      </div>
      <div id="results-switcher-container"></div>
      <div id="results-content" class="card py-16">
        <div class="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-white/40 border-t-white"></div>
        <p class="mt-4 text-center text-muted">Cargando clasificaciones...</p>
      </div>
    </main>
    ${renderFooter()}
  `;

  initNavbar();

  const content = document.getElementById('results-content');
  const switcherContainer = document.getElementById('results-switcher-container');
  if (!content || !switcherContainer) return;

  const { eventId, vista } = getUrlParams();
  let currentMode: ResultsViewMode = vista;

  // Cargar eventos del campeonato actual
  const [events, publishedList] = await Promise.all([
    loadEvents(),
    loadAllPublishedResults(champ.id),
  ]);

  const champEvents = events
    .filter((e) => e.championshipId === champ.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const allPublishedEvents = champEvents.filter(eventHasResults);

  // Determinar evento activo para la vista por válida
  let activeEvent: Event | undefined = undefined;
  if (eventId) {
    activeEvent = champEvents.find((e) => e.id === eventId);
  }
  if (!activeEvent && allPublishedEvents.length > 0) {
    activeEvent = allPublishedEvents[0];
  }

  // Calcular tabla general del campeonato actual
  const championshipStandings = computeChampionshipStandings(publishedList, champ.id);

  function renderCurrentView(): void {
    if (!content || !switcherContainer) return;

    switcherContainer.innerHTML = renderViewSwitcher(currentMode);
    content.classList.remove('py-16');

    if (currentMode === 'general') {
      content.innerHTML = renderGeneralView(championshipStandings, champ.name);
      bindGeneralViewUi(content);
    } else {
      if (!activeEvent) {
        content.innerHTML = `
          <div class="text-center py-10">
            <h2 class="font-title text-2xl text-white mb-2">No hay válidas con resultados disponibles</h2>
            <p class="text-muted mb-6">Aún no se han cargado resultados oficiales para ninguna válida de este campeonato.</p>
            <a href="./eventos.html" class="btn-primary inline-block">Ver eventos</a>
          </div>`;
        return;
      }

      const currentEventResults = publishedList.find((p) => p.event.id === activeEvent!.id)?.results || null;
      content.innerHTML = renderValidaView(activeEvent, currentEventResults, allPublishedEvents);
      if (currentEventResults) {
        bindValidaViewUi(content, currentEventResults);
      }
    }

    // Botones conmutadores de modo
    document.getElementById('view-mode-general')?.addEventListener('click', () => {
      if (currentMode === 'general') return;
      currentMode = 'general';
      updateUrl({ eventId: activeEvent?.id, vista: 'general' });
      renderCurrentView();
    });

    document.getElementById('view-mode-valida')?.addEventListener('click', () => {
      if (currentMode === 'valida') return;
      currentMode = 'valida';
      updateUrl({ eventId: activeEvent?.id, vista: 'valida' });
      renderCurrentView();
    });
  }

  function bindGeneralViewUi(container: HTMLElement): void {
    const categoryTabs = container.querySelectorAll<HTMLButtonElement>('.general-category-tab');
    const categoryPanels = container.querySelectorAll<HTMLElement>('.general-category-panel');

    categoryTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const catId = tab.getAttribute('data-general-category');
        categoryTabs.forEach((t) => {
          const active = t === tab;
          t.className = `general-category-tab rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
            active
              ? 'bg-white text-ink font-bold shadow-glow'
              : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
          }`;
        });
        categoryPanels.forEach((panel) => {
          panel.classList.toggle(
            'hidden',
            panel.getAttribute('data-general-category-panel') !== catId
          );
        });
      });
    });
  }

  function bindValidaViewUi(container: HTMLElement, results: EventResults): void {
    const categoryTabs = container.querySelectorAll<HTMLButtonElement>('.category-tab');
    const categoryPanels = container.querySelectorAll<HTMLElement>('.category-panel');

    categoryTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const categoryId = tab.getAttribute('data-category');
        categoryTabs.forEach((t) => {
          const active = t === tab;
          t.className = `category-tab rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
            active
              ? 'bg-white text-ink font-bold shadow-glow-strong'
              : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
          }`;
        });
        categoryPanels.forEach((panel) => {
          panel.classList.toggle(
            'hidden',
            panel.getAttribute('data-category-panel') !== categoryId
          );
        });
      });
    });

    container.querySelectorAll<HTMLButtonElement>('.heat-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const categoryId = tab.getAttribute('data-category');
        const heat = tab.getAttribute('data-heat');
        const panel = container.querySelector(`[data-category-panel="${categoryId}"]`);
        if (!panel) return;

        panel.querySelectorAll<HTMLButtonElement>('.heat-tab').forEach((t) => {
          const active = t === tab;
          t.className = `heat-tab rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
            active
              ? 'bg-white text-ink font-bold shadow-glow'
              : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
          }`;
        });

        panel.querySelectorAll<HTMLElement>('.heat-panel').forEach((heatPanel) => {
          heatPanel.classList.toggle(
            'hidden',
            heatPanel.getAttribute('data-heat-panel') !== `${categoryId}:${heat}`
          );
        });
      });
    });

    container.querySelectorAll<HTMLButtonElement>('.comment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const categoryId = btn.getAttribute('data-category');
        const heat = btn.getAttribute('data-heat') as HeatKey | null;
        const rowIndex = Number(btn.getAttribute('data-row'));
        const category = results.categories.find((c) => c.categoryId === categoryId);
        const table = category && heat ? category[heat] : undefined;
        const row = table?.rows[rowIndex];
        if (!row) return;
        const comment = getRowComment(row, table?.commentColumn);
        void Swal.fire({
          title: 'Incidencia / Comentario',
          text: comment || 'Sin comentarios registrados.',
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-card border border-white/15 bg-surface-raised text-foreground shadow-2xl p-6',
            title: 'font-title text-2xl tracking-wider text-white pb-2 border-b border-white/10',
            htmlContainer: 'text-silver font-body text-sm py-4 m-0',
            confirmButton: 'btn-primary text-sm font-bold px-6 py-2.5 cursor-pointer',
          },
        });
      });
    });
  }

  renderCurrentView();
}
