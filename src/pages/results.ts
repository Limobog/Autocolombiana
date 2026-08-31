import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import { eventHasResults, loadEventResults, loadEvents } from '../utils/storage';
import { formatDate } from '../utils/age';
import { HEAT_KEYS, HEAT_LABELS, getRowComment } from '../utils/parse-results-csv';
import type { CategoryResults, Event, EventResults, HeatKey, ResultsTable } from '../types';
import Swal from 'sweetalert2';

function getEventIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('evento');
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
              title="Ver comentario" aria-label="Ver comentario">!</button>
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

  const pdfBtn =
    heat !== 'final' && table.pdfUrl
      ? `<a href="${table.pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Vuelta a vuelta (PDF)</a>`
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
        class="heat-tab rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${i === 0 ? 'bg-white text-ink font-bold shadow-glow' : 'bg-surface-raised text-silver border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'}"
        data-category="${category.categoryId}" data-heat="${heat}">
        ${HEAT_LABELS[heat]}
      </button>`
    )
    .join('');

  return `
    <div class="category-panel ${active ? '' : 'hidden'} space-y-5" data-category-panel="${category.categoryId}">
      <div class="flex flex-wrap gap-2.5">${heatTabs}</div>
      ${heats.map((heat, i) => renderHeatPanel(category, heat, i === 0)).join('')}
    </div>`;
}

function bindResultsUi(container: HTMLElement, results: EventResults): void {
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
        panel.classList.toggle('hidden', panel.getAttribute('data-category-panel') !== categoryId);
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

function renderResultsContent(event: Event, results: EventResults): string {
  const categories = results.categories.filter((c) => availableHeats(c).length > 0);
  if (categories.length === 0) {
    return `
      <div class="text-center py-12">
        <h1 class="section-title mb-2">Resultados</h1>
        <p class="text-white font-semibold text-lg mb-1">${escapeHtml(event.name)}</p>
        <p class="text-sm text-silver mb-6">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
        <div class="rounded-2xl border border-dashed border-white/15 bg-surface/40 max-w-md mx-auto p-8 mb-8">
          <p class="text-muted">Aún no hay tablas de resultados publicadas para este evento.</p>
        </div>
        <a href="./eventos.html" class="btn-outline inline-block">Volver a eventos</a>
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
    <div class="text-left">
      <div class="text-center mb-8">
        <h1 class="section-title mb-2">Resultados</h1>
        <p class="text-silver font-semibold mb-1">${escapeHtml(event.name)}</p>
        <p class="text-sm text-muted">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
      </div>
      <div class="flex flex-wrap gap-2 mb-6 justify-center">${categoryTabs}</div>
      ${categories.map((cat, i) => renderCategoryPanel(cat, i === 0)).join('')}
      <div class="text-center mt-8">
        <a href="./eventos.html" class="btn-outline inline-block">Volver a eventos</a>
      </div>
    </div>`;
}

function renderSinglePdfContent(event: Event, pdfUrl: string): string {
  return `
    <div class="text-left space-y-6">
      <div class="text-center mb-6">
        <h1 class="section-title mb-2">Resultados Oficiales</h1>
        <p class="text-silver font-semibold mb-1">${escapeHtml(event.name)}</p>
        <p class="text-sm text-muted">${formatDate(event.date)} · ${escapeHtml(event.city)}</p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary text-sm font-bold px-6 py-3 inline-flex items-center gap-2 shadow-glow cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Abrir / Descargar PDF Oficial
        </a>
        <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline text-sm font-semibold px-5 py-3 inline-flex items-center gap-2 cursor-pointer">
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
          <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-secondary hover:text-white underline font-medium">Ver en ventana externa</a>
        </div>
        <div class="w-full h-[75vh] min-h-[500px] bg-neutral-900">
          <iframe src="${pdfUrl}" class="w-full h-full border-0" title="Resultados del evento ${escapeHtml(event.name)}"></iframe>
        </div>
      </div>

      <div class="text-center pt-4">
        <a href="./eventos.html" class="btn-outline inline-block">Volver a eventos</a>
      </div>
    </div>`;
}

export async function initResultsPage(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderNavbar('eventos')}
    <main class="mx-auto max-w-6xl px-4 py-12">
      <div id="results-content" class="card py-16">
        <div class="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-white/40 border-t-white"></div>
        <p class="mt-4 text-center text-muted">Cargando resultados...</p>
      </div>
    </main>
    ${renderFooter()}
  `;

  initNavbar();

  const content = document.getElementById('results-content');
  if (!content) return;

  const eventId = getEventIdFromUrl();

  if (!eventId) {
    content.innerHTML = `
      <div class="text-center">
        <h1 class="section-title mb-4">Resultados</h1>
        <p class="text-muted">Selecciona un evento desde la pagina de eventos.</p>
        <a href="./eventos.html" class="btn-primary inline-block mt-6">Ver eventos</a>
      </div>`;
    return;
  }

  const events = await loadEvents();
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    content.innerHTML = `
      <div class="text-center">
        <h1 class="section-title mb-4">Evento no encontrado</h1>
        <p class="text-muted">El evento solicitado no existe o fue eliminado.</p>
        <a href="./eventos.html" class="btn-primary inline-block mt-6">Ver eventos</a>
      </div>`;
    return;
  }

  if (!eventHasResults(event)) {
    content.innerHTML = `
      <div class="text-center">
        <h1 class="section-title mb-4">${escapeHtml(event.name)}</h1>
        <p class="text-muted mb-2">Los resultados de este evento aun no estan disponibles.</p>
        <p class="text-sm text-muted/70">Se publicaran cuando se carguen desde el panel de administracion.</p>
        <a href="./eventos.html" class="btn-outline inline-block mt-6">Volver a eventos</a>
      </div>`;
    return;
  }

  const results = await loadEventResults(event.id);

  // Si está en modo PDF único o si tiene URL de PDF
  const singlePdf =
    results?.singlePdfUrl ||
    (event.resultadosUrl &&
    (event.resultadosUrl.toLowerCase().includes('.pdf') ||
      event.resultadosUrl.startsWith('data:application/pdf') ||
      (results?.mode === 'single_pdf' && event.resultadosUrl !== 'local'))
      ? event.resultadosUrl
      : undefined);

  if (results?.mode === 'single_pdf' && singlePdf) {
    content.classList.remove('py-16');
    content.innerHTML = renderSinglePdfContent(event, singlePdf);
    return;
  }

  if (singlePdf && (!results || results.categories.length === 0)) {
    content.classList.remove('py-16');
    content.innerHTML = renderSinglePdfContent(event, singlePdf);
    return;
  }

  if (!results || results.categories.length === 0) {
    content.innerHTML = `
      <div class="text-center">
        <h1 class="section-title mb-4">${escapeHtml(event.name)}</h1>
        <p class="text-muted mb-2">No se encontraron resultados publicados para este evento.</p>
        <a href="./eventos.html" class="btn-outline inline-block mt-6">Volver a eventos</a>
      </div>`;
    return;
  }

  content.classList.remove('py-16');
  content.innerHTML = renderResultsContent(event, results);
  bindResultsUi(content, results);
}
