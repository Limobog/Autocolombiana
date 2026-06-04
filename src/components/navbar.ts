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
         class="px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
           activePage === link.key
             ? 'bg-accent text-ink shadow-glow-yellow'
             : 'text-foreground hover:bg-surface-raised hover:text-accent'
         }">
        ${link.label}
      </a>`
    )
    .join('');

  return `
    <header>
      <div class="colombia-stripe"></div>
      <nav class="sticky top-0 z-50 border-b border-white/10 bg-surface/95 backdrop-blur-md shadow-card">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <a href="./index.html" class="flex items-center gap-3">
            <img src="./logo-limobog.png" alt="Logo LIMOBOG — Liga de Motociclismo de Bogotá" class="h-12 w-auto object-contain md:h-14" />
            <div class="hidden sm:block">
              <p class="font-title text-xl tracking-wider text-red leading-none">LIMOBOG</p>
              <p class="text-xs text-muted font-medium">Liga de Motociclismo de Bogotá</p>
            </div>
          </a>
          <div class="hidden md:flex items-center gap-1">${navLinks}</div>
          <a href="./inscripcion.html" class="hidden sm:inline-flex btn-primary text-sm py-2 px-4">Inscríbete</a>
          <button id="mobile-menu-btn" class="md:hidden p-2 text-foreground" aria-label="Menú">
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
