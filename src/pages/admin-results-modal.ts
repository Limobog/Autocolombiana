import Swal from 'sweetalert2';
import { CONFIG } from '../config';
import {
  formatCategoryOptionLabel,
  getChampionshipCategories,
  type Category,
  type CategoryResults,
  type CategoryResultsSavePayload,
  type Event,
  type EventResults,
  type HeatKey,
  type ResultsHeatSavePayload,
  type ResultsTable,
} from '../types';
import { HEAT_KEYS, HEAT_LABELS, parseResultsCsv, readFileAsText } from '../utils/parse-results-csv';
import { loadEventResults, readFileAsDataUrl, saveEventResults } from '../utils/storage';

interface HeatDraft {
  existing?: ResultsTable;
  csvFile?: File | null;
  pdfFile?: File | null;
}

interface CategoryDraft {
  categoryId: string;
  categoryLabel: string;
  heats: Record<HeatKey, HeatDraft>;
}

function emptyHeats(): Record<HeatKey, HeatDraft> {
  return { manga1: {}, manga2: {}, manga3: {}, final: {} };
}

function categoryFromExisting(cat: CategoryResults): CategoryDraft {
  const heats = emptyHeats();
  for (const key of HEAT_KEYS) {
    const table = cat[key];
    if (table) heats[key] = { existing: table };
  }
  return {
    categoryId: cat.categoryId,
    categoryLabel: cat.categoryLabel,
    heats,
  };
}

function fileInputHtml(id: string, accept: string, label: string): string {
  return `
    <div>
      <label class="block text-xs font-medium text-silver mb-1" for="${id}">${label}</label>
      <input type="file" id="${id}" accept="${accept}"
        class="w-full rounded-lg border border-white/10 bg-surface-raised px-3 py-2 text-xs text-silver file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1 file:text-xs file:font-bold file:text-ink hover:file:bg-silver transition-all duration-200 cursor-pointer focus:border-white/30 focus:outline-none" />
    </div>`;
}

function heatStatus(draft: HeatDraft, heat: HeatKey): string {
  if (draft.csvFile) {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> CSV: ${draft.csvFile.name}
    </span>`;
  }
  if (draft.existing) {
    const pdf =
      heat !== 'final' && draft.existing.pdfUrl
        ? ` · <a href="${draft.existing.pdfUrl}" target="_blank" rel="noopener noreferrer" class="text-white underline hover:text-silver ml-1">PDF actual</a>`
        : '';
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-silver border border-white/15">
      <span class="w-1.5 h-1.5 rounded-full bg-white"></span> ${draft.existing.rows.length} filas${pdf}
    </span>`;
  }
  return `<span class="text-muted text-xs">Sin datos</span>`;
}

function renderCategoryBlock(draft: CategoryDraft, index: number): string {
  const heatBlocks = HEAT_KEYS.map((heat) => {
    const draftHeat = draft.heats[heat];
    return `
      <div class="rounded-xl border border-white/10 bg-surface-raised/90 p-3.5 space-y-2.5 transition-all hover:border-white/20">
        <div class="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <p class="text-sm font-semibold tracking-wide text-white">${HEAT_LABELS[heat]}</p>
          <div class="text-xs heat-status" data-heat-status="${index}-${heat}">${heatStatus(draftHeat, heat)}</div>
        </div>
        ${fileInputHtml(`results-csv-${index}-${heat}`, '.csv,text/csv', 'CSV de resultados')}
        ${
          heat === 'final'
            ? '<p class="text-[11px] text-muted italic pt-1">La final no requiere PDF de vuelta a vuelta.</p>'
            : fileInputHtml(`results-pdf-${index}-${heat}`, '.pdf,application/pdf', 'PDF vuelta a vuelta (opcional)')
        }
      </div>`;
  }).join('');

  return `
    <div class="rounded-2xl border border-white/15 bg-surface-elevated p-5 space-y-4 shadow-card" data-category-index="${index}">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-white shadow-glow"></span>
          <h4 class="font-title text-2xl tracking-wider text-white">${draft.categoryLabel}</h4>
        </div>
        <button type="button" class="remove-category-btn inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all duration-200 cursor-pointer" data-index="${index}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          Quitar categoría
        </button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">${heatBlocks}</div>
    </div>`;
}

function availableCategories(drafts: CategoryDraft[], championshipCategories: Category[]) {
  const used = new Set(drafts.map((d) => d.categoryId));
  return championshipCategories.filter((c) => !used.has(c.id));
}

function renderCategoriesSection(drafts: CategoryDraft[]): string {
  if (drafts.length === 0) {
    return `
      <div class="rounded-2xl border border-dashed border-white/15 bg-surface/40 p-8 text-center">
        <p class="text-sm text-silver font-medium">Aún no has agregado categorías con resultados.</p>
        <p class="text-xs text-muted mt-1">Selecciona una categoría arriba y pulsa "+ Agregar categoría".</p>
      </div>`;
  }
  return drafts.map((d, i) => renderCategoryBlock(d, i)).join('');
}

function renderAddCategorySelect(drafts: CategoryDraft[], championshipCategories: Category[]): string {
  const available = availableCategories(drafts, championshipCategories);
  return `
    <option value="">Selecciona una categoria...</option>
    ${available.map((c) => `<option value="${c.id}">${formatCategoryOptionLabel(c)}</option>`).join('')}`;
}

function assertFileSize(file: File): void {
  const maxBytes = CONFIG.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`"${file.name}" supera el maximo de ${CONFIG.maxFileSizeMB} MB.`);
  }
}

async function buildHeatPayload(
  draft: HeatDraft,
  heat: HeatKey
): Promise<ResultsHeatSavePayload | undefined> {
  if (!draft.csvFile && !draft.existing) return undefined;

  let columns = draft.existing?.columns ?? [];
  let rows = draft.existing?.rows ?? [];
  let commentColumn = draft.existing?.commentColumn ?? null;
  let csvUpload: ResultsHeatSavePayload['csvUpload'];
  let pdfUpload: ResultsHeatSavePayload['pdfUpload'];

  if (draft.csvFile) {
    assertFileSize(draft.csvFile);
    const text = await readFileAsText(draft.csvFile);
    const parsed = parseResultsCsv(text, heat);
    columns = parsed.columns;
    rows = parsed.rows;
    commentColumn = parsed.commentColumn;
    csvUpload = {
      archivo: await readFileAsDataUrl(draft.csvFile),
      fileName: draft.csvFile.name,
      fileType: draft.csvFile.type || 'text/csv',
    };
  }

  if (heat !== 'final' && draft.pdfFile) {
    assertFileSize(draft.pdfFile);
    pdfUpload = {
      archivo: await readFileAsDataUrl(draft.pdfFile),
      fileName: draft.pdfFile.name,
      fileType: draft.pdfFile.type || 'application/pdf',
    };
  }

  return {
    columns,
    rows,
    commentColumn,
    pdfUrl: draft.existing?.pdfUrl,
    csvUrl: draft.existing?.csvUrl,
    csvUpload,
    pdfUpload,
  };
}

async function buildSavePayload(drafts: CategoryDraft[]): Promise<CategoryResultsSavePayload[]> {
  const categories: CategoryResultsSavePayload[] = [];

  for (const draft of drafts) {
    const cat: CategoryResultsSavePayload = {
      categoryId: draft.categoryId,
      categoryLabel: draft.categoryLabel,
    };
    let hasAny = false;
    for (const heat of HEAT_KEYS) {
      const payload = await buildHeatPayload(draft.heats[heat], heat);
      if (payload) {
        cat[heat] = payload;
        hasAny = true;
      }
    }
    if (hasAny) categories.push(cat);
  }

  return categories;
}

function refreshStatusLabels(root: HTMLElement, drafts: CategoryDraft[]): void {
  drafts.forEach((draft, index) => {
    for (const heat of HEAT_KEYS) {
      const el = root.querySelector(`[data-heat-status="${index}-${heat}"]`);
      if (el) el.innerHTML = heatStatus(draft.heats[heat], heat);
    }
  });
}

function bindCategoryUi(root: HTMLElement, drafts: CategoryDraft[], championshipCategories: Category[]): void {
  const select = root.querySelector<HTMLSelectElement>('#results-add-category');
  const addBtn = root.querySelector<HTMLButtonElement>('#results-add-category-btn');
  const list = root.querySelector('#results-categories');

  if (select) select.innerHTML = renderAddCategorySelect(drafts, championshipCategories);
  if (addBtn) addBtn.disabled = availableCategories(drafts, championshipCategories).length === 0;
  if (list) list.innerHTML = renderCategoriesSection(drafts);

  drafts.forEach((draft, index) => {
    for (const heat of HEAT_KEYS) {
      const csvInput = root.querySelector<HTMLInputElement>(`#results-csv-${index}-${heat}`);
      const pdfInput = root.querySelector<HTMLInputElement>(`#results-pdf-${index}-${heat}`);
      csvInput?.addEventListener('change', () => {
        draft.heats[heat].csvFile = csvInput.files?.[0] ?? null;
        refreshStatusLabels(root, drafts);
      });
      pdfInput?.addEventListener('change', () => {
        draft.heats[heat].pdfFile = pdfInput.files?.[0] ?? null;
        refreshStatusLabels(root, drafts);
      });
    }
  });
}

export async function openResultsModal(event: Event, onSaved: () => Promise<void>): Promise<void> {
  const existing = await loadEventResults(event.id);
  const drafts: CategoryDraft[] = (existing?.categories ?? []).map(categoryFromExisting);
  const eventCategories = getChampionshipCategories(event.championshipId || 'mx');

  const result = await Swal.fire({
    title: `Resultados · ${event.name}`,
    html: `
      <div id="results-modal-root" class="text-left space-y-5 max-h-[68vh] overflow-y-auto pr-2 custom-scrollbar">
        <div class="rounded-xl border border-white/10 bg-surface/80 p-3.5 text-xs text-silver leading-relaxed">
          <p class="font-bold text-white mb-1">Carga de planillas de resultados:</p>
          Agrega únicamente las categorías que tengan resultados. Puedes cargar mangas parciales (Manga 1, 2, 3 o Final). Los archivos se procesan y almacenan automáticamente en Google Drive.
        </div>
        <div class="flex flex-wrap items-end gap-3 bg-surface-elevated p-4 rounded-xl border border-white/10">
          <div class="flex-1 min-w-[240px]">
            <label class="block text-xs font-semibold text-silver uppercase tracking-wider mb-1.5" for="results-add-category">Agregar categoría</label>
            <select id="results-add-category" class="input-field text-sm py-2.5 bg-surface text-foreground border-white/15"></select>
          </div>
          <button type="button" id="results-add-category-btn" class="btn-secondary text-sm py-2.5 px-5 font-bold cursor-pointer hover:border-white hover:bg-white/10">+ Agregar categoría</button>
        </div>
        <div id="results-categories" class="space-y-4"></div>
      </div>`,
    width: '58rem',
    showCancelButton: true,
    confirmButtonText: 'Guardar resultados',
    cancelButtonText: 'Cerrar',
    buttonsStyling: false,
    focusConfirm: false,
    customClass: {
      popup: 'rounded-card border border-white/15 bg-surface-raised text-foreground shadow-2xl p-6',
      title: 'font-title text-3xl md:text-4xl tracking-wider text-white pb-3 border-b border-white/10',
      htmlContainer: 'text-silver font-body text-sm pt-4 pb-2 m-0',
      actions: 'flex items-center justify-end gap-3 pt-4 border-t border-white/10 w-full mt-4',
      confirmButton: 'btn-primary text-sm font-bold px-6 py-2.5 cursor-pointer',
      cancelButton: 'btn-secondary text-sm font-semibold px-6 py-2.5 cursor-pointer',
      validationMessage: 'rounded-lg border border-red-500/30 bg-red-950/80 text-red-200 text-xs p-3 mt-3',
    },
    didOpen: () => {
      const root = document.getElementById('results-modal-root');
      if (!root) return;

      const rerender = () => bindCategoryUi(root, drafts, eventCategories);
      rerender();

      root.addEventListener('click', (ev) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        if (target.id === 'results-add-category-btn' || target.closest('#results-add-category-btn')) {
          const select = root.querySelector<HTMLSelectElement>('#results-add-category');
          const id = select?.value;
          if (!id) return;
          const cat = eventCategories.find((c) => c.id === id);
          if (!cat || drafts.some((d) => d.categoryId === cat.id)) return;
          drafts.push({
            categoryId: cat.id,
            categoryLabel: formatCategoryOptionLabel(cat),
            heats: emptyHeats(),
          });
          rerender();
          return;
        }

        const removeBtn = target.closest('.remove-category-btn') as HTMLElement | null;
        if (removeBtn) {
          const index = Number(removeBtn.getAttribute('data-index'));
          if (Number.isNaN(index)) return;
          drafts.splice(index, 1);
          rerender();
        }
      });
    },
    preConfirm: async () => {
      try {
        if (drafts.length === 0) {
          Swal.showValidationMessage('Agrega al menos una categoría con resultados.');
          return false;
        }
        const categories = await buildSavePayload(drafts);
        if (categories.length === 0) {
          Swal.showValidationMessage('Cada categoría necesita al menos un CSV (manga o final).');
          return false;
        }
        return categories;
      } catch (err) {
        Swal.showValidationMessage(err instanceof Error ? err.message : 'No se pudieron leer los archivos.');
        return false;
      }
    },
  });

  if (!result.isConfirmed || !result.value) return;

  const categories = result.value as CategoryResultsSavePayload[];
  Swal.fire({
    title: 'Guardando resultados...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-card border border-white/15 bg-surface-raised text-foreground shadow-2xl p-6',
      title: 'font-title text-3xl tracking-wider text-white',
    },
    didOpen: () => Swal.showLoading(),
  });

  try {
    await saveEventResults({
      eventId: event.id,
      eventName: event.name,
      categories,
    });
    await Swal.fire({
      icon: 'success',
      title: 'Resultados guardados',
      text: 'Los CSV y PDF se almacenaron en Drive y la página de resultados ya está disponible.',
      confirmButtonText: 'Aceptar',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-card border border-white/15 bg-surface-raised text-foreground shadow-2xl p-6',
        title: 'font-title text-3xl tracking-wider text-white',
        confirmButton: 'btn-primary text-sm font-bold px-6 py-2.5 cursor-pointer',
      },
    });
    await onSaved();
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Error al guardar',
      text: err instanceof Error ? err.message : 'No se pudieron guardar los resultados.',
      confirmButtonText: 'Aceptar',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-card border border-white/15 bg-surface-raised text-foreground shadow-2xl p-6',
        title: 'font-title text-3xl tracking-wider text-white',
        confirmButton: 'btn-primary text-sm font-bold px-6 py-2.5 cursor-pointer',
      },
    });
  }
}

export function categoryHasAnyHeat(cat: CategoryResults): boolean {
  return HEAT_KEYS.some((key) => Boolean(cat[key]));
}

export function eventResultsArePublic(results: EventResults | null): boolean {
  return Boolean(results?.categories.some(categoryHasAnyHeat));
}
