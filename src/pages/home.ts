import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import {
  CHAMPIONSHIPS,
  getActiveChampionship,
  onChampionshipChange,
  setActiveChampionship,
  type Championship,
} from '../championships';
import { getChampionshipCategories, type Category, type ChampionshipId } from '../types';

function formatCategoryAge(category: Category): string {
  if (category.maxAge >= 999) {
    if (category.minAge >= 36) return 'Mayor a 35 años';
    if (category.id.startsWith('enduro')) return 'Mayor a 14 años';
    return `Desde ${category.minAge} años`;
  }
  return `${category.minAge} – ${category.maxAge} años`;
}

function splitCategoryLabel(category: Category): { name: string; engine: string } {
  const sep = category.label.indexOf(' — ');
  if (sep >= 0) {
    return { name: category.label.slice(0, sep), engine: category.label.slice(sep + 3) };
  }
  return { name: category.label, engine: '' };
}

function renderCategoryCards(championshipId: ChampionshipId): string {
  return getChampionshipCategories(championshipId)
    .map((cat) => {
      const { name, engine } = splitCategoryLabel(cat);
      return `
      <div class="card border-l-2 border-l-white/30 hover:border-l-white/60">
        <span class="font-title text-2xl tracking-wide text-white">${name}</span>
        <span class="mt-1 block text-sm font-semibold text-silver">${formatCategoryAge(cat)}</span>
        ${engine ? `<span class="mt-2 block text-muted text-xs leading-snug">${engine}</span>` : ''}
      </div>`;
    })
    .join('');
}

function renderSplitPanel(champ: Championship, isActive: boolean): string {
  return `
    <button type="button" class="split-panel split-panel--${champ.id} ${isActive ? 'is-active' : ''}"
            data-champ-panel="${champ.id}" aria-label="Ver ${champ.name}">
      <div class="split-inner">
        <span class="split-active-badge items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
          <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span> Viendo ahora
        </span>
        <img src="${champ.logo}" alt="${champ.name}" class="split-logo" />
        <div>
          <p class="font-title text-3xl md:text-4xl lg:text-5xl leading-none tracking-wider text-white">
            ${champ.heroTitleHtml}
          </p>
          <p class="mt-1 font-title text-lg md:text-xl tracking-widest text-white/80">${champ.heroSubtitle}</p>
        </div>
        <p class="text-muted text-sm md:text-base leading-relaxed max-w-md hidden sm:block">${champ.tagline}</p>
        <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-silver">
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${champ.categoriesCount} categorías</span>
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${champ.validasCount} válidas</span>
          <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">${champ.extraStat[0]} ${champ.extraStat[1].toLowerCase()}</span>
        </div>
        <span class="split-cta inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 font-bold text-ink text-sm">
          Explorar campeonato
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </span>
      </div>
    </button>`;
}

function renderSplitHero(active: Championship): string {
  return `
    <section class="split-hero" aria-label="Elige tu campeonato">
      ${renderSplitPanel(CHAMPIONSHIPS.mx, active.id === 'mx')}
      <div class="split-divider" aria-hidden="true"></div>
      ${renderSplitPanel(CHAMPIONSHIPS.enduro, active.id === 'enduro')}
    </section>`;
}

function renderMxHighlights(): string {
  return `
    <section class="border-y border-white/10 bg-surface-raised/50 py-10 md:py-12">
      <div class="mx-auto max-w-7xl px-4">
        <div class="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          <div class="card-featured text-center md:text-left">
            <p class="font-title text-2xl tracking-wide text-white mb-2">MX + Enduro</p>
            <p class="text-muted text-sm leading-relaxed">
              El único campeonato en todo Colombia que combina categorías de motocross y enduro en una misma temporada.
            </p>
          </div>
          <div class="card text-center md:text-left">
            <p class="font-title text-2xl tracking-wide text-white mb-2">$20.000.000 en premios</p>
            <p class="text-muted text-sm leading-relaxed">
              Bolsa de premiación al final del campeonato para participantes que cumplan los requisitos del reglamento oficial.
            </p>
          </div>
        </div>
      </div>
    </section>`;
}

function renderEnduroFormat(): string {
  const cards = CHAMPIONSHIPS.enduro.calendar
    .map(
      (v) => `
      <div class="card-featured">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <span class="badge-tag mb-2">${v.edition}</span>
            <h3 class="font-title text-3xl tracking-wide text-white">${v.format}</h3>
          </div>
          <p class="font-title text-xl text-silver text-right shrink-0">${v.date}</p>
        </div>
        <p class="text-silver text-sm font-semibold mb-4">📍 ${v.location}</p>
        <ul class="space-y-2 text-muted text-sm leading-relaxed list-disc pl-5 marker:text-silver">
          ${v.details.map((d) => `<li>${d}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('');

  return `
    <section class="border-y border-white/10 bg-surface-raised/50 py-12 md:py-14">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center mb-10">
          <h2 class="section-title mb-3">Formato del campeonato</h2>
          <p class="text-muted max-w-2xl mx-auto">
            Dos válidas contra el cronómetro. La clasificación se define por tiempos en pruebas especiales.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">${cards}</div>
      </div>
    </section>`;
}

function renderAboutSection(champ: Championship): string {
  const mxBody = `
    <p>
      Nacimos de la experiencia del Campeonato Interligas y hoy somos el punto de encuentro de clubes,
      ligas y pilotos de todo el país.
    </p>
    <p>
      Da igual de dónde vengas o con quién compitas: aquí todos suman puntos en igualdad de condiciones.
      Compite en motocross o enduro — somos el único campeonato nacional que reúne ambas disciplinas — y pelea
      por una premiación de $20 millones al cierre de la temporada.
    </p>
    <p>
      Inscríbete en línea, consulta el calendario y sigue tus resultados desde esta misma web.
    </p>`;

  const enduroBody = `
    <p>
      El Festival de Enduro Autocolombiana llega en su primera edición con el mismo equipo organizador
      de la Copa de Clubes MX: eventos serios, seguros y pensados para el piloto.
    </p>
    <p>
      Aquí no compites rueda a rueda: compites contra el cronómetro. Cada válida tiene pruebas especiales
      donde tu tiempo define la clasificación — del Sprint Enduro en Cogua Motopark al Hard Scrambler de La Pista Off Road.
    </p>
    <p>
      Desde infantiles hasta expertos: hay una categoría para tu nivel. Inscríbete en línea y vive el enduro.
    </p>`;

  const cardsMx = [
    ['01', 'Tu club, tu liga', 'Lleva los colores de tu equipo a cada válida y compite por puntos en las 4 fechas. Novatos y expertos, de cualquier ciudad — todos tienen su lugar.'],
    ['02', 'Pura acción', 'Dos mangas que valen, clasificación el domingo y una tabla de puntos que premia la constancia. Cada salida cuenta.'],
    ['03', 'Sin complicaciones', 'Inscríbete, revisa las válidas, lee el reglamento y consulta resultados. Todo desde aquí, en pocos clics.'],
  ];

  const cardsEnduro = [
    ['01', 'Contra el reloj', 'Pruebas especiales cronometradas: tu tiempo es tu resultado. Sin excusas, sin tráfico — solo tú y el terreno.'],
    ['02', 'Para todos los niveles', 'De Enduro 1 Infantil a la categoría Oro: novatos, intermedios y expertos tienen su propia clasificación.'],
    ['03', 'Sin complicaciones', 'Inscríbete, revisa las válidas, lee el reglamento y consulta resultados. Todo desde aquí, en pocos clics.'],
  ];

  const cards = (champ.id === 'mx' ? cardsMx : cardsEnduro)
    .map(
      ([num, title, desc], i) => `
      <div class="${i === 0 ? 'card-featured' : 'card'} text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border ${i === 0 ? 'border-white/15 text-white' : 'border-white/10 text-silver'} bg-white/5 font-title text-2xl">${num}</div>
        <h3 class="font-title text-2xl tracking-wide text-white mb-2">${title}</h3>
        <p class="text-muted text-sm leading-relaxed">${desc}</p>
      </div>`
    )
    .join('');

  return `
    <section class="section-geo py-14 md:py-18">
      <div class="mx-auto max-w-7xl px-4 relative z-10">
        <div class="text-center mb-12 max-w-3xl mx-auto">
          <h2 class="section-title mb-5">${champ.id === 'mx' ? '¿Qué es la Copa?' : '¿Qué es el Festival?'}</h2>
          <div class="text-muted leading-relaxed text-base md:text-lg space-y-3">
            ${champ.id === 'mx' ? mxBody : enduroBody}
          </div>
        </div>
        <div class="grid gap-6 md:grid-cols-3">${cards}</div>
      </div>
    </section>`;
}

function renderCategoriesSection(champ: Championship): string {
  return `
    <section class="section-light py-14">
      <div class="mx-auto max-w-7xl px-4">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 class="section-title mb-2">Categorías oficiales</h2>
            <p class="text-muted max-w-xl">
              ${champ.name} · Elige la categoría acorde a tu edad al momento del evento.
            </p>
          </div>
          <a href="./inscripcion.html" class="btn-primary shrink-0">Registrarme</a>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderCategoryCards(champ.id)}
        </div>
      </div>
    </section>`;
}

function renderQuickAccess(): string {
  return `
    <section class="py-14 bg-surface relative overflow-hidden">
      <div class="geo-grid absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true"></div>
      <div class="mx-auto max-w-7xl px-4 relative z-10">
        <h2 class="section-title text-center mb-10">Acceso rápido</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${[
            ['Eventos', 'Calendario de válidas', './eventos.html'],
            ['Inscripción', 'Registro de pilotos', './inscripcion.html'],
            ['Reglamento', 'Normas oficiales', './reglamento.html'],
            ['Resultados', 'Clasificaciones', './resultados.html'],
          ]
            .map(
              ([title, desc, href]) => `
            <a href="${href}" class="card group block hover:bg-white/5">
              <h3 class="font-title text-xl tracking-wide text-white group-hover:text-silver">${title}</h3>
              <p class="text-sm text-muted mt-2">${desc}</p>
              <span class="inline-block mt-4 text-xs font-semibold uppercase tracking-widest text-silver group-hover:text-white">Ir →</span>
            </a>`
            )
            .join('')}
        </div>
      </div>
    </section>`;
}

function renderCta(champ: Championship): string {
  const text =
    champ.id === 'mx'
      ? 'El único campeonato que une motocross y enduro en Colombia — con $20 millones en premiación al final. Inscríbete, elige tu categoría y sal a demostrar de qué estás hecho.'
      : 'Primera edición, dos válidas y el cronómetro como único rival. Inscríbete, elige tu categoría y demuestra de qué estás hecho en el enduro.';

  return `
    <section class="cta-geo py-16 md:py-20">
      <div class="mx-auto max-w-4xl px-4 text-center relative z-10">
        <h2 class="font-title text-4xl md:text-5xl tracking-wider text-white mb-4">¿Listo para la pista?</h2>
        <p class="text-muted mb-8 text-lg max-w-xl mx-auto">${text}</p>
        <a href="./inscripcion.html" class="btn-primary text-lg px-10 py-4">Registrarme como piloto</a>
      </div>
    </section>`;
}

function renderHomeContent(champ: Championship): string {
  return `
    ${champ.id === 'mx' ? renderMxHighlights() : renderEnduroFormat()}
    ${renderAboutSection(champ)}
    ${renderCategoriesSection(champ)}
    ${renderQuickAccess()}
    ${renderCta(champ)}`;
}

function renderPage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const champ = getActiveChampionship();

  app.innerHTML = `
    ${renderNavbar('home')}
    ${renderSplitHero(champ)}
    <div id="home-content">
      ${renderHomeContent(champ)}
    </div>
    ${renderFooter()}
  `;

  initNavbar();

  document.querySelectorAll<HTMLButtonElement>('[data-champ-panel]').forEach((panel) => {
    panel.addEventListener('click', () => {
      const id = panel.getAttribute('data-champ-panel') as ChampionshipId;
      setActiveChampionship(id);
      // Tras el re-render (síncrono) llevamos al usuario al contenido del campeonato.
      document.getElementById('home-content')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

export function initHomePage(): void {
  renderPage();
  onChampionshipChange(() => renderPage());
}
