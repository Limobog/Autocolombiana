const DEVELOPER_LINK = 'https://www.linkedin.com/in/dev-mauricio-sanchez/';

export function renderFooter(): string {
  const year = new Date().getFullYear();
  return `
    <footer class="mt-auto">
      <div class="colombia-stripe"></div>
      <div class="bg-surface-raised border-t border-white/10 py-10 text-center">
        <p class="font-title text-2xl tracking-wider text-red mb-1">LIMOBOG</p>
        <p class="text-sm text-muted mb-4">Liga de Motociclismo de Bogotá · Copa MX Autocolombiana</p>
        <div class="flex flex-wrap justify-center gap-4 mb-6 text-sm font-semibold">
          <a href="./eventos.html" class="text-foreground hover:text-accent transition-colors">Eventos</a>
          <span class="text-gray-metal">|</span>
          <a href="./inscripcion.html" class="text-foreground hover:text-accent transition-colors">Inscripción</a>
          <span class="text-gray-metal">|</span>
          <a href="./reglamento.html" class="text-foreground hover:text-accent transition-colors">Reglamento</a>
        </div>
        <p class="text-xs text-muted">© ${year} LIMOBOG · Developed by <a href="${DEVELOPER_LINK}" target="_blank" rel="noopener noreferrer" class="text-red hover:underline">Mauricio Sánchez Aguilar</a></p>
      </div>
    </footer>`;
}
