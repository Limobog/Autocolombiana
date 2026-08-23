import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import { initCategories } from '../utils/storage';
import { getActiveChampionship, type Championship } from '../championships';
import { getEnabledChampionshipCategories, type Category, type ChampionshipId } from '../types';
import { asset } from '../utils/site-context';

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
  return getEnabledChampionshipCategories(championshipId)
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

function renderHero(champ: Championship): string {
  return `
    <section class="hero-geo relative">
      <div class="geo-shapes" aria-hidden="true">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
      <div class="geo-grid absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true"></div>
      <div class="mx-auto max-w-7xl px-4 py-16 md:py-24 relative z-10">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div class="animate-fade-in-up order-2 lg:order-1 text-center lg:text-left">
            <span class="badge-tag mb-6">${champ.badge}</span>
            <h1 class="font-title text-4xl leading-none tracking-wider text-white sm:text-5xl md:text-6xl lg:text-7xl">
              ${champ.heroTitleHtml}
            </h1>
            <p class="mt-2 font-title text-2xl md:text-3xl tracking-widest text-white/80">${champ.heroSubtitle}</p>
            <p class="mt-6 text-base md:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
              ${champ.tagline}<br/>
              <strong class="text-white">Hay un lugar para ti en la pista.</strong>
            </p>
            <div class="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <a href="./inscripcion.html" class="btn-primary text-base px-8">Inscríbete ahora</a>
              <a href="./eventos.html" class="btn-outline text-base px-8">Ver eventos</a>
            </div>
            <div class="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
              <div class="stat-pill">
                <span class="font-title text-3xl text-white leading-none">${getEnabledChampionshipCategories(champ.id).length}</span>
                <span class="text-xs font-semibold text-muted mt-1">Categorías</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-3xl text-white leading-none">${champ.validasCount}</span>
                <span class="text-xs font-semibold text-muted mt-1">${champ.validasLabel.charAt(0).toUpperCase()}${champ.validasLabel.slice(1)}</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-2xl text-white leading-none">${champ.extraStat[0]}</span>
                <span class="text-xs font-semibold text-muted mt-1">${champ.extraStat[1]}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-center animate-fade-in-up order-1 lg:order-2">
            <div class="relative">
              <div class="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-75" aria-hidden="true"></div>
              <img src="${asset(champ.logo)}" alt="${champ.name}"
                   class="relative max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md w-full object-contain drop-shadow-glow-strong" />
            </div>
          </div>
        </div>
      </div>
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

function renderEnduroFormat(champ: Championship): string {
  const cards = champ.calendar
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
            Dos ediciones contra el cronómetro: Sprint Enduro con 2 pruebas especiales, y Hard Scramble.
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
      Aquí no compites rueda a rueda: compites contra el cronómetro. El Sprint Enduro trae 2 pruebas especiales;
      la segunda edición es Hard Scramble en La Pista Off Road. En ambas, tu tiempo define la clasificación.
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
    ['01', 'Contra el reloj', '2 pruebas especiales en Sprint Enduro y un Hard Scramble: tu tiempo es tu resultado. Sin excusas — solo tú y el terreno.'],
    ['02', 'Para todos los niveles', 'De Enduro 1 Infantil a la categoría Oro: novatos, intermedios y expertos tienen su propia clasificación.'],
    ['03', 'Sin complicaciones', 'Inscríbete, revisa las ediciones, lee el reglamento y consulta resultados. Todo desde aquí, en pocos clics.'],
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

function renderQuickAccess(champ: Championship): string {
  return `
    <section class="py-14 bg-surface relative overflow-hidden">
      <div class="geo-grid absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true"></div>
      <div class="mx-auto max-w-7xl px-4 relative z-10">
        <h2 class="section-title text-center mb-10">Acceso rápido</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${[
            ['Eventos', `Calendario de ${champ.validasLabel}`, './eventos.html'],
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
      : 'Dos ediciones y el cronómetro como único rival. Inscríbete, elige tu categoría y demuestra de qué estás hecho en el enduro.';

  return `
    <section class="cta-geo py-16 md:py-20">
      <div class="mx-auto max-w-4xl px-4 text-center relative z-10">
        <h2 class="font-title text-4xl md:text-5xl tracking-wider text-white mb-4">¿Listo para la pista?</h2>
        <p class="text-muted mb-8 text-lg max-w-xl mx-auto">${text}</p>
        <a href="./inscripcion.html" class="btn-primary text-lg px-10 py-4">Registrarme como piloto</a>
      </div>
    </section>`;
}

export async function initHomePage(): Promise<void> {
  try {
    await initCategories();
  } catch {
    /* se usan las categorías por defecto */
  }

  const app = document.getElementById('app');
  if (!app) return;

  const champ = getActiveChampionship();

  app.innerHTML = `
    ${renderNavbar('home')}
    ${renderHero(champ)}
    ${champ.id === 'mx' ? renderMxHighlights() : renderEnduroFormat(champ)}
    ${renderAboutSection(champ)}
    ${renderCategoriesSection(champ)}
    ${renderQuickAccess(champ)}
    ${renderCta(champ)}
    ${renderFooter()}
  `;

  initNavbar();
}
