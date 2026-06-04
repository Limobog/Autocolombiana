const DEVELOPER_LINK = 'https://www.linkedin.com/in/dev-mauricio-sanchez/';

export function renderFooter(): string {
  const year = new Date().getFullYear();
  return `
    <footer class="border-t border-gray-metal/30 py-8 text-center text-sm text-gray-light">
      <p class="font-title text-lg tracking-wider text-accent mb-2">LIMObog</p>
      <p class="text-gray-metal mb-3">Liga de Motociclismo de Bogotá</p>
      <p>© ${year} LIMObog · Developed by <a href="${DEVELOPER_LINK}" target="_blank" rel="noopener noreferrer" class="text-secondary hover:text-accent transition-colors">Mauricio Sánchez Aguilar</a></p>
    </footer>`;
}
