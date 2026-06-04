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
      <div class="card border-l-4 border-l-accent hover:border-l-red">
        <span class="font-title text-2xl tracking-wide text-red">${name}</span>
        <span class="mt-1 block text-sm font-bold text-foreground">${formatCategoryAge(cat)}</span>
        ${engine ? `<span class="mt-2 block text-muted text-xs leading-snug">${engine}</span>` : ''}
      </div>`;
  }).join('');
}

export function initHomePage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderNavbar('home')}

    <section class="hero-pattern relative overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div class="animate-fade-in-up order-2 lg:order-1">
            <span class="shield-badge mb-5">Copa MX · Autocolombiana</span>
            <h1 class="font-title text-5xl leading-none tracking-wider text-foreground md:text-7xl">
              LIGA DE<br/>
              <span class="text-red">MOTOCICLISMO</span><br/>
              <span class="text-accent">DE BOGOTÁ</span>
            </h1>
            <p class="mt-6 text-lg text-muted leading-relaxed max-w-xl">
              LIMObog es la liga oficial de motociclismo de Bogotá. Tradición racing,
              orgullo colombiano y competencia profesional con válidas, rankings,
              inscripciones en línea y resultados oficiales.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
              <a href="./inscripcion.html" class="btn-primary text-base px-8">Inscríbete ahora</a>
              <a href="./eventos.html" class="btn-outline text-base px-8">Ver eventos</a>
            </div>
            <div class="mt-10 flex flex-wrap gap-3">
              <div class="stat-pill">
                <span class="font-title text-3xl text-red leading-none">${CATEGORIES.length}</span>
                <span class="text-xs font-semibold text-muted mt-1">Categorías</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-3xl text-red leading-none">MX</span>
                <span class="text-xs font-semibold text-muted mt-1">Autocolombiana</span>
              </div>
              <div class="stat-pill">
                <span class="font-title text-3xl text-red leading-none">2026</span>
                <span class="text-xs font-semibold text-muted mt-1">Temporada</span>
              </div>
            </div>
          </div>
          <div class="flex justify-center animate-fade-in-up order-1 lg:order-2">
            <div class="relative rounded-2xl border border-white/10 bg-surface-raised p-6 shadow-card-hover">
              <div class="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-accent border-2 border-accent/40 flex items-center justify-center font-title text-xl text-ink">🏁</div>
              <img src="./logo-limobog.jpeg" alt="Logo LIMObog — Liga de Motociclismo de Bogotá"
                   class="max-w-xs md:max-w-sm object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-warm py-14">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center mb-10">
          <h2 class="section-title mb-3">¿Qué es LIMObog?</h2>
          <p class="text-muted max-w-2xl mx-auto leading-relaxed">
            La entidad que organiza y regula las competencias oficiales de motociclismo en Bogotá.
          </p>
        </div>
        <div class="mx-auto max-w-3xl text-center text-muted leading-relaxed space-y-4 mb-12">
          <p>
            Nuestra misión es fortalecer el deporte con estándares técnicos, seguridad y una
            identidad que honra la tradición racing y el espíritu competitivo colombiano.
          </p>
          <p>
            Calendarios de válidas, resultados, registro de pilotos y difusión del motociclismo
            bogotano — todo en una plataforma moderna y accesible.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="card-featured text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl border border-accent/30 text-ink">🏁</div>
            <h3 class="font-title text-2xl tracking-wide text-red mb-2">Tradición Racing</h3>
            <p class="text-muted text-sm">Escudos clásicos, estética vintage y motociclismo profesional con identidad institucional moderna.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red/10 text-2xl">🇨🇴</div>
            <h3 class="font-title text-2xl tracking-wide text-red mb-2">Orgullo Colombiano</h3>
            <p class="text-muted text-sm">Amarillo, rojo y blanco en cada válida. Competencia de alto nivel con elegancia deportiva.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-2xl border border-accent/20">⚡</div>
            <h3 class="font-title text-2xl tracking-wide text-red mb-2">Velocidad y Competencia</h3>
            <p class="text-muted text-sm">Rankings, categorías por disciplina, inscripciones en línea y resultados oficiales.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-14 bg-surface">
      <div class="mx-auto max-w-7xl px-4">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 class="section-title mb-2">Categorías oficiales</h2>
            <p class="text-muted max-w-xl">
              Copa MX — Autocolombiana · LIMObog. Elige la categoría acorde a tu edad al momento del evento.
            </p>
          </div>
          <a href="./inscripcion.html" class="btn-secondary shrink-0">Registrarme</a>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderCategoryCards()}
        </div>
      </div>
    </section>

    <section class="section-soft py-14">
      <div class="mx-auto max-w-7xl px-4">
        <h2 class="section-title text-center mb-10">Acceso rápido</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${[
            ['📅', 'Eventos', 'Calendario de válidas', './eventos.html'],
            ['📝', 'Inscripción', 'Registro de pilotos', './inscripcion.html'],
            ['📋', 'Reglamento', 'Normas oficiales', './reglamento.html'],
            ['🏆', 'Resultados', 'Clasificaciones', './resultados.html'],
          ]
            .map(
              ([icon, title, desc, href]) => `
            <a href="${href}" class="card group flex items-start gap-4 hover:border-accent/40">
              <span class="text-3xl">${icon}</span>
              <div>
                <h3 class="font-title text-xl tracking-wide text-red group-hover:text-red-dark">${title}</h3>
                <p class="text-sm text-muted mt-1">${desc}</p>
              </div>
            </a>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="bg-red py-16">
      <div class="mx-auto max-w-4xl px-4 text-center">
        <h2 class="font-title text-4xl md:text-5xl tracking-wider text-white mb-4">¿Listo para competir?</h2>
        <p class="text-white/90 mb-8 text-lg max-w-xl mx-auto">
          Inscríbete en la próxima válida y forma parte de la Liga de Motociclismo de Bogotá.
        </p>
        <a href="./inscripcion.html" class="inline-flex items-center justify-center rounded-xl bg-accent px-10 py-4 text-lg font-bold text-ink border border-accent/40 transition-all duration-300 hover:bg-yellow-light hover:shadow-glow-yellow">
          Registrarme como piloto
        </a>
      </div>
    </section>

    ${renderFooter()}
  `;

  initNavbar();
}
