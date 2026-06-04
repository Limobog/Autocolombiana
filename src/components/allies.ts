/** Logos de aliados — tamaños y ubicación distintos al logo principal de la copa. */

export function renderAlliesBar(compact = false): string {
  if (compact) {
    return `
      <div class="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-80">
        <img src="./logo-limobog-aliado.png" alt="LIMOBOG" class="h-8 md:h-9 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300" />
        <img src="./logo-aliados.png" alt="Aliados — KTM, Husqvarna, GASGAS" class="h-7 md:h-8 w-auto max-w-[200px] object-contain" />
      </div>`;
  }

  return `
    <section class="allies-section relative overflow-hidden border-t border-white/10 py-12 md:py-16">
      <div class="geo-grid absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true"></div>
      <div class="mx-auto max-w-7xl px-4 relative z-10">
        <p class="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted mb-8">Aliados oficiales</p>
        <div class="flex flex-col items-center gap-10 md:flex-row md:justify-center md:items-center md:gap-16 lg:gap-24">
          <div class="flex flex-col items-center gap-3 shrink-0">
            <img src="./logo-limobog-aliado.png" alt="LIMOBOG — Liga de Motociclismo de Bogotá"
                 class="h-14 md:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            <span class="text-[10px] uppercase tracking-widest text-muted">LIMOBOG</span>
          </div>
          <div class="hidden md:block w-px h-20 bg-white/15" aria-hidden="true"></div>
          <div class="flex flex-col items-center gap-3 max-w-md">
            <img src="./logo-aliados.png" alt="Marcas aliadas — KTM, Husqvarna, GASGAS"
                 class="h-12 md:h-14 w-full max-w-sm object-contain" />
            <span class="text-[10px] uppercase tracking-widest text-muted">Marcas aliadas</span>
          </div>
        </div>
      </div>
    </section>`;
}
