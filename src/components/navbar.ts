// Panel admin oculto: panel-minicross-gestion-2026.html

export function renderNavbar(activePage: 'home' | 'eventos' | 'inscripcion' | 'reglamento' = 'home'): string {
  const links = [
    { href: './index.html', label: 'Inicio', key: 'home' },
    { href: './eventos.html', label: 'Eventos', key: 'eventos' },
    { href: './inscripcion.html', label: 'Inscripción', key: 'inscripcion' },
    { href: './reglamento.html', label: 'Reglamento', key: 'reglamento' },
  ];

  const navLinks = links
    .map(
      (link) => `
      <a href="${link.href}"
         class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
           activePage === link.key
             ? 'bg-white text-ink shadow-glow'
             : 'text-silver hover:bg-white/5 hover:text-white'
         }">
        ${link.label}
      </a>`
    )
    .join('');

  return `
    <header>
      <nav class="sticky top-0 z-50 border-b border-white/10 bg-surface/90 backdrop-blur-md">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a href="./index.html" class="flex items-center gap-3 min-w-0">
            <img src="./logo-copa.png" alt="Copa Autocolombiana de Clubes MX" class="h-10 w-auto object-contain md:h-12 shrink-0" />
            <div class="hidden lg:block min-w-0 border-l border-white/10 pl-3">
              <p class="font-title text-lg tracking-wider text-white leading-none truncate">Copa Autocolombiana</p>
              <p class="text-[10px] text-muted font-medium uppercase tracking-widest mt-0.5">Clubes MX</p>
            </div>
          </a>
          <div class="hidden md:flex items-center gap-1">${navLinks}</div>
          <a href="./inscripcion.html" class="hidden sm:inline-flex btn-primary text-sm py-2 px-4 shrink-0">Inscríbete</a>
          <button id="mobile-menu-btn" class="md:hidden p-2 text-white shrink-0" aria-label="Menú">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
        <div id="mobile-menu" class="hidden md:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-surface-raised">
          ${navLinks}
          <a href="./inscripcion.html" class="btn-primary w-full text-center mt-2">Inscríbete</a>
        </div>
      </nav>
    </header>`;
}

export function initNavbar(): void {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  btn?.addEventListener('click', () => menu?.classList.toggle('hidden'));
}
