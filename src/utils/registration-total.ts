import type { Event, PromotionType } from '../types';

export function countCategoryIds(categoriaId: string): number {
  if (!categoriaId) return 0;
  return categoriaId
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function parseCategoryIdsList(categoriaIdOrIds: string | string[]): string[] {
  if (Array.isArray(categoriaIdOrIds)) {
    return categoriaIdOrIds.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(categoriaIdOrIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getCategoryBasePrice(event: Event | undefined, categoryId: string): number {
  if (!event) return 0;
  if (event.categoryPrices && typeof event.categoryPrices[categoryId] === 'number') {
    return event.categoryPrices[categoryId];
  }
  return Number(event.valorInscripcion) || 0;
}

export function hasCustomCategoryPrice(event: Event | undefined, categoryId: string): boolean {
  if (!event || !event.categoryPrices) return false;
  return typeof event.categoryPrices[categoryId] === 'number';
}

export interface CategoryPriceItem {
  categoryId: string;
  basePrice: number;
  isCustom: boolean;
}

export interface AppliedPromotionInfo {
  id: string;
  name: string;
  type: PromotionType;
  discount: number;
  description: string;
}

export interface RegistrationPricingResult {
  subtotal: number;
  total: number;
  discount: number;
  appliedPromotion?: AppliedPromotionInfo;
  itemized: CategoryPriceItem[];
  categoryCount: number;
}

export function calculateRegistrationPricing(
  event: Event | undefined,
  categoriaIdOrIds: string | string[]
): RegistrationPricingResult {
  const selectedIds = parseCategoryIdsList(categoriaIdOrIds);
  const categoryCount = selectedIds.length;

  if (!event || categoryCount === 0) {
    return {
      subtotal: 0,
      total: 0,
      discount: 0,
      itemized: [],
      categoryCount: 0,
    };
  }

  const itemized: CategoryPriceItem[] = selectedIds.map((id) => ({
    categoryId: id,
    basePrice: getCategoryBasePrice(event, id),
    isCustom: hasCustomCategoryPrice(event, id),
  }));

  const subtotal = itemized.reduce((acc, item) => acc + item.basePrice, 0);

  const activePromotions = (event.promotions || []).filter((p) => p.active !== false);

  let bestPromo: AppliedPromotionInfo | undefined;

  for (const promo of activePromotions) {
    const applicableIds = promo.applicableCategoryIds && promo.applicableCategoryIds.length > 0
      ? promo.applicableCategoryIds
      : null;

    const eligible = applicableIds
      ? selectedIds.filter((id) => applicableIds.includes(id))
      : [...selectedIds];

    const nonEligible = applicableIds
      ? selectedIds.filter((id) => !applicableIds.includes(id))
      : [];

    const minReq = Number(promo.minCategories) || 2;
    if (eligible.length < minReq) {
      continue;
    }

    const nonEligibleSubtotal = nonEligible.reduce(
      (sum, id) => sum + getCategoryBasePrice(event, id),
      0
    );
    const eligibleSubtotal = eligible.reduce(
      (sum, id) => sum + getCategoryBasePrice(event, id),
      0
    );

    let promoEligibleCost = eligibleSubtotal;
    let promoDescription = '';

    if (promo.type === 'fixed_package') {
      const packageValue = Number(promo.value) || 0;
      if (packageValue <= 0) continue;

      // Ordenamos las categorías elegibles de mayor a menor precio base
      const sortedEligible = [...eligible].sort(
        (a, b) => getCategoryBasePrice(event, b) - getCategoryBasePrice(event, a)
      );

      // El combo cubre exactamente `minReq` categorías
      const extraCategories = sortedEligible.slice(minReq);
      const extraCost = extraCategories.reduce(
        (sum, id) => sum + getCategoryBasePrice(event, id),
        0
      );
      promoEligibleCost = packageValue + extraCost;
      promoDescription = `Paquete de ${minReq} categorías por ${formatCop(packageValue)}`;
    } else if (promo.type === 'two_for_one') {
      // 2x1: Por cada 2 categorías elegibles, la de menor valor es gratis
      const freeCount = Math.floor(eligible.length / 2);
      if (freeCount <= 0) continue;

      const sortedEligibleAsc = [...eligible].sort(
        (a, b) => getCategoryBasePrice(event, a) - getCategoryBasePrice(event, b)
      );
      const freeItems = sortedEligibleAsc.slice(0, freeCount);
      const freeAmount = freeItems.reduce(
        (sum, id) => sum + getCategoryBasePrice(event, id),
        0
      );
      promoEligibleCost = Math.max(0, eligibleSubtotal - freeAmount);
      promoDescription = `2x1: ${freeCount} categoría(s) gratis`;
    } else if (promo.type === 'unit_price_tier') {
      const unitTier = Number(promo.value) || 0;
      if (unitTier <= 0) continue;

      promoEligibleCost = unitTier * eligible.length;
      promoDescription = `${formatCop(unitTier)} por categoría desde ${minReq} categorías`;
    } else if (promo.type === 'total_discount_fixed') {
      const fixedDisc = Number(promo.value) || 0;
      if (fixedDisc <= 0) continue;

      promoEligibleCost = Math.max(0, eligibleSubtotal - fixedDisc);
      promoDescription = `Descuento de ${formatCop(fixedDisc)} por ${minReq}+ categorías`;
    } else if (promo.type === 'total_discount_percent') {
      const pct = Math.min(100, Math.max(0, Number(promo.value) || 0));
      if (pct <= 0) continue;

      const discountAmt = Math.round((eligibleSubtotal * pct) / 100);
      promoEligibleCost = Math.max(0, eligibleSubtotal - discountAmt);
      promoDescription = `${pct}% de descuento por ${minReq}+ categorías`;
    }

    const totalWithPromo = promoEligibleCost + nonEligibleSubtotal;
    const discount = Math.max(0, subtotal - totalWithPromo);

    if (discount > 0 && (!bestPromo || discount > bestPromo.discount)) {
      bestPromo = {
        id: promo.id,
        name: promo.name || 'Promoción aplicada',
        type: promo.type,
        discount,
        description: promoDescription,
      };
    }
  }

  const discount = bestPromo ? bestPromo.discount : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    total,
    discount,
    appliedPromotion: bestPromo,
    itemized,
    categoryCount,
  };
}

export function computeRegistrationTotal(
  event: Event | undefined,
  categoriaIdOrIds: string | string[]
): number {
  return calculateRegistrationPricing(event, categoriaIdOrIds).total;
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function resolveRegistrationTotal(
  reg: { eventId: string; categoriaId: string; valorTotalInscripcion?: number },
  events: Event[]
): number {
  if (reg.valorTotalInscripcion != null && reg.valorTotalInscripcion > 0) {
    return reg.valorTotalInscripcion;
  }
  const event = events.find((e) => e.id === reg.eventId);
  return computeRegistrationTotal(event, reg.categoriaId);
}
