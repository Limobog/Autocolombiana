import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import { getActiveChampionship } from '../championships';
import {
  REGLAMENTO_SECTIONS,
  type ReglamentoSection,
} from '../content/reglamento-sections';
import { REGLAMENTO_ENDURO_SECTIONS } from '../content/reglamento-enduro-sections';
import { getEnabledChampionshipCategories } from '../types';
import { initCategories } from '../utils/storage';
import { asset } from '../utils/site-context';

function formatCategoryAgeRow(minAge: number, maxAge: number): string {
  if (maxAge >= 999) {
    if (minAge >= 36) return 'Mayores a 35 años';
    return `Desde ${minAge} años`;
  }
  return `${minAge} a ${maxAge} años`;
}

function fondoNumeroForCategory(id: string): string {
  if (id === 'femenino') return 'Fondo rosado — números blancos';
  if (id === 'enduro-a') return 'Fondo rojo — número negro';
  if (id === 'enduro-b') return 'Fondo rojo — número blanco';
  return 'Fondo blanco — números negros';
}

/** Reconstruye la tabla de categorías MX con lo configurado en el panel. */
function buildMxSections(): ReglamentoSection[] {
  const categories = getEnabledChampionshipCategories('mx');
  return REGLAMENTO_SECTIONS.map((section) => {
    if (section.id !== 'categorias' || !section.table) return section;
    const rows = categories.map((c) => [
      c.label,
      formatCategoryAgeRow(c.minAge, c.maxAge),
      fondoNumeroForCategory(c.id),
    ]);
    return { ...section, table: { ...section.table, rows } };
  });
}

/** Reconstruye la tabla de categorías del Festival con lo configurado en el panel. */
function buildEnduroSections(): ReglamentoSection[] {
  const categories = getEnabledChampionshipCategories('enduro');
  return REGLAMENTO_ENDURO_SECTIONS.map((section) => {
    if (section.id !== 'categorias' || !section.table) return section;
    const rows = categories.map((c) => {
      const sep = c.label.indexOf(' — ');
      const name = sep >= 0 ? c.label.slice(0, sep) : c.label;
      const detail = sep >= 0 ? c.label.slice(sep + 3) : '—';
      return [name, formatCategoryAgeRow(c.minAge, c.maxAge), detail];
    });
    return { ...section, table: { headers: ['Categoría', 'Edad', 'Detalle'], rows } };
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderParagraphs(texts: string[]): string {
  return texts
    .map(
      (p) =>
        `<p class="text-muted leading-relaxed mt-4 first:mt-0">${escapeHtml(p)}</p>`
    )
    .join('');
}

function renderTable(section: ReglamentoSection): string {
  const table = section.table;
  if (!table) return '';

  const head = table.headers
    .map(
      (h) =>
        `<th class="px-4 py-3 text-left text-sm font-semibold text-silver uppercase tracking-wide">${escapeHtml(h)}</th>`
    )
    .join('');

  const body = table.rows
    .map(
      (row) =>
        `<tr class="border-t border-white/10 hover:bg-surface-raised transition-colors">${row
          .map(
            (cell) =>
              `<td class="px-4 py-3 text-muted">${escapeHtml(cell)}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  return `
    <div class="my-6 overflow-x-auto rounded-xl border border-white/10">
      <table class="w-full min-w-[280px] text-sm">
        <thead class="bg-surface-raised"><tr>${head}</tr></thead>
        <tbody class="bg-surface-raised">${body}</tbody>
      </table>
    </div>`;
}

function renderBullets(items: string[]): string {
  if (!items.length) return '';
  return `
    <ul class="mt-4 space-y-2 text-muted leading-relaxed list-disc pl-5 marker:text-silver">
      ${items.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
    </ul>`;
}

function renderSection(section: ReglamentoSection): string {
  let body = '';

  if (section.id === 'puntuacion' && section.paragraphs?.length) {
    body += `<p class="text-muted leading-relaxed">${escapeHtml(section.paragraphs[0])}</p>`;
    body += renderTable(section);
    if (section.paragraphs[1]) {
      body += `<p class="text-muted leading-relaxed mt-4">${escapeHtml(section.paragraphs[1])}</p>`;
    }
  } else {
    body += renderParagraphs(section.paragraphs ?? []);
    body += renderTable(section);
    body += renderBullets(section.bullets ?? []);
    body += (section.subsections ?? [])
      .map(
        (sub) => `
      <div class="mt-6">
        <h3 class="font-title text-xl tracking-wide text-silver">${escapeHtml(sub.title)}</h3>
        ${renderBullets(sub.bullets)}
      </div>`
      )
      .join('');
    body += renderParagraphs(section.paragraphsAfter ?? []);
  }

  return `
    <article id="${section.id}" class="card scroll-mt-28">
      <h2 class="section-title text-3xl md:text-4xl">${escapeHtml(section.title)}</h2>
      ${body}
    </article>`;
}

function renderToc(sections: ReglamentoSection[]): string {
  return sections
    .map(
      (s) =>
        `<a href="#${s.id}" class="block py-1.5 text-sm text-muted hover:text-silver transition-colors border-l-2 border-transparent hover:border-white pl-3">${escapeHtml(s.title)}</a>`
    )
    .join('');
}

function renderPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const champ = getActiveChampionship();
  const sections = champ.id === 'enduro' ? buildEnduroSections() : buildMxSections();
  const sectionsHtml = sections.map(renderSection).join('');

  const pdfButton =
    champ.id === 'mx'
      ? `<a href="${asset('reglamento-oficial-copa-mx-autocolombiana.pdf')}" target="_blank" rel="noopener noreferrer"
           class="btn-outline inline-flex items-center gap-2 mt-6">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Descargar PDF oficial
        </a>`
      : `<p class="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-silver">
          Reglamento oficial en PDF disponible próximamente
        </p>`;

  const intro =
    champ.id === 'mx'
      ? 'Normas oficiales del campeonato. Al inscribirte aceptas este reglamento en su totalidad.'
      : 'Resumen provisional del campeonato: formato de competencia y categorías oficiales. Al inscribirte aceptas el reglamento en su totalidad.';

  app.innerHTML = `
    ${renderNavbar('reglamento')}
    <main class="mx-auto max-w-7xl px-4 py-10 md:py-14 md:px-6">
      <header class="text-center mb-10 md:mb-14">
        <p class="text-silver font-semibold tracking-widest uppercase text-sm mb-2">${escapeHtml(champ.name)}</p>
        <h1 class="section-title text-4xl md:text-5xl lg:text-6xl">Reglamento oficial</h1>
        <p class="mt-4 max-w-2xl mx-auto text-muted leading-relaxed">${intro}</p>
        ${pdfButton}
      </header>

      <div class="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10 xl:gap-14">
        <aside class="hidden lg:block">
          <nav class="sticky top-24 rounded-xl border border-white/10 bg-surface-raised p-4" aria-label="Índice del reglamento">
            <p class="font-title text-lg text-silver tracking-wide mb-3">Índice</p>
            ${renderToc(sections)}
          </nav>
        </aside>
        <div class="space-y-8">${sectionsHtml}</div>
      </div>
    </main>
    ${renderFooter()}
  `;

  initNavbar();
}

export async function initReglamentoPage(): Promise<void> {
  try {
    await initCategories();
  } catch {
    /* se usan las categorías por defecto */
  }
  renderPage();
}
