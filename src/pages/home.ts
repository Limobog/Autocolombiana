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
      <div class="card flex flex-col gap-2">
        <span class="font-title text-2xl tracking-wide text-secondary">${name}</span>
        <span class="text-accent font-semibold">${formatCategoryAge(cat)}</span>
        ${engine ? `<span class="text-gray-light text-sm leading-snug">${engine}</span>` : ''}
      </div>`;
  }).join('');
}

export function initHomePage(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderNavbar('home')}

    <section class="relative overflow-hidden dirt-texture">
      <div class="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div class="grid items-center gap-12 md:grid-cols-2">
          <div class="animate-fade-in-up">
            <span class="shield-badge mb-4">Liga Oficial · Bogotá</span>
            <h1 class="font-title text-5xl leading-tight tracking-wider md:text-7xl">
              LIGA DE<br/>
              <span class="text-accent">MOTOCICLISMO</span><br/>
              DE BOGOTÁ
            </h1>
            <p class="mt-6 text-lg text-gray-light leading-relaxed">
              LIMObog es la liga oficial de motociclismo de Bogotá. Promovemos la tradición
              motociclística, el orgullo colombiano y la competencia profesional con válidas,
              rankings, inscripciones y un entorno institucional moderno para pilotos,
              equipos y aficionados.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
              <a href="./inscripcion.html" class="btn-primary">Inscríbete ahora</a>
              <a href="./eventos.html" class="btn-outline">Ver eventos</a>
            </div>
          </div>
          <div class="flex justify-center animate-fade-in-up">
            <img src="./logo-limobog.jpeg" alt="Logo LIMObog — Liga de Motociclismo de Bogotá"
                 class="max-w-sm md:max-w-md object-contain" />
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-gray-metal/30 bg-dark/50 py-16">
      <div class="mx-auto max-w-7xl px-4">
        <h2 class="section-title text-center mb-12">¿Qué es LIMObog?</h2>
        <div class="mx-auto max-w-3xl text-center text-gray-light leading-relaxed space-y-4 mb-12">
          <p>
            La Liga de Motociclismo de Bogotá (LIMObog) es la entidad que organiza y regula
            las competencias oficiales de motociclismo en la capital. Nuestra misión es
            fortalecer el deporte con estándares técnicos, seguridad y una identidad que
            honra la tradición racing y el espíritu competitivo colombiano.
          </p>
          <p>
            Desde calendarios de válidas y resultados en vivo hasta el registro de pilotos
            y la difusión del motociclismo bogotano, LIMObog conecta a la comunidad
            motociclista con eventos de alto nivel y una plataforma moderna de gestión.
          </p>
        </div>
        <div class="grid gap-8 md:grid-cols-3">
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">🏁</div>
            <h3 class="font-title text-2xl tracking-wide text-accent mb-3">Tradición Racing</h3>
            <p class="text-gray-light">Estética vintage racing, escudos clásicos y motociclismo profesional con identidad institucional moderna.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">🇨🇴</div>
            <h3 class="font-title text-2xl tracking-wide text-accent mb-3">Orgullo Colombiano</h3>
            <p class="text-gray-light">Colores patrios, competencia de alto nivel y una liga que representa con elegancia deportiva a Bogotá y Colombia.</p>
          </div>
          <div class="card text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">⚡</div>
            <h3 class="font-title text-2xl tracking-wide text-accent mb-3">Velocidad y Competencia</h3>
            <p class="text-gray-light">Válidas oficiales, rankings de pilotos, categorías por disciplina y resultados en tiempo real.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 dirt-texture">
      <div class="mx-auto max-w-7xl px-4">
        <h2 class="section-title text-center mb-4">Categorías oficiales</h2>
        <p class="text-center text-gray-light mb-10 max-w-2xl mx-auto">
          Copa MX — Autocolombiana · LIMObog. Compite en la categoría acorde a tu edad al momento del evento.
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          ${renderCategoryCards()}
        </div>
      </div>
    </section>

    <section class="border-t border-gray-metal/30 bg-blue-dark/30 py-16">
      <div class="mx-auto max-w-4xl px-4 text-center">
        <h2 class="section-title mb-4">¿Listo para competir?</h2>
        <p class="text-gray-light mb-8 text-lg">Inscríbete en la próxima válida y forma parte de la Liga de Motociclismo de Bogotá.</p>
        <a href="./inscripcion.html" class="btn-primary text-lg px-10 py-4">Registrarme como piloto</a>
      </div>
    </section>

    ${renderFooter()}
  `;

  initNavbar();
}
