import { CONFIG } from '../config';
import { renderFooter } from '../components/footer';
import {
  loadAdminData,
  saveEvents,
  saveStoredCategories,
  readFileAsDataUrl,
  updateRegistration,
  deleteRegistration,
  isApiEnabled,
} from '../utils/storage';
import { calculateAge, formatDate, generateId, parseSheetDate } from '../utils/age';
import { exportRegistrations, type ExportFormat } from '../utils/export-registrations';
import { formatCop, resolveRegistrationTotal } from '../utils/registration-total';
import {
  formatCategoryDisplayLabel,
  formatCategoryOptionLabel,
  getCategoriesForAge,
  getCategoryById,
  getChampionshipCategories,
  isCategoryEnabled,
  resolveCategoryId,
} from '../types';
import type {
  Category,
  ChampionshipId,
  Event,
  EventBankingInfo,
  EventPromotion,
  EventSavePayload,
  PromotionType,
  Registration,
  StoredCategory,
} from '../types';
import { CHAMPIONSHIPS } from '../championships';
import Swal from 'sweetalert2';
import { openResultsModal } from './admin-results-modal';

function getEventChampionshipId(events: Event[], eventId: string): ChampionshipId {
  return events.find((e) => e.id === eventId)?.championshipId ?? 'mx';
}

function renderChampBadge(championshipId: ChampionshipId): string {
  const isEnduro = championshipId === 'enduro';
  return `<span class="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
    isEnduro ? 'bg-white/15 text-white border border-white/25' : 'bg-white/5 text-silver border border-white/15'
  }">${isEnduro ? 'Enduro' : 'MX'}</span>`;
}

function isAuthenticated(): boolean {
  return (
    sessionStorage.getItem(CONFIG.storageKeys.adminSession) === 'true' &&
    Boolean(sessionStorage.getItem('minicross_admin_password'))
  );
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function renderLoadingPanel(): string {
  return `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card w-full max-w-lg border border-white/30">
        <div class="flex flex-col items-center justify-center gap-5 py-14 text-center" role="status" aria-live="polite">
          <div class="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
          <div>
            <p class="font-title text-xl tracking-wide text-silver uppercase">Procesando datos</p>
            <p class="mt-2 text-sm text-muted">Consultando eventos e inscripciones en la base de datos...</p>
          </div>
          <div class="flex gap-1.5">
            <span class="h-2 w-2 animate-pulse rounded-full bg-white" style="animation-delay: 0ms"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-white" style="animation-delay: 150ms"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-white" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </div>
    </div>`;
}

function showSaving(title = 'Guardando...'): void {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
}

async function showSuccess(title: string, text?: string): Promise<void> {
  await Swal.fire({ icon: 'success', title, text, confirmButtonText: 'Aceptar' });
}

async function showError(title: string, text?: string): Promise<void> {
  await Swal.fire({ icon: 'error', title, text, confirmButtonText: 'Aceptar' });
}

async function confirmAction(title: string, text: string): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f97316',
  });
  return result.isConfirmed;
}

function renderLogin(): string {
  return `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card w-full max-w-md">
        <h1 class="font-title text-3xl text-center text-white mb-6 tracking-wider">Panel de Gestion</h1>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm text-secondary mb-2" for="password">Contrasena</label>
            <input type="password" id="password" required class="input-field" />
          </div>
          <div id="login-error" class="hidden text-silver text-sm"></div>
          <button type="submit" class="btn-primary w-full">Ingresar</button>
        </form>
      </div>
    </div>
    ${renderFooter()}`;
}


function parseCategoryIds(value: string): string[] {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function renderCategoryCheckboxes(
  ageOrContext: number | { birthDate: string; eventDate?: string },
  championshipId: ChampionshipId,
  selected: string[] = []
): string {
  const categories = getCategoriesForAge(ageOrContext, championshipId, { includeIds: selected });
  if (categories.length === 0) {
    return '<p class="text-sm text-muted">Sin categorias disponibles para esta edad.</p>';
  }
  return `<div class="edit-categoria-checkboxes space-y-2">
    ${categories
      .map(
        (c) => `
      <label class="flex items-center gap-3 rounded-lg border border-white/20 bg-surface-raised px-3 py-2 cursor-pointer hover:border-white/50">
        <input type="checkbox" name="categoriaIds" value="${c.id}" class="accent-white h-4 w-4" ${selected.includes(c.id) ? 'checked' : ''} />
        <span class="text-sm font-medium">${formatCategoryOptionLabel(c)}${
          isCategoryEnabled(c) ? '' : ' <span class="text-xs text-muted">(inhabilitada)</span>'
        }</span>
      </label>`
      )
      .join('')}
  </div>`;
}

function getUsedCategoryIds(registrations: Registration[]): Set<string> {
  const used = new Set<string>();
  for (const reg of registrations) {
    for (const id of parseCategoryIds(reg.categoriaId)) {
      used.add(resolveCategoryId(id));
    }
  }
  return used;
}

function refreshEditFormCategories(form: HTMLFormElement, registrations: Registration[] = [], events: Event[] = []): void {
  const birthInput = form.querySelector<HTMLInputElement>('input[name="fechaNacimiento"]');
  const container = form.querySelector<HTMLElement>('.edit-categoria-container');
  if (!birthInput || !container) return;

  const id = form.getAttribute('data-id');
  const reg = registrations.find((r) => r.id === id);
  const event = events.find((e) => e.id === reg?.eventId);
  const championshipId = (container.getAttribute('data-champ') as ChampionshipId) || 'mx';
  const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="categoriaIds"]:checked')).map(
    (el) => el.value
  );
  const birthDate = parseSheetDate(birthInput.value);
  const age = birthDate ? calculateAge(birthDate, event?.date) : -1;

  if (age < 0) {
    container.innerHTML = '<p class="text-sm text-muted">Fecha invalida</p>';
    return;
  }

  container.innerHTML = renderCategoryCheckboxes({ birthDate, eventDate: event?.date }, championshipId, selected);
}

function renderDocumentLinkCell(url: string | undefined, title: string, ariaLabel: string): string {
  const link = url?.trim() ?? '';
  if (!isHttpUrl(link)) {
    return '<span class="text-muted text-xs">—</span>';
  }
  return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-secondary hover:text-white" title="${title}" aria-label="${ariaLabel}">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
  </a>`;
}

function renderRegistrationRow(reg: Registration, events: Event[]): string {
  const selectedCategoryIds = parseCategoryIds(reg.categoriaId);
  const birthDate = parseSheetDate(reg.fechaNacimiento);
  const event = events.find((e) => e.id === reg.eventId);
  const eventDate = event?.date;
  const ageForCategories = birthDate ? calculateAge(birthDate, eventDate) : reg.edad;
  const categoryAge = ageForCategories >= 0 ? ageForCategories : reg.edad;
  const totalLabel = formatCop(resolveRegistrationTotal(reg, events));
  const championshipId = getEventChampionshipId(events, reg.eventId);
  const ageContext = birthDate ? { birthDate, eventDate } : categoryAge;

  return `
    <tr class="border-b border-white/10 hover:bg-surface-raised" data-id="${reg.id}">
      <td class="px-3 py-3 text-sm">#${reg.numeroPiloto}</td>
      <td class="px-3 py-3 text-sm">${reg.nombre} ${reg.apellido}</td>
      <td class="px-3 py-3 text-sm hidden md:table-cell">${categoryAge} años</td>
      <td class="px-3 py-3 text-sm hidden lg:table-cell">${formatCategoryDisplayLabel(reg.categoriaId, reg.categoriaLabel)}</td>
      <td class="px-3 py-3 text-sm hidden md:table-cell font-semibold text-white">${totalLabel}</td>
      <td class="px-3 py-3 text-sm hidden lg:table-cell">${reg.ciudad}</td>
      <td class="px-3 py-3 text-sm hidden lg:table-cell">${reg.marcaMoto || '—'}</td>
      <td class="px-3 py-3 text-sm hidden xl:table-cell">${reg.celular}</td>
      <td class="px-3 py-3 text-sm">${reg.identificacion || '—'}</td>
      <td class="px-3 py-3 text-sm text-center">${renderDocumentLinkCell(reg.comprobantePagoArchivo, 'Ver comprobante de pago', 'Ver comprobante de pago')}</td>
      <td class="px-3 py-3 text-sm">
        <button class="edit-reg text-secondary hover:text-white mr-2" data-id="${reg.id}">Editar</button>
        <button class="delete-reg text-silver hover:text-white" data-id="${reg.id}">Eliminar</button>
      </td>
    </tr>
    <tr class="hidden edit-row bg-surface-raised" data-edit-id="${reg.id}">
      <td colspan="11" class="px-4 py-4">
        <form class="edit-form grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-id="${reg.id}">
          <input type="text" name="nombre" value="${reg.nombre}" placeholder="Nombre" class="input-field text-sm" required />
          <input type="text" name="apellido" value="${reg.apellido}" placeholder="Apellido" class="input-field text-sm" required />
          <input type="date" name="fechaNacimiento" value="${birthDate}" class="input-field text-sm" required />
          <input type="email" name="email" value="${reg.email}" placeholder="Email" class="input-field text-sm" required />
          <input type="tel" name="celular" value="${reg.celular}" placeholder="Celular" class="input-field text-sm" required />
          <input type="text" name="ciudad" value="${reg.ciudad}" placeholder="Ciudad" class="input-field text-sm" required />
          <input type="text" name="marcaMoto" value="${reg.marcaMoto}" placeholder="Marca moto" class="input-field text-sm" required />
          <input type="number" name="numeroPiloto" value="${reg.numeroPiloto}" min="4" max="999" class="input-field text-sm" required />
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-sm text-secondary mb-2 font-medium">Categorias *</p>
            <div class="edit-categoria-container" data-champ="${championshipId}">${renderCategoryCheckboxes(ageContext, championshipId, selectedCategoryIds)}</div>
          </div>
          <div class="sm:col-span-2 lg:col-span-3 flex gap-2">
            <button type="submit" class="btn-secondary text-sm py-2 px-4">Guardar</button>
            <button type="button" class="cancel-edit btn-outline text-sm py-2 px-4" data-id="${reg.id}">Cancelar</button>
          </div>
        </form>
      </td>
    </tr>`;
}

// ─── Gestión de categorías por campeonato ────────────────────────────────────

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function slugifyCategoryId(label: string): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'categoria';
}

function setCategoryRowActiveState(row: HTMLElement, enabled: boolean): void {
  row.setAttribute('data-cat-active', enabled ? 'true' : 'false');
  row.classList.toggle('opacity-60', !enabled);
  row.classList.toggle('border-white/10', !enabled);
  const badge = row.querySelector<HTMLElement>('.cat-status-badge');
  if (badge) {
    badge.textContent = enabled ? 'Habilitada' : 'Inhabilitada';
    badge.className = `cat-status-badge inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      enabled
        ? 'bg-white/10 text-silver border border-white/20'
        : 'bg-silver/20 text-white border border-white/30'
    }`;
  }
  const toggleBtn = row.querySelector<HTMLElement>('.cat-toggle-active');
  if (toggleBtn) {
    toggleBtn.textContent = enabled ? 'Inhabilitar' : 'Habilitar';
    toggleBtn.className = `cat-toggle-active text-sm shrink-0 ${
      enabled ? 'text-silver hover:text-white' : 'text-secondary hover:text-white'
    }`;
  }
}

function renderCategoryAdminRow(cat?: Category, used = false): string {
  const maxVal = cat && cat.maxAge < 999 ? String(cat.maxAge) : '';
  const enabled = cat ? isCategoryEnabled(cat) : true;
  const id = cat?.id ?? '';
  const statusBadge = enabled
    ? '<span class="cat-status-badge inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-silver border border-white/20">Habilitada</span>'
    : '<span class="cat-status-badge inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-silver/20 text-white border border-white/30">Inhabilitada</span>';

  const actions = used
    ? `<button type="button" class="cat-toggle-active text-sm shrink-0 ${
        enabled ? 'text-silver hover:text-white' : 'text-secondary hover:text-white'
      }">${enabled ? 'Inhabilitar' : 'Habilitar'}</button>
       <span class="text-[10px] text-muted shrink-0 max-w-[9rem] leading-tight">En uso por inscritos — no se puede eliminar</span>`
    : `<button type="button" class="cat-delete text-silver text-sm hover:text-white shrink-0">Eliminar</button>`;

  return `
    <div class="cat-admin-row flex flex-wrap items-center gap-3 rounded-lg border border-white/15 bg-surface-raised p-3 ${
      enabled ? '' : 'opacity-60 border-white/10'
    }" data-cat-id="${id}" data-cat-active="${enabled ? 'true' : 'false'}" data-cat-used="${used ? 'true' : 'false'}">
      <div class="flex flex-col gap-1 flex-1 min-w-[240px]">
        <div class="flex items-center gap-2 flex-wrap">${statusBadge}${
          used ? '<span class="text-[10px] text-muted uppercase tracking-wider">Con inscritos</span>' : ''
        }</div>
        <input type="text" class="cat-label input-field text-sm" value="${cat ? escapeAttr(cat.label) : ''}"
               placeholder="Nombre — detalle (ej: 85cc A — hasta 85cc 2T)" />
      </div>
      <label class="flex items-center gap-2 text-xs text-muted">
        Edad
        <input type="number" class="cat-min input-field text-sm w-20 py-2" min="0" max="120" value="${cat?.minAge ?? ''}" placeholder="min" required />
        a
        <input type="number" class="cat-max input-field text-sm w-20 py-2" min="0" max="120" value="${maxVal}" placeholder="Sin lím." />
      </label>
      <div class="flex flex-col items-end gap-1">${actions}</div>
    </div>`;
}

function renderCategoriesAdminSection(usedIds: Set<string>): string {
  const tabs = (['mx', 'enduro'] as ChampionshipId[])
    .map((id) => {
      const cats = getChampionshipCategories(id);
      const enabledCount = cats.filter(isCategoryEnabled).length;
      return `<button type="button" class="cat-tab px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all bg-surface-raised text-muted border border-white/10 ${
        id === 'mx' ? 'ring-2 ring-white text-white' : ''
      }" data-cat-tab="${id}">${CHAMPIONSHIPS[id].shortLabel} (${enabledCount}/${cats.length})</button>`;
    })
    .join('');

  const panels = (['mx', 'enduro'] as ChampionshipId[])
    .map(
      (id) => `
      <div class="cat-champ-panel ${id === 'mx' ? '' : 'hidden'}" data-cat-panel="${id}">
        <div class="space-y-2" data-cat-list="${id}">
          ${getChampionshipCategories(id)
            .map((c) => renderCategoryAdminRow(c, usedIds.has(c.id)))
            .join('')}
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <button type="button" class="cat-add btn-outline text-sm py-2 px-4" data-champ="${id}">+ Agregar categoría</button>
          <button type="button" class="cat-save btn-primary text-sm py-2 px-4" data-champ="${id}">Guardar categorías</button>
        </div>
      </div>`
    )
    .join('');

  return `
    <section class="card" id="categories-admin">
      <h2 class="font-title text-2xl text-secondary mb-1">Categorías por campeonato</h2>
      <p class="text-sm text-muted mb-4">
        Edita el nombre y el rango de edad, o agrega categorías. Deja la edad máxima vacía para "sin límite".
        Si una categoría ya tiene pilotos inscritos no se puede eliminar: inhabilítala para que no aparezca en eventos futuros.
      </p>
      <div class="flex flex-wrap gap-2 mb-5">${tabs}</div>
      ${panels}
    </section>`;
}

function collectCategoryRows(
  champId: ChampionshipId,
  usedIds: Set<string>
): { categories: Category[]; error: string | null } {
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-cat-panel="${champId}"] .cat-admin-row`)
  );
  const categories: Category[] = [];
  const collectedIds = new Set<string>();

  for (const row of rows) {
    const label = row.querySelector<HTMLInputElement>('.cat-label')?.value.trim() ?? '';
    const minRaw = row.querySelector<HTMLInputElement>('.cat-min')?.value.trim() ?? '';
    const maxRaw = row.querySelector<HTMLInputElement>('.cat-max')?.value.trim() ?? '';
    const active = row.getAttribute('data-cat-active') !== 'false';

    if (!label) return { categories: [], error: 'Hay una categoría sin nombre.' };
    const minAge = Number(minRaw);
    if (minRaw === '' || !Number.isFinite(minAge) || minAge < 0) {
      return { categories: [], error: `Edad mínima inválida en "${label}".` };
    }
    const maxAge = maxRaw === '' ? 999 : Number(maxRaw);
    if (!Number.isFinite(maxAge) || maxAge < minAge) {
      return { categories: [], error: `Edad máxima inválida en "${label}" (debe ser mayor o igual a la mínima).` };
    }

    let id = row.getAttribute('data-cat-id') || '';
    if (!id) {
      const base = slugifyCategoryId(label);
      id = base;
      let n = 2;
      while (collectedIds.has(id) || getCategoryById(id)) id = `${base}-${n++}`;
    }
    if (collectedIds.has(id)) return { categories: [], error: `Categoría duplicada: "${label}".` };
    collectedIds.add(id);

    categories.push({ id, label, minAge, maxAge, active });
  }

  if (categories.length === 0) {
    return { categories: [], error: 'Debe existir al menos una categoría.' };
  }
  if (!categories.some(isCategoryEnabled)) {
    return { categories: [], error: 'Debe haber al menos una categoría habilitada.' };
  }

  for (const existing of getChampionshipCategories(champId)) {
    if (usedIds.has(existing.id) && !collectedIds.has(existing.id)) {
      return {
        categories: [],
        error: `No se puede eliminar "${existing.label}": hay pilotos inscritos. Inhabilítala en su lugar.`,
      };
    }
  }

  return { categories, error: null };
}

function bindCategoriesAdmin(usedIds: Set<string>): void {
  const section = document.getElementById('categories-admin');
  if (!section) return;

  section.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const tab = target.closest<HTMLElement>('.cat-tab');
    if (tab) {
      const id = tab.getAttribute('data-cat-tab');
      section.querySelectorAll('.cat-tab').forEach((t) => {
        const active = t.getAttribute('data-cat-tab') === id;
        t.classList.toggle('ring-2', active);
        t.classList.toggle('ring-white', active);
        t.classList.toggle('text-white', active);
      });
      section.querySelectorAll('.cat-champ-panel').forEach((p) => {
        p.classList.toggle('hidden', p.getAttribute('data-cat-panel') !== id);
      });
      return;
    }

    const toggleBtn = target.closest<HTMLElement>('.cat-toggle-active');
    if (toggleBtn) {
      const row = toggleBtn.closest<HTMLElement>('.cat-admin-row');
      if (!row) return;
      const currentlyEnabled = row.getAttribute('data-cat-active') !== 'false';
      const label =
        row.querySelector<HTMLInputElement>('.cat-label')?.value.trim() || 'esta categoría';
      if (currentlyEnabled) {
        const confirmed = await confirmAction(
          'Inhabilitar categoría',
          `"${label}" dejará de aparecer en nuevas inscripciones, pero se conservará para los pilotos ya inscritos. Debes pulsar "Guardar categorías" para confirmar.`
        );
        if (confirmed) setCategoryRowActiveState(row, false);
      } else {
        setCategoryRowActiveState(row, true);
      }
      return;
    }

    if (target.closest('.cat-delete')) {
      const row = target.closest<HTMLElement>('.cat-admin-row');
      if (!row) return;
      const catId = row.getAttribute('data-cat-id') || '';
      const label =
        row.querySelector<HTMLInputElement>('.cat-label')?.value.trim() || 'esta categoría';

      if (catId && usedIds.has(catId)) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'No se puede eliminar',
          text: `Hay pilotos inscritos en "${label}". Puedes inhabilitarla para que no aparezca en eventos futuros.`,
          showCancelButton: true,
          confirmButtonText: 'Inhabilitar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#f97316',
        });
        if (result.isConfirmed) setCategoryRowActiveState(row, false);
        return;
      }

      const confirmed = await confirmAction(
        'Eliminar categoría',
        `¿Quitar "${label}" de la lista? Debes pulsar "Guardar categorías" para confirmar el cambio.`
      );
      if (confirmed) row.remove();
      return;
    }

    const addBtn = target.closest<HTMLElement>('.cat-add');
    if (addBtn) {
      const champId = addBtn.getAttribute('data-champ')!;
      const list = section.querySelector(`[data-cat-list="${champId}"]`);
      list?.insertAdjacentHTML('beforeend', renderCategoryAdminRow());
      (list?.lastElementChild?.querySelector('.cat-label') as HTMLInputElement | null)?.focus();
      return;
    }

    const saveBtn = target.closest<HTMLElement>('.cat-save');
    if (saveBtn) {
      const champId = saveBtn.getAttribute('data-champ') as ChampionshipId;
      const { categories, error } = collectCategoryRows(champId, usedIds);
      if (error) {
        await showError('Categorías', error);
        return;
      }

      const otherId: ChampionshipId = champId === 'mx' ? 'enduro' : 'mx';
      const rows: StoredCategory[] = [
        ...categories.map((c) => ({ ...c, championshipId: champId })),
        ...getChampionshipCategories(otherId).map((c) => ({ ...c, championshipId: otherId })),
      ];

      showSaving('Guardando categorías...');
      const cloud = await saveStoredCategories(rows);
      Swal.close();
      if (cloud) {
        await showSuccess('Categorías guardadas', 'Los cambios se sincronizaron con Google Sheets.');
      } else {
        await showSuccess(
          'Categorías guardadas localmente',
          'No se pudo sincronizar con Google Sheets (verifica que el Apps Script esté actualizado). Los cambios aplican en este navegador.'
        );
      }
      await refreshAdmin();
    }
  });
}

// ─── Precios por Categoría y Promociones por Evento ──────────────────────────

function renderCategoryPriceRows(
  champId: ChampionshipId,
  customPrices: Record<string, number> = {},
  stdPrice = 0
): string {
  const cats = getChampionshipCategories(champId);
  return cats
    .map((c) => {
      const hasCustom = typeof customPrices[c.id] === 'number';
      const customVal = hasCustom ? customPrices[c.id] : '';
      return `
        <div class="event-cat-price-row flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-2.5 hover:border-white/20 transition-colors" data-cat-id="${c.id}">
          <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[200px]">
            <input type="checkbox" class="event-cat-custom-toggle accent-white h-4 w-4 shrink-0" ${hasCustom ? 'checked' : ''} />
            <span class="text-sm font-medium text-white">${formatCategoryOptionLabel(c)}</span>
          </label>
          <div class="flex items-center gap-2 shrink-0">
            <span class="event-cat-std-label text-xs text-muted ${hasCustom ? 'hidden' : ''}">
              (Estándar: ${stdPrice > 0 ? formatCop(stdPrice) : '$0'})
            </span>
            <div class="flex items-center gap-1.5 ${hasCustom ? '' : 'hidden'} event-cat-custom-box">
              <span class="text-xs text-amber-300 font-semibold">$</span>
              <input type="number" class="event-cat-custom-input input-field text-sm w-36 py-1.5 font-mono"
                     min="0" step="1000" placeholder="Ej: 170000" value="${customVal}" />
            </div>
          </div>
        </div>`;
    })
    .join('');
}

function getPromotionValueLabel(type: PromotionType): string {
  switch (type) {
    case 'fixed_package':
      return 'Precio total del combo (COP)';
    case 'unit_price_tier':
      return 'Precio individual por categoría (COP)';
    case 'total_discount_fixed':
      return 'Monto a descontar (COP)';
    case 'total_discount_percent':
      return 'Porcentaje de descuento (%)';
    case 'two_for_one':
      return 'Valor (no requerido en 2x1)';
  }
}

function getPromotionMinLabel(type: PromotionType): string {
  switch (type) {
    case 'fixed_package':
      return 'Categorías incluidas en el combo';
    case 'two_for_one':
      return 'Categorías mínimas (2 para 2x1)';
    case 'unit_price_tier':
    case 'total_discount_fixed':
    case 'total_discount_percent':
      return 'A partir de cuántas categorías aplica';
  }
}

function getPromotionValuePlaceholder(type: PromotionType): string {
  switch (type) {
    case 'fixed_package':
      return 'Ej: 400000 o 600000';
    case 'unit_price_tier':
      return 'Ej: 200000';
    case 'total_discount_fixed':
      return 'Ej: 60000';
    case 'total_discount_percent':
      return 'Ej: 15';
    case 'two_for_one':
      return '—';
  }
}

function renderPromoCategoryCheckboxes(champId: ChampionshipId, selectedIds: string[] = []): string {
  const cats = getChampionshipCategories(champId);
  const selectedSet = new Set(selectedIds);
  return cats
    .map(
      (c) => `
      <label class="flex items-center gap-2 text-xs text-foreground bg-surface-raised/60 hover:bg-surface-raised px-2 py-1.5 rounded border border-white/10 cursor-pointer transition-colors">
        <input type="checkbox" class="promo-cat-check accent-white h-3.5 w-3.5 shrink-0" value="${c.id}" ${
          selectedSet.has(c.id) ? 'checked' : ''
        } />
        <span class="truncate">${formatCategoryOptionLabel(c)}</span>
      </label>`
    )
    .join('');
}

function renderPromotionCard(promo: EventPromotion, champId: ChampionshipId): string {
  const hasSpecificCats = Boolean(promo.applicableCategoryIds && promo.applicableCategoryIds.length > 0);
  const isTwoForOne = promo.type === 'two_for_one';

  return `
    <div class="event-promo-card rounded-xl border border-white/20 bg-black/40 p-3.5 space-y-3" data-promo-id="${promo.id}">
      <div class="flex items-center justify-between gap-3 flex-wrap border-b border-white/10 pb-2.5">
        <div class="flex items-center gap-2 flex-1 min-w-[220px]">
          <span class="text-base">🎁</span>
          <input type="text" class="promo-name input-field text-sm py-1 font-semibold text-white flex-1"
                 placeholder="Nombre de la promoción (ej: Combo 2 categorías)" value="${escapeAttr(promo.name)}" required />
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-1.5 text-xs text-silver cursor-pointer select-none">
            <input type="checkbox" class="promo-active accent-white h-4 w-4" ${promo.active !== false ? 'checked' : ''} />
            Activa
          </label>
          <button type="button" class="promo-delete-btn text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded border border-red-500/30 transition-colors">
            Eliminar
          </button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3 text-xs">
        <div>
          <label class="block text-muted mb-1 font-medium">Tipo de promoción</label>
          <select class="promo-type input-field text-xs py-1.5">
            <option value="fixed_package" ${promo.type === 'fixed_package' ? 'selected' : ''}>Combo / Precio fijo total (ej: 2 por $400.000)</option>
            <option value="two_for_one" ${promo.type === 'two_for_one' ? 'selected' : ''}>2x1 (Por cada 2 categorías, paga 1)</option>
            <option value="unit_price_tier" ${promo.type === 'unit_price_tier' ? 'selected' : ''}>Precio unitario por volumen (ej: cada una a $200.000)</option>
            <option value="total_discount_fixed" ${promo.type === 'total_discount_fixed' ? 'selected' : ''}>Descuento fijo en el total (ej: -$60.000)</option>
            <option value="total_discount_percent" ${promo.type === 'total_discount_percent' ? 'selected' : ''}>Descuento porcentual en el total (ej: 15% de descuento)</option>
          </select>
        </div>
        <div>
          <label class="block text-muted mb-1 font-medium promo-min-label">${getPromotionMinLabel(promo.type)}</label>
          <input type="number" class="promo-min input-field text-xs py-1.5 font-mono" min="1" max="20"
                 value="${promo.minCategories || 2}" placeholder="Ej: 2 o 3" required />
        </div>
        <div class="promo-value-box ${isTwoForOne ? 'opacity-40 pointer-events-none' : ''}">
          <label class="block text-muted mb-1 font-medium promo-value-label">${getPromotionValueLabel(promo.type)}</label>
          <input type="number" class="promo-value input-field text-xs py-1.5 font-mono" min="0" step="1000"
                 value="${promo.value !== undefined ? promo.value : ''}" placeholder="${getPromotionValuePlaceholder(promo.type)}" ${isTwoForOne ? 'disabled' : ''} />
        </div>
      </div>

      <div class="pt-2 border-t border-white/5 space-y-2">
        <div class="flex items-center justify-between text-xs flex-wrap gap-2">
          <span class="text-muted font-medium">Categorías elegibles para esta promoción:</span>
          <label class="flex items-center gap-1.5 text-silver cursor-pointer select-none">
            <input type="checkbox" class="promo-specific-cats-toggle accent-white h-3.5 w-3.5" ${hasSpecificCats ? 'checked' : ''} />
            Aplicar solo a categorías específicas
          </label>
        </div>
        <div class="promo-cats-list ${hasSpecificCats ? '' : 'hidden'} grid gap-1.5 sm:grid-cols-2 max-h-40 overflow-y-auto p-2 bg-black/40 rounded-lg border border-white/10">
          ${renderPromoCategoryCheckboxes(champId, promo.applicableCategoryIds)}
        </div>
      </div>
    </div>`;
}

function initEventFormBanking(champId: ChampionshipId, info?: EventBankingInfo): void {
  const bankAccEnabled = document.getElementById('bank-acc-enabled') as HTMLInputElement | null;
  const breBEnabled = document.getElementById('breb-enabled') as HTMLInputElement | null;
  const neobankEnabled = document.getElementById('neobank-enabled') as HTMLInputElement | null;

  const bankAccBank = document.getElementById('bank-acc-bank') as HTMLInputElement | null;
  const bankAccType = document.getElementById('bank-acc-type') as HTMLSelectElement | null;
  const bankAccNumber = document.getElementById('bank-acc-number') as HTMLInputElement | null;
  const bankAccHolder = document.getElementById('bank-acc-holder') as HTMLInputElement | null;
  const bankAccDoc = document.getElementById('bank-acc-doc') as HTMLInputElement | null;

  const breBHolder = document.getElementById('breb-holder') as HTMLInputElement | null;
  const breBKey = document.getElementById('breb-key') as HTMLInputElement | null;

  const neobankName = document.getElementById('neobank-name') as HTMLInputElement | null;
  const neobankHolder = document.getElementById('neobank-holder') as HTMLInputElement | null;
  const neobankNumber = document.getElementById('neobank-number') as HTMLInputElement | null;

  if (!bankAccEnabled || !breBEnabled || !neobankEnabled) return;

  const defaultBank = CHAMPIONSHIPS[champId].bankDetails;

  if (info && (info.bankAccount?.enabled || info.breB?.enabled || info.neobank?.enabled)) {
    bankAccEnabled.checked = Boolean(info.bankAccount?.enabled);
    if (bankAccBank) bankAccBank.value = info.bankAccount?.bank || '';
    if (bankAccType) bankAccType.value = info.bankAccount?.accountType || 'Ahorros';
    if (bankAccNumber) bankAccNumber.value = info.bankAccount?.accountNumber || '';
    if (bankAccHolder) bankAccHolder.value = info.bankAccount?.beneficiaryName || '';
    if (bankAccDoc) bankAccDoc.value = info.bankAccount?.beneficiaryDocument || '';

    breBEnabled.checked = Boolean(info.breB?.enabled);
    if (breBHolder) breBHolder.value = info.breB?.beneficiaryName || '';
    if (breBKey) breBKey.value = info.breB?.key || '';

    neobankEnabled.checked = Boolean(info.neobank?.enabled);
    if (neobankName) neobankName.value = info.neobank?.neobank || '';
    if (neobankHolder) neobankHolder.value = info.neobank?.beneficiaryName || '';
    if (neobankNumber) neobankNumber.value = info.neobank?.accountNumber || '';
  } else {
    const isBrebType =
      defaultBank.accountType.toLowerCase().includes('bre-b') ||
      defaultBank.bank.toLowerCase().includes('bre-b');

    bankAccEnabled.checked = !isBrebType;
    if (bankAccBank) bankAccBank.value = !isBrebType ? defaultBank.bank : 'Bancolombia';
    if (bankAccType) bankAccType.value = defaultBank.accountType === 'Corriente' ? 'Corriente' : 'Ahorros';
    if (bankAccNumber) bankAccNumber.value = !isBrebType ? defaultBank.accountNumber : '';
    if (bankAccHolder) bankAccHolder.value = defaultBank.accountHolder;
    if (bankAccDoc) bankAccDoc.value = defaultBank.idValue;

    breBEnabled.checked = isBrebType || Boolean(defaultBank.paymentKey);
    if (breBHolder) breBHolder.value = defaultBank.accountHolder;
    if (breBKey) breBKey.value = defaultBank.paymentKey || defaultBank.accountNumber;

    neobankEnabled.checked = false;
    if (neobankName) neobankName.value = 'Nequi';
    if (neobankHolder) neobankHolder.value = defaultBank.accountHolder;
    if (neobankNumber) neobankNumber.value = defaultBank.paymentKey || '';
  }

  document.getElementById('bank-acc-fields')?.classList.toggle('hidden', !bankAccEnabled.checked);
  document.getElementById('breb-fields')?.classList.toggle('hidden', !breBEnabled.checked);
  document.getElementById('neobank-fields')?.classList.toggle('hidden', !neobankEnabled.checked);
}

function initEventFormCategories(
  champId: ChampionshipId,
  customPrices: Record<string, number> = {},
  stdPrice = 0
): void {
  const container = document.getElementById('event-category-prices-list');
  if (!container) return;
  container.innerHTML = renderCategoryPriceRows(champId, customPrices, stdPrice);
}

function initEventFormPromotions(champId: ChampionshipId, promotions: EventPromotion[] = []): void {
  const container = document.getElementById('event-promotions-list');
  if (!container) return;
  if (promotions.length === 0) {
    container.innerHTML =
      '<p class="text-xs text-muted py-3 text-center" id="no-promos-hint">No hay promociones configuradas para este evento. Haz clic en "+ Añadir promoción".</p>';
    return;
  }
  container.innerHTML = promotions.map((p) => renderPromotionCard(p, champId)).join('');
}

function renderAdminPanel(events: Event[], registrations: Registration[]): string {
  const usedCategoryIds = getUsedCategoryIds(registrations);
  const activeEvents = events.filter((e) => e.active);

  const champTabs = (['mx', 'enduro'] as ChampionshipId[])
    .map((id) => {
      const count = registrations.filter((r) => getEventChampionshipId(events, r.eventId) === id).length;
      return `<button class="champ-tab px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all bg-surface-raised text-muted border border-white/10"
        data-champ-tab="${id}">${CHAMPIONSHIPS[id].shortLabel} <span class="ml-1 text-xs font-normal">(${count})</span></button>`;
    })
    .join('');

  const eventTabs = events
    .map(
      (e) =>
        `<button class="event-tab px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          e.active ? 'bg-white/40 text-ink' : 'bg-surface-raised text-muted'
        }" data-event-id="${e.id}" data-champ="${e.championshipId}">${e.name}</button>`
    )
    .join('');

  const registrationsByEvent = events
    .map((event) => {
      const regs = registrations.filter((r) => r.eventId === event.id);
      return `
        <div class="event-panel hidden" data-event-panel="${event.id}">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 class="font-title text-2xl text-white">${event.name}</h3>
            <div class="flex flex-wrap items-center gap-3">
              ${
                regs.length > 0
                  ? `<button type="button" class="export-registrations-btn btn-outline text-sm py-2 px-4" data-event-id="${event.id}">Exportar</button>`
                  : ''
              }
              <span class="text-sm text-muted">${regs.length} inscrito(s)</span>
            </div>
          </div>
          ${
            regs.length === 0
              ? '<p class="text-muted py-6 text-center">Sin inscripciones para este evento.</p>'
              : `<div class="overflow-x-auto">
                  <table class="w-full text-left">
                    <thead>
                      <tr class="border-b border-white/30 text-secondary text-sm">
                        <th class="px-3 py-2"># Piloto</th>
                        <th class="px-3 py-2">Nombre</th>
                        <th class="px-3 py-2 hidden md:table-cell">Edad</th>
                        <th class="px-3 py-2 hidden lg:table-cell">Categoria</th>
                        <th class="px-3 py-2 hidden md:table-cell">Total</th>
                        <th class="px-3 py-2 hidden lg:table-cell">Ciudad</th>
                        <th class="px-3 py-2 hidden lg:table-cell">Marca moto</th>
                        <th class="px-3 py-2 hidden xl:table-cell">Celular</th>
                        <th class="px-3 py-2">Documento</th>
                        <th class="px-3 py-2 text-center">Pago</th>
                        <th class="px-3 py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>${regs.map((r) => renderRegistrationRow(r, events)).join('')}</tbody>
                  </table>
                </div>`
          }
        </div>`;
    })
    .join('');

  return `
    <div class="min-h-screen">
      <header class="border-b border-white/10 bg-surface-raised px-4 py-4 shadow-sm">
        <div class="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="font-title text-3xl text-white tracking-wider">Panel Copa Autocolombiana</h1>
            <p class="text-sm text-muted">Gestión de inscripciones y eventos</p>
          </div>
          <button id="logout-btn" class="btn-outline text-sm py-2 px-4">Cerrar sesion</button>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-8 space-y-10">
        <section class="card">
          <h2 class="font-title text-2xl text-silver mb-4">Datos de la copa</h2>
          ${
            isApiEnabled()
              ? `<p class="text-secondary text-sm mb-4 font-semibold">
                  Conectado a Google Sheets en tiempo real. Las inscripciones y cambios se guardan automaticamente.
                </p>`
              : `<p class="text-muted text-sm mb-4">
                  Modo local activo. Configura Google Sheets (ver docs/SETUP-GOOGLE-SHEETS.md) y la URL en src/config.ts.
                </p>`
          }
          <a href="${CONFIG.spreadsheetUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary inline-block">
            Abrir Google Sheet
          </a>
        </section>

        <section class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-title text-2xl text-secondary">Eventos (${activeEvents.length} activos)</h2>
            <button id="add-event-btn" class="btn-secondary text-sm py-2 px-4">+ Nuevo evento</button>
          </div>
          <div id="events-admin" class="space-y-3">
            ${events
              .map(
                (e) => `
              <div class="flex flex-wrap items-center gap-3 rounded-lg border border-white/20 bg-surface-raised p-4" data-event-admin="${e.id}">
                <div class="flex-1 min-w-[200px]">
                  <p class="font-semibold">${e.name} ${renderChampBadge(e.championshipId)}</p>
                  <p class="text-sm text-muted">${formatDate(e.date)} · ${e.city}</p>
                </div>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="event-active-toggle accent-white" data-id="${e.id}" ${e.active ? 'checked' : ''} />
                  Habilitado inscripciones
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="event-finished-toggle accent-white" data-id="${e.id}" ${e.finished ? 'checked' : ''} />
                  Finalizado
                </label>
                ${e.reglamentoUrl?.trim() ? '<a href="' + e.reglamentoUrl + '" target="_blank" rel="noopener noreferrer" class="text-secondary text-sm hover:text-white">Ver reglamento</a>' : '<span class="text-xs text-muted">Sin reglamento</span>'}
                <button class="load-results-btn text-secondary text-sm hover:text-white" data-id="${e.id}">${e.resultadosUrl?.trim() ? 'Editar resultados' : 'Cargar resultados'}</button>
                ${e.resultadosUrl?.trim() ? '<a href="./resultados.html?evento=' + e.id + '" target="_blank" rel="noopener noreferrer" class="text-secondary text-sm hover:text-white">Ver resultados</a>' : ''}
                <button class="edit-event-btn text-secondary text-sm hover:text-white" data-id="${e.id}">Editar</button>
                <button class="delete-event-btn text-silver text-sm hover:text-white" data-id="${e.id}">Eliminar</button>
              </div>`
              )
              .join('')}
          </div>
          <form id="event-form" class="hidden mt-4 space-y-5 border-t border-white/20 pt-5">
            <input type="hidden" id="event-form-id" />
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="block text-xs text-muted mb-1" for="event-championship">Campeonato</label>
                <select id="event-championship" class="input-field" required>
                  <option value="mx">${CHAMPIONSHIPS.mx.name}</option>
                  <option value="enduro">${CHAMPIONSHIPS.enduro.name}</option>
                </select>
              </div>
              <input type="text" id="event-name" placeholder="Nombre del evento" class="input-field sm:self-end" required />
              <input type="date" id="event-date" class="input-field" required />
              <input type="text" id="event-location" placeholder="Ubicacion / Pista" class="input-field" required />
              <input type="text" id="event-city" placeholder="Ciudad" class="input-field" required />
              <div>
                <label class="block text-xs text-muted mb-1" for="event-valor-inscripcion">Valor inscripción estándar (COP)</label>
                <input type="number" id="event-valor-inscripcion" placeholder="Valor inscripción (COP)" class="input-field" min="0" step="1000" required />
              </div>
            </div>
            <textarea id="event-description" placeholder="Descripcion del evento" class="input-field" rows="2" required></textarea>
            <div>
              <label class="block text-sm text-secondary mb-2" for="event-reglamento">Reglamento (PDF)</label>
              <input type="file" id="event-reglamento" accept=".pdf,application/pdf"
                class="w-full rounded-xl border border-dashed border-white/40 bg-surface-raised px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-ink" />
              <p id="event-reglamento-preview" class="mt-2 text-xs text-muted hidden"></p>
              <p id="event-reglamento-current" class="mt-2 text-xs text-secondary hidden"></p>
            </div>

            <!-- SECCIÓN 1: INFORMACIÓN BANCARIA PARA EL EVENTO -->
            <div class="rounded-xl border border-white/20 bg-surface-raised p-4 space-y-4">
              <div>
                <h3 class="font-title text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <span>💳</span> Información Bancaria para Inscripciones
                </h3>
                <p class="text-xs text-muted mt-0.5">
                  Marca con los checkboxes qué opciones de pago estarán disponibles para los pilotos en este evento y completa sus datos.
                </p>
              </div>

              <!-- Opción a: Cuenta Bancaria tradicional -->
              <div class="rounded-lg border border-white/10 bg-black/25 p-3.5 space-y-3">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" id="bank-acc-enabled" class="accent-white h-4 w-4" />
                  <span class="text-sm font-bold text-white">a. Cuenta Bancaria tradicional</span>
                </label>
                <div id="bank-acc-fields" class="hidden grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
                  <div>
                    <label class="block text-xs text-muted mb-1" for="bank-acc-bank">Banco</label>
                    <input type="text" id="bank-acc-bank" placeholder="Ej: Bancolombia, BBVA, etc." class="input-field text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="bank-acc-type">Tipo de cuenta</label>
                    <select id="bank-acc-type" class="input-field text-sm">
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs text-muted mb-1" for="bank-acc-number">Número de cuenta</label>
                    <input type="text" id="bank-acc-number" placeholder="Ej: 0021357124" class="input-field text-sm font-mono" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="bank-acc-holder">Nombre del beneficiario o razón social</label>
                    <input type="text" id="bank-acc-holder" placeholder="Ej: Wilman Esteban Chivata" class="input-field text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="bank-acc-doc">Documento del beneficiario o NIT</label>
                    <input type="text" id="bank-acc-doc" placeholder="Ej: C.C. 1010234134 o NIT" class="input-field text-sm font-mono" />
                  </div>
                </div>
              </div>

              <!-- Opción b: Llave Bre-B -->
              <div class="rounded-lg border border-white/10 bg-black/25 p-3.5 space-y-3">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" id="breb-enabled" class="accent-white h-4 w-4" />
                  <span class="text-sm font-bold text-white">b. Llave Bre-B</span>
                </label>
                <div id="breb-fields" class="hidden grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
                  <div>
                    <label class="block text-xs text-muted mb-1" for="breb-holder">Nombre del beneficiario</label>
                    <input type="text" id="breb-holder" placeholder="Ej: Wilman Esteban Chivata" class="input-field text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="breb-key">Llave Bre-B</label>
                    <input type="text" id="breb-key" placeholder="Ej: 3146105217 o @alias" class="input-field text-sm font-mono" />
                  </div>
                </div>
              </div>

              <!-- Opción c: Cuenta Neobanco -->
              <div class="rounded-lg border border-white/10 bg-black/25 p-3.5 space-y-3">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" id="neobank-enabled" class="accent-white h-4 w-4" />
                  <span class="text-sm font-bold text-white">c. Cuenta Neobanco (Nu, Nequi, Daviplata, Lulo, etc.)</span>
                </label>
                <div id="neobank-fields" class="hidden grid gap-3 sm:grid-cols-3 pt-2 border-t border-white/10">
                  <div>
                    <label class="block text-xs text-muted mb-1" for="neobank-name">Neobanco</label>
                    <input type="text" id="neobank-name" placeholder="Ej: Nequi, Daviplata, Nu, Lulo" class="input-field text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="neobank-holder">Nombre del beneficiario</label>
                    <input type="text" id="neobank-holder" placeholder="Ej: Wilman Esteban Chivata" class="input-field text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-muted mb-1" for="neobank-number">Número de cuenta / Celular</label>
                    <input type="text" id="neobank-number" placeholder="Ej: 3146105217" class="input-field text-sm font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: PRECIOS POR CATEGORÍA -->
            <div class="rounded-xl border border-white/20 bg-surface-raised p-4 space-y-3">
              <div>
                <h3 class="font-title text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <span>🏷️</span> Precios por Categoría
                </h3>
                <p class="text-xs text-muted mt-0.5">
                  Todas las categorías usan el precio estándar configurado arriba. Si alguna categoría tiene un precio diferente (ej: PW o Pitbike a $170.000), marca "Precio distinto" y asígnale el valor específico.
                </p>
              </div>
              <div id="event-category-prices-list" class="space-y-2 max-h-72 overflow-y-auto pr-1"></div>
            </div>

            <!-- SECCIÓN 3: PROMOCIONES POR EVENTO -->
            <div class="rounded-xl border border-white/20 bg-surface-raised p-4 space-y-3">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 class="font-title text-lg text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🎁</span> Promociones del Evento
                  </h3>
                  <p class="text-xs text-muted mt-0.5">
                    Configura promociones automáticas para este evento (2x1, combos de 2 o 3 categorías por valor fijo, descuentos totales o precio unitario por volumen).
                  </p>
                </div>
                <button type="button" id="add-promotion-btn" class="btn-outline text-xs py-1.5 px-3">
                  + Añadir promoción
                </button>
              </div>
              <div id="event-promotions-list" class="space-y-3"></div>
            </div>

            <label class="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" id="event-finished" class="accent-white" />
              Evento finalizado
            </label>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="btn-primary text-sm py-2 px-5">Guardar evento</button>
              <button type="button" id="cancel-event-form" class="btn-outline text-sm py-2 px-4">Cancelar</button>
            </div>
          </form>
        </section>

        ${renderCategoriesAdminSection(usedCategoryIds)}

        <section class="card">
          <h2 class="font-title text-2xl text-secondary mb-4">Inscripciones por evento</h2>
          <p class="text-xs text-muted uppercase tracking-widest font-semibold mb-2">Campeonato</p>
          <div class="flex flex-wrap gap-2 mb-4" id="champ-tabs">${champTabs}</div>
          <p class="text-xs text-muted uppercase tracking-widest font-semibold mb-2">Evento</p>
          <div class="flex flex-wrap gap-2 mb-6" id="event-tabs">${eventTabs}</div>
          <div id="registrations-panels">${registrationsByEvent}</div>
        </section>
      </main>
      ${renderFooter()}
    </div>`;
}

function renderAdminErrorState(errorMessage: string): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4 py-12">
      <div class="card w-full max-w-lg border border-red-500/30 text-center py-10 px-6">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 class="font-title text-2xl text-white uppercase tracking-wider mb-2">No se pudo cargar el panel</h2>
        <p class="text-sm text-silver mb-2">${errorMessage}</p>
        <p class="text-xs text-muted mb-6">El servidor tardó en responder (posible arranque en frío de Apps Script o red lenta). Puedes reintentar la conexión ahora.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button id="admin-retry-btn" class="btn-primary py-2.5 px-6">Reintentar conexión</button>
          <button id="admin-logout-error-btn" class="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-silver hover:text-white hover:border-white/40">Cerrar sesión</button>
        </div>
      </div>
    </div>
    ${renderFooter()}`;

  document.getElementById('admin-retry-btn')?.addEventListener('click', () => {
    refreshAdmin(true);
  });
  document.getElementById('admin-logout-error-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
    sessionStorage.removeItem('minicross_admin_password');
    initAdminPage();
  });
}

async function refreshAdmin(showLoading = false): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  if (showLoading) {
    app.innerHTML = renderLoadingPanel();
  }

  try {
    const adminData = await loadAdminData({ throwOnError: true, forceRefresh: true });
    app.innerHTML = renderAdminPanel(adminData.events, adminData.registrations);
    bindAdminEvents(adminData.events, adminData.registrations);
  } catch (err) {
    Swal.close();
    if (err instanceof Error && err.message === 'No autorizado') {
      sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
      sessionStorage.removeItem('minicross_admin_password');
      initAdminPage();
      return;
    }
    await showError(
      'Error al cargar',
      err instanceof Error ? err.message : 'No se pudieron obtener los datos del panel.'
    );
    renderAdminErrorState(err instanceof Error ? err.message : 'No se pudieron obtener los datos del panel.');
  }
}

async function promptExportFormat(): Promise<ExportFormat | null> {
  const result = await Swal.fire({
    title: 'Formato de exportacion',
    text: 'En que formato deseas descargar las inscripciones?',
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Excel (.xlsx)',
    denyButtonText: 'CSV (.csv)',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#06b6d4',
    denyButtonColor: '#f97316',
  });

  if (result.isConfirmed) return 'xlsx';
  if (result.isDenied) return 'csv';
  return null;
}

function bindAdminEvents(events: Event[], registrations: Registration[]): void {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
    sessionStorage.removeItem('minicross_admin_password');
    initAdminPage();
  });

  bindCategoriesAdmin(getUsedCategoryIds(registrations));

  const panels = document.querySelectorAll('.event-panel');
  const tabs = document.querySelectorAll('.event-tab');
  const champTabs = document.querySelectorAll('.champ-tab');

  const selectEventTab = (tab: Element | undefined): void => {
    tabs.forEach((t) => t.classList.remove('ring-2', 'ring-white'));
    panels.forEach((p) => p.classList.add('hidden'));
    if (!tab) return;
    tab.classList.add('ring-2', 'ring-white');
    const eventId = tab.getAttribute('data-event-id');
    panels.forEach((p) => {
      p.classList.toggle('hidden', p.getAttribute('data-event-panel') !== eventId);
    });
  };

  const selectChampTab = (champId: string): void => {
    champTabs.forEach((t) => {
      const isActive = t.getAttribute('data-champ-tab') === champId;
      t.classList.toggle('ring-2', isActive);
      t.classList.toggle('ring-white', isActive);
      t.classList.toggle('text-white', isActive);
    });
    let firstVisible: Element | undefined;
    tabs.forEach((tab) => {
      const visible = tab.getAttribute('data-champ') === champId;
      (tab as HTMLElement).classList.toggle('hidden', !visible);
      if (visible && !firstVisible) firstVisible = tab;
    });
    selectEventTab(firstVisible);
  };

  champTabs.forEach((tab) => {
    tab.addEventListener('click', () => selectChampTab(tab.getAttribute('data-champ-tab')!));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectEventTab(tab));
  });

  selectChampTab('mx');

  document.querySelectorAll('.export-registrations-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const eventId = btn.getAttribute('data-event-id');
      if (!eventId) return;
      const event = events.find((e) => e.id === eventId);
      const regs = registrations.filter((r) => r.eventId === eventId);
      if (regs.length === 0) return;

      const format = await promptExportFormat();
      if (!format) return;

      exportRegistrations(regs, event?.name ?? 'evento', events, format);
    });
  });

  document.querySelectorAll('.load-results-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')!;
      const event = events.find((e) => e.id === id);
      if (!event) return;
      await openResultsModal(event, async () => {
        await refreshAdmin();
      });
    });
  });

  document.querySelectorAll('.event-active-toggle').forEach((toggle) => {
    toggle.addEventListener('change', async (e) => {
      const id = (e.target as HTMLInputElement).getAttribute('data-id')!;
      const updated = events.map((ev) =>
        ev.id === id ? { ...ev, active: (e.target as HTMLInputElement).checked } : ev
      );
      showSaving('Actualizando evento...');
      try {
        await saveEvents(updated);
        Swal.close();
        await showSuccess('Evento actualizado', 'El estado del evento se guardo correctamente.');
        await refreshAdmin();
      } catch (err) {
        Swal.close();
        await showError('Error', err instanceof Error ? err.message : 'No se pudo actualizar el evento.');
        await refreshAdmin();
      }
    });
  });

  document.querySelectorAll('.event-finished-toggle').forEach((toggle) => {
    toggle.addEventListener('change', async (e) => {
      const id = (e.target as HTMLInputElement).getAttribute('data-id')!;
      const updated = events.map((ev) =>
        ev.id === id ? { ...ev, finished: (e.target as HTMLInputElement).checked } : ev
      );
      showSaving('Actualizando evento...');
      try {
        await saveEvents(updated);
        Swal.close();
        await showSuccess('Evento actualizado', 'El estado de finalizacion se guardo correctamente.');
        await refreshAdmin();
      } catch (err) {
        Swal.close();
        await showError('Error', err instanceof Error ? err.message : 'No se pudo actualizar el evento.');
        await refreshAdmin();
      }
    });
  });

  const eventForm = document.getElementById('event-form') as HTMLFormElement;
  document.getElementById('add-event-btn')?.addEventListener('click', () => {
    eventForm.classList.remove('hidden');
    (document.getElementById('event-form-id') as HTMLInputElement).value = '';
    eventForm.reset();
    (document.getElementById('event-valor-inscripcion') as HTMLInputElement).value = '230000';
    document.getElementById('event-reglamento-preview')?.classList.add('hidden');
    document.getElementById('event-reglamento-current')?.classList.add('hidden');

    const champId =
      ((document.getElementById('event-championship') as HTMLSelectElement)?.value as ChampionshipId) || 'mx';
    initEventFormBanking(champId);
    initEventFormCategories(champId, {}, 230000);
    initEventFormPromotions(champId, []);
  });
  document.getElementById('cancel-event-form')?.addEventListener('click', () => {
    eventForm.classList.add('hidden');
  });

  document.querySelectorAll('.edit-event-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')!;
      const event = events.find((e) => e.id === id);
      if (!event) return;
      eventForm.classList.remove('hidden');
      (document.getElementById('event-form-id') as HTMLInputElement).value = event.id;
      (document.getElementById('event-championship') as HTMLSelectElement).value = event.championshipId;
      (document.getElementById('event-name') as HTMLInputElement).value = event.name;
      (document.getElementById('event-date') as HTMLInputElement).value = parseSheetDate(event.date);
      (document.getElementById('event-location') as HTMLInputElement).value = event.location;
      (document.getElementById('event-city') as HTMLInputElement).value = event.city;
      (document.getElementById('event-description') as HTMLTextAreaElement).value = event.description;
      (document.getElementById('event-valor-inscripcion') as HTMLInputElement).value = String(
        event.valorInscripcion ?? 0
      );
      (document.getElementById('event-finished') as HTMLInputElement).checked = event.finished;
      const reglamentoInput = document.getElementById('event-reglamento') as HTMLInputElement;
      const reglamentoPreview = document.getElementById('event-reglamento-preview');
      const reglamentoCurrent = document.getElementById('event-reglamento-current');
      if (reglamentoInput) reglamentoInput.value = '';
      reglamentoPreview?.classList.add('hidden');
      if (event.reglamentoUrl?.trim()) {
        reglamentoCurrent?.classList.remove('hidden');
        if (reglamentoCurrent) {
          reglamentoCurrent.innerHTML = `Reglamento actual: <a href="${event.reglamentoUrl}" target="_blank" rel="noopener noreferrer" class="text-white hover:underline">Ver PDF</a> (sube otro archivo para reemplazarlo)`;
        }
      } else {
        reglamentoCurrent?.classList.add('hidden');
        if (reglamentoCurrent) reglamentoCurrent.textContent = '';
      }

      initEventFormBanking(event.championshipId, event.bankingInfo);
      initEventFormCategories(event.championshipId, event.categoryPrices, event.valorInscripcion ?? 0);
      initEventFormPromotions(event.championshipId, event.promotions ?? []);
    });
  });

  // Toggle visualización de campos bancarios según checkbox
  document.getElementById('bank-acc-enabled')?.addEventListener('change', (e) => {
    document.getElementById('bank-acc-fields')?.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
  });
  document.getElementById('breb-enabled')?.addEventListener('change', (e) => {
    document.getElementById('breb-fields')?.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
  });
  document.getElementById('neobank-enabled')?.addEventListener('change', (e) => {
    document.getElementById('neobank-fields')?.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
  });

  // Cambio de campeonato en el formulario de evento
  document.getElementById('event-championship')?.addEventListener('change', (e) => {
    const champId = (e.target as HTMLSelectElement).value as ChampionshipId;
    const formId = (document.getElementById('event-form-id') as HTMLInputElement).value;
    const existing = formId ? events.find((ev) => ev.id === formId) : undefined;
    const stdPrice = Number((document.getElementById('event-valor-inscripcion') as HTMLInputElement).value) || 0;

    if (!formId) {
      initEventFormBanking(champId);
    }
    initEventFormCategories(champId, existing?.categoryPrices ?? {}, stdPrice);

    // Actualizar selectores de categorías dentro de las tarjetas de promociones ya abiertas
    document.querySelectorAll('#event-promotions-list .event-promo-card').forEach((card) => {
      const catsList = card.querySelector('.promo-cats-list');
      if (catsList) {
        catsList.innerHTML = renderPromoCategoryCheckboxes(champId);
      }
    });
  });

  // Actualización reactiva del precio estándar de categorías
  document.getElementById('event-valor-inscripcion')?.addEventListener('input', (e) => {
    const stdPrice = Number((e.target as HTMLInputElement).value) || 0;
    document.querySelectorAll('#event-category-prices-list .event-cat-price-row').forEach((row) => {
      const stdLabel = row.querySelector('.event-cat-std-label');
      if (stdLabel) {
        stdLabel.textContent = `(Estándar: ${stdPrice > 0 ? formatCop(stdPrice) : '$0'})`;
      }
    });
  });

  // Toggle de precio distinto por categoría
  const catPricesList = document.getElementById('event-category-prices-list');
  catPricesList?.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('event-cat-custom-toggle')) {
      const row = target.closest('.event-cat-price-row');
      if (!row) return;
      const isChecked = (target as HTMLInputElement).checked;
      const customBox = row.querySelector('.event-cat-custom-box');
      const stdLabel = row.querySelector('.event-cat-std-label');
      const input = row.querySelector('.event-cat-custom-input') as HTMLInputElement | null;

      customBox?.classList.toggle('hidden', !isChecked);
      stdLabel?.classList.toggle('hidden', isChecked);
      if (isChecked && input && !input.value) {
        input.focus();
      }
    }
  });

  // Gestión de promociones
  const promosList = document.getElementById('event-promotions-list');
  document.getElementById('add-promotion-btn')?.addEventListener('click', () => {
    const champId =
      ((document.getElementById('event-championship') as HTMLSelectElement)?.value as ChampionshipId) || 'mx';
    const noHint = document.getElementById('no-promos-hint');
    if (noHint) noHint.remove();

    const newPromo: EventPromotion = {
      id: generateId(),
      name: '',
      type: 'fixed_package',
      minCategories: 2,
      value: 400000,
      active: true,
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderPromotionCard(newPromo, champId);
    const card = tempDiv.firstElementChild;
    if (card && promosList) {
      promosList.appendChild(card);
      (card.querySelector('.promo-name') as HTMLInputElement | null)?.focus();
    }
  });

  promosList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('promo-delete-btn')) {
      const card = target.closest('.event-promo-card');
      card?.remove();
      if (promosList && promosList.children.length === 0) {
        promosList.innerHTML =
          '<p class="text-xs text-muted py-3 text-center" id="no-promos-hint">No hay promociones configuradas para este evento. Haz clic en "+ Añadir promoción".</p>';
      }
    }
  });

  promosList?.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('promo-type')) {
      const card = target.closest('.event-promo-card');
      if (!card) return;
      const select = target as HTMLSelectElement;
      const type = select.value as PromotionType;
      const isTwoForOne = type === 'two_for_one';
      const valueBox = card.querySelector('.promo-value-box');
      const valueLabel = card.querySelector('.promo-value-label');
      const minLabel = card.querySelector('.promo-min-label');
      const valueInput = card.querySelector('.promo-value') as HTMLInputElement | null;

      if (valueLabel) valueLabel.textContent = getPromotionValueLabel(type);
      if (minLabel) minLabel.textContent = getPromotionMinLabel(type);
      if (valueInput) {
        valueInput.placeholder = getPromotionValuePlaceholder(type);
        valueInput.disabled = isTwoForOne;
        if (isTwoForOne) valueInput.value = '';
      }
      if (valueBox) {
        valueBox.classList.toggle('opacity-40', isTwoForOne);
        valueBox.classList.toggle('pointer-events-none', isTwoForOne);
      }
    } else if (target.classList.contains('promo-specific-cats-toggle')) {
      const card = target.closest('.event-promo-card');
      if (!card) return;
      const isChecked = (target as HTMLInputElement).checked;
      const catsList = card.querySelector('.promo-cats-list');
      catsList?.classList.toggle('hidden', !isChecked);
    }
  });

  document.querySelectorAll('.delete-event-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')!;
      const event = events.find((e) => e.id === id);
      const confirmed = await confirmAction(
        'Eliminar evento',
        `Se eliminara "${event?.name ?? 'este evento'}". Las inscripciones asociadas permaneceran.`
      );
      if (!confirmed) return;

      showSaving('Eliminando evento...');
      try {
        await saveEvents(events.filter((e) => e.id !== id));
        Swal.close();
        await showSuccess('Evento eliminado', 'El evento se elimino correctamente.');
        await refreshAdmin();
      } catch (err) {
        Swal.close();
        await showError('Error', err instanceof Error ? err.message : 'No se pudo eliminar el evento.');
      }
    });
  });

  const reglamentoInput = document.getElementById('event-reglamento') as HTMLInputElement | null;
  reglamentoInput?.addEventListener('change', async () => {
    const preview = document.getElementById('event-reglamento-preview');
    const file = reglamentoInput.files?.[0];
    if (!file || !preview) return;
    const maxBytes = CONFIG.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      preview.textContent = `Archivo demasiado grande. Maximo ${CONFIG.maxFileSizeMB} MB.`;
      preview.classList.remove('hidden');
      reglamentoInput.value = '';
      return;
    }
    preview.textContent = `Archivo seleccionado: ${file.name}`;
    preview.classList.remove('hidden');
  });

  eventForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formId = (document.getElementById('event-form-id') as HTMLInputElement).value;
    const isEdit = Boolean(formId);
    const existing = formId ? events.find((ev) => ev.id === formId) : undefined;

    // Recolectar información bancaria de las 3 opciones
    const bankAccEnabled = Boolean((document.getElementById('bank-acc-enabled') as HTMLInputElement)?.checked);
    const breBEnabled = Boolean((document.getElementById('breb-enabled') as HTMLInputElement)?.checked);
    const neobankEnabled = Boolean((document.getElementById('neobank-enabled') as HTMLInputElement)?.checked);

    const bankingInfo: EventBankingInfo = {
      bankAccount: {
        enabled: bankAccEnabled,
        bank: (document.getElementById('bank-acc-bank') as HTMLInputElement)?.value.trim() || '',
        accountType:
          ((document.getElementById('bank-acc-type') as HTMLSelectElement)?.value as 'Ahorros' | 'Corriente') ||
          'Ahorros',
        accountNumber: (document.getElementById('bank-acc-number') as HTMLInputElement)?.value.trim() || '',
        beneficiaryName: (document.getElementById('bank-acc-holder') as HTMLInputElement)?.value.trim() || '',
        beneficiaryDocument: (document.getElementById('bank-acc-doc') as HTMLInputElement)?.value.trim() || '',
      },
      breB: {
        enabled: breBEnabled,
        beneficiaryName: (document.getElementById('breb-holder') as HTMLInputElement)?.value.trim() || '',
        key: (document.getElementById('breb-key') as HTMLInputElement)?.value.trim() || '',
      },
      neobank: {
        enabled: neobankEnabled,
        neobank: (document.getElementById('neobank-name') as HTMLInputElement)?.value.trim() || '',
        beneficiaryName: (document.getElementById('neobank-holder') as HTMLInputElement)?.value.trim() || '',
        accountNumber: (document.getElementById('neobank-number') as HTMLInputElement)?.value.trim() || '',
      },
    };

    // Recolectar precios específicos por categoría
    const categoryPrices: Record<string, number> = {};
    document.querySelectorAll('#event-category-prices-list .event-cat-price-row').forEach((row) => {
      const catId = row.getAttribute('data-cat-id');
      const toggle = row.querySelector('.event-cat-custom-toggle') as HTMLInputElement | null;
      const input = row.querySelector('.event-cat-custom-input') as HTMLInputElement | null;
      if (catId && toggle?.checked && input && input.value !== '') {
        const val = Number(input.value);
        if (!isNaN(val) && val >= 0) {
          categoryPrices[catId] = val;
        }
      }
    });

    // Recolectar promociones
    const promotions: EventPromotion[] = [];
    document.querySelectorAll('#event-promotions-list .event-promo-card').forEach((card) => {
      const promoId = card.getAttribute('data-promo-id') || generateId();
      const nameInput = card.querySelector('.promo-name') as HTMLInputElement | null;
      const activeInput = card.querySelector('.promo-active') as HTMLInputElement | null;
      const typeSelect = card.querySelector('.promo-type') as HTMLSelectElement | null;
      const minInput = card.querySelector('.promo-min') as HTMLInputElement | null;
      const valueInput = card.querySelector('.promo-value') as HTMLInputElement | null;
      const specificToggle = card.querySelector('.promo-specific-cats-toggle') as HTMLInputElement | null;

      const name = nameInput?.value.trim() || '';
      if (!name) return; // Omitir promociones sin nombre

      const pType = (typeSelect?.value as PromotionType) || 'fixed_package';
      const minCats = Math.max(1, Number(minInput?.value) || 2);
      const numVal = Number(valueInput?.value);
      const pValue = pType === 'two_for_one' ? undefined : isNaN(numVal) ? 0 : numVal;

      let applicableCategoryIds: string[] | undefined;
      if (specificToggle?.checked) {
        applicableCategoryIds = [];
        card.querySelectorAll('.promo-cat-check:checked').forEach((chk) => {
          const val = (chk as HTMLInputElement).value;
          if (val) applicableCategoryIds!.push(val);
        });
      }

      promotions.push({
        id: promoId,
        name,
        type: pType,
        minCategories: minCats,
        value: pValue,
        active: activeInput ? activeInput.checked : true,
        applicableCategoryIds,
      });
    });

    const newEvent: EventSavePayload = {
      id: formId || generateId(),
      name: (document.getElementById('event-name') as HTMLInputElement).value,
      date: parseSheetDate((document.getElementById('event-date') as HTMLInputElement).value),
      location: (document.getElementById('event-location') as HTMLInputElement).value,
      city: (document.getElementById('event-city') as HTMLInputElement).value,
      description: (document.getElementById('event-description') as HTMLTextAreaElement).value,
      valorInscripcion: Number((document.getElementById('event-valor-inscripcion') as HTMLInputElement).value) || 0,
      active: existing?.active ?? true,
      finished: (document.getElementById('event-finished') as HTMLInputElement).checked,
      reglamentoUrl: existing?.reglamentoUrl ?? '',
      resultadosUrl: existing?.resultadosUrl ?? '',
      championshipId: (document.getElementById('event-championship') as HTMLSelectElement).value as ChampionshipId,
      bankingInfo,
      categoryPrices,
      promotions,
    };

    const reglamentoFile = (document.getElementById('event-reglamento') as HTMLInputElement).files?.[0];
    if (reglamentoFile) {
      newEvent.reglamentoArchivo = await readFileAsDataUrl(reglamentoFile);
      newEvent.reglamentoFileName = reglamentoFile.name;
      newEvent.reglamentoFileType = reglamentoFile.type || 'application/pdf';
    }

    const updated = formId
      ? events.map((ev) => (ev.id === formId ? { ...ev, ...newEvent, id: formId } : ev))
      : [...events, newEvent];

    showSaving(isEdit ? 'Guardando cambios...' : 'Creando evento...');
    try {
      await saveEvents(updated);
      Swal.close();
      await showSuccess(
        isEdit ? 'Evento actualizado' : 'Evento creado',
        isEdit ? 'Los cambios se guardaron correctamente.' : 'El nuevo evento se creo correctamente.'
      );
      await refreshAdmin();
    } catch (err) {
      Swal.close();
      await showError('Error', err instanceof Error ? err.message : 'No se pudo guardar el evento.');
    }
  });

  document.querySelectorAll('.edit-reg').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')!;
      document.querySelector(`[data-edit-id="${id}"]`)?.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.cancel-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')!;
      document.querySelector(`[data-edit-id="${id}"]`)?.classList.add('hidden');
    });
  });

  document.querySelectorAll('.delete-reg').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id')!;
      const confirmed = await confirmAction(
        'Eliminar inscripcion',
        'Esta accion no se puede deshacer. Se eliminara la inscripcion seleccionada.'
      );
      if (!confirmed) return;

      showSaving('Eliminando inscripcion...');
      try {
        await deleteRegistration(id);
        Swal.close();
        await showSuccess('Inscripcion eliminada', 'La inscripcion se elimino correctamente.');
        await refreshAdmin();
      } catch (err) {
        Swal.close();
        await showError('Error', err instanceof Error ? err.message : 'No se pudo eliminar la inscripcion.');
      }
    });
  });

  document.querySelectorAll('.edit-form').forEach((form) => {
    const birthInput = form.querySelector<HTMLInputElement>('input[name="fechaNacimiento"]');
    birthInput?.addEventListener('change', () =>
      refreshEditFormCategories(form as HTMLFormElement, registrations, events)
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = form.getAttribute('data-id')!;
      const fd = new FormData(form as HTMLFormElement);
      const fechaNacimiento = parseSheetDate(fd.get('fechaNacimiento') as string);
      const categoriaIds = fd.getAll('categoriaIds').map(String);
      const registration = registrations.find((r) => r.id === id);
      const event = events.find((e) => e.id === registration?.eventId);
      const championshipId = registration ? getEventChampionshipId(events, registration.eventId) : 'mx';
      const validCategories = getCategoriesForAge(
        { birthDate: fechaNacimiento, eventDate: event?.date },
        championshipId,
        {
          includeIds: categoriaIds,
        }
      );

      if (!fechaNacimiento) {
        await showError('Fecha invalida', 'Revisa la fecha de nacimiento.');
        return;
      }

      if (categoriaIds.length === 0 || !categoriaIds.every((cid) => validCategories.some((c) => c.id === cid))) {
        await showError('Categorias', 'Selecciona al menos una categoria valida para la edad del piloto.');
        return;
      }

      const categoriaLabel = categoriaIds
        .map((cid) => (getCategoryById(cid) ? formatCategoryOptionLabel(getCategoryById(cid)!) : cid))
        .join('|');

      showSaving('Guardando inscripcion...');
      try {
        await updateRegistration(id, {
          nombre: fd.get('nombre') as string,
          apellido: fd.get('apellido') as string,
          fechaNacimiento,
          email: fd.get('email') as string,
          celular: fd.get('celular') as string,
          ciudad: fd.get('ciudad') as string,
          marcaMoto: fd.get('marcaMoto') as string,
          numeroPiloto: Number(fd.get('numeroPiloto')),
          categoriaId: categoriaIds.join(','),
          categoriaLabel,
        });
        Swal.close();
        await showSuccess('Inscripcion actualizada', 'Los cambios se guardaron correctamente.');
        await refreshAdmin();
      } catch (err) {
        Swal.close();
        await showError('Error', err instanceof Error ? err.message : 'No se pudo guardar la inscripcion.');
      }
    });
  });
}

export async function initAdminPage(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  if (!isAuthenticated()) {
    app.innerHTML = renderLogin();
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const errorEl = document.getElementById('login-error');

      sessionStorage.setItem('minicross_admin_password', password);

      try {
        showSaving('Verificando credenciales...');
        const adminData = await loadAdminData({ throwOnError: true, forceRefresh: true });
        sessionStorage.setItem(CONFIG.storageKeys.adminSession, 'true');
        Swal.close();
        app.innerHTML = renderAdminPanel(adminData.events, adminData.registrations);
        bindAdminEvents(adminData.events, adminData.registrations);
      } catch (err) {
        sessionStorage.removeItem('minicross_admin_password');
        sessionStorage.removeItem(CONFIG.storageKeys.adminSession);
        Swal.close();
        if (errorEl) {
          errorEl.textContent =
            err instanceof Error && err.message === 'No autorizado'
              ? 'Contrasena incorrecta.'
              : err instanceof Error
              ? err.message
              : 'Contrasena incorrecta o error de conexion.';
          errorEl.classList.remove('hidden');
        }
      }
    });
    return;
  }

  await refreshAdmin(true);
}
