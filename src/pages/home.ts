import { renderFooter } from '../components/footer';
import { renderNavbar, initNavbar } from '../components/navbar';
import { CATEGORIES, type Category } from '../types';

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

function renderCategoryCards(): string {
  return CATEGORIES.map((cat) => {
    const { name, engine } = splitCategoryLabel(cat);
    return `
      <div class="card border-l-2 border-l-white/30 hover:border-l-white/60">
        <span class="font-title text-2xl tracking-wide text-white">${name}</span>
        <span class="mt-1 block text-sm font-semibold text-silver">${formatCategoryAge(cat)}</span>
        ${engine ? `<span class="mt-2 block text-muted text-xs leading-snug">${engine}</span>` : ''}
      </div>`;
  }).join('');
}

export function initHomePage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderNavbar('home')}

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
            <span class="badge-tag mb-6">De Clubes · MX</span>
            <h1 class="font-title text-4xl leading-none tracking-wider text-white sm:text-5xl md:text-6xl lg:text-7xl">
              COPA<br/>
              <span class="text-silver">AUTOCOLOMBIANA</span>
            </h1>
            <p class="mt-2 font-title text-2xl md:text-3xl tracking-widest text-white/80">DE CLUBES MX</p>
            <p class="mt-6 text-base md:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
              Campeonato privado de motocross organizado por LIMOBOG. Cinco válidas, dos mangas por categoría,
              acumulación de puntos y categorías oficiales desde 50cc hasta MX Master y Enduro.
              Inscríbete en línea y compite en toda la temporada.
            </p>
            <div class="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <a href="./inscripcion.html" class="btn-primary text-base px-8">Inscríbete ahora</a>
              <a href="./eventos.html" class="btn-outline text-base px-8">Ver eventos</a>
            </div>
            <div class="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
              <div class="stat-pill">
                <span class="font-title text-3xl text-white leading-none">${CATEGORIES.length}</span>
                <span class="text-xs font-semibold text-muted mt-1">Categorías</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-3xl text-white leading-none">5</span>
                <span class="text-xs font-semibold text-muted mt-1">Válidas</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-3xl text-white leading-none">2</span>
                <span class="text-xs font-semibold text-muted mt-1">Mangas</span>
              </div>
            </div>
          </div>
          <div class="flex justify-center animate-fade-in-up order-1 lg:order-2">
            <div class="relative">
              <div class="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-75" aria-hidden="true"></div>
              <img src="./logo-copa.png" alt="Copa Autocolombiana de Clubes MX"
                   class="relative max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md w-full object-contain drop-shadow-glow-strong" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-geo py-14 md:py-18">
      <div class="mx-auto max-w-7xl px-4 relative z-10">
        <div class="text-center mb-10">
          <h2 class="section-title mb-3">¿Qué es la Copa?</h2>
          <p class="text-muted max-w-2xl mx-auto leading-relaxed">
            La evolución del Campeonato Interligas: el certamen que une clubes, ligas y pilotos de todo el país.
          </p>
        </div>
        <div class="mx-auto max-w-3xl text-center text-muted leading-relaxed space-y-4 mb-12">
          <p>
            La Copa MX Autocolombiana promueve el desarrollo deportivo de pilotos de todas las edades y niveles,
            con igualdad de oportunidades para competir y sumar puntos sin importar la ciudad, el club o la liga
            a la que pertenezcan.
          </p>
          <p>
            Formato acumulativo por válidas con reglamento propio y estándares FEDEMOTO. Inscripciones digitales,
            calendario de eventos, reglamento oficial y resultados — todo en un solo lugar.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="card-featured text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-white/15 bg-white/5 font-title text-2xl text-white">01</div>
            <h3 class="font-title text-2xl tracking-wide text-white mb-2">Por Clubes y Ligas</h3>
            <p class="text-muted text-sm">Representa a tu club o liga y suma puntos en cada válida. Pilotos de todo el país compiten en igualdad de condiciones durante las 5 fechas del campeonato.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-title text-2xl text-silver">02</div>
            <h3 class="font-title text-2xl tracking-wide text-white mb-2">Formato Oficial</h3>
            <p class="text-muted text-sm">Dos mangas por categoría con acumulación de puntos. Clasificación el domingo a 2 vueltas y puntuación oficial que define la tabla general del evento.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-title text-2xl text-silver">03</div>
            <h3 class="font-title text-2xl tracking-wide text-white mb-2">Todo en Línea</h3>
            <p class="text-muted text-sm">Registro de pilotos, consulta de válidas, reglamento oficial y seguimiento de resultados desde la plataforma web del campeonato.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-light py-14">
      <div class="mx-auto max-w-7xl px-4">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 class="section-title mb-2">Categorías oficiales</h2>
            <p class="text-muted max-w-xl">
              Elige la categoría acorde a tu edad al momento del evento.
            </p>
          </div>
          <a href="./inscripcion.html" class="btn-primary shrink-0">Registrarme</a>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderCategoryCards()}
        </div>
      </div>
    </section>

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
    </section>

    <section class="cta-geo py-16 md:py-20">
      <div class="mx-auto max-w-4xl px-4 text-center relative z-10">
        <h2 class="font-title text-4xl md:text-5xl tracking-wider text-white mb-4">¿Listo para la pista?</h2>
        <p class="text-muted mb-8 text-lg max-w-xl mx-auto">
          Inscríbete en la próxima válida de la Copa Autocolombiana de Clubes MX.
        </p>
        <a href="./inscripcion.html" class="btn-primary text-lg px-10 py-4">Registrarme como piloto</a>
      </div>
    </section>

    ${renderFooter()}
  `;

  initNavbar();
}
