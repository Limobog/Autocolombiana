import assert from 'node:assert';

function formatCop(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCategoryIdsList(categoriaIdOrIds) {
  if (Array.isArray(categoriaIdOrIds)) {
    return categoriaIdOrIds.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(categoriaIdOrIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCategoryBasePrice(event, categoryId) {
  if (!event) return 0;
  if (event.categoryPrices && typeof event.categoryPrices[categoryId] === 'number') {
    return event.categoryPrices[categoryId];
  }
  return Number(event.valorInscripcion) || 0;
}

function hasCustomCategoryPrice(event, categoryId) {
  if (!event || !event.categoryPrices) return false;
  return typeof event.categoryPrices[categoryId] === 'number';
}

function calculateRegistrationPricing(event, categoriaIdOrIds) {
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

  const itemized = selectedIds.map((id) => ({
    categoryId: id,
    basePrice: getCategoryBasePrice(event, id),
    isCustom: hasCustomCategoryPrice(event, id),
  }));

  const subtotal = itemized.reduce((acc, item) => acc + item.basePrice, 0);
  const activePromotions = (event.promotions || []).filter((p) => p.active !== false);

  let bestPromo;

  for (const promo of activePromotions) {
    const applicableIds =
      promo.applicableCategoryIds && promo.applicableCategoryIds.length > 0
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

      const sortedEligible = [...eligible].sort(
        (a, b) => getCategoryBasePrice(event, b) - getCategoryBasePrice(event, a)
      );

      const extraCategories = sortedEligible.slice(minReq);
      const extraCost = extraCategories.reduce(
        (sum, id) => sum + getCategoryBasePrice(event, id),
        0
      );
      promoEligibleCost = packageValue + extraCost;
      promoDescription = `Paquete de ${minReq} categorías por ${formatCop(packageValue)}`;
    } else if (promo.type === 'two_for_one') {
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

console.log('🧪 Iniciando pruebas de tarifas bancarias, precios y promociones...');

// CASO 1: Precio estándar ($230.000)
const event1 = {
  id: 'evt-1',
  name: 'Válida 1',
  valorInscripcion: 230000,
};
const res1 = calculateRegistrationPricing(event1, ['mx-novatos']);
assert.strictEqual(res1.subtotal, 230000);
assert.strictEqual(res1.total, 230000);
assert.strictEqual(res1.discount, 0);
console.log('✅ Caso 1: 1 categoría estándar = $230.000');

// CASO 2: Precio especial por categoría (PW o Pitbike a $170.000)
const event2 = {
  id: 'evt-2',
  name: 'Válida 2',
  valorInscripcion: 230000,
  categoryPrices: {
    '50cc-4-6': 170000,
    'pitbike': 170000,
  },
};
const res2 = calculateRegistrationPricing(event2, ['50cc-4-6']);
assert.strictEqual(res2.subtotal, 170000);
assert.strictEqual(res2.total, 170000);
assert.strictEqual(res2.itemized[0].isCustom, true);
console.log('✅ Caso 2: Categoría PW especial = $170.000');

// CASO 3: Inscripción combinada: 1 especial ($170.000) + 1 estándar ($230.000)
const res3 = calculateRegistrationPricing(event2, ['50cc-4-6', 'mx-novatos']);
assert.strictEqual(res3.subtotal, 400000);
assert.strictEqual(res3.total, 400000);
console.log('✅ Caso 3: Combinación PW ($170.000) + MX Novatos ($230.000) = $400.000');

// CASO 4: Promoción Combo 2 categorías ($400.000) y Combo 3 categorías ($600.000)
const eventPromoCombos = {
  id: 'evt-3',
  name: 'Válida 3',
  valorInscripcion: 230000,
  promotions: [
    {
      id: 'combo-2',
      name: 'Combo 2 Categorías',
      type: 'fixed_package',
      minCategories: 2,
      value: 400000,
      active: true,
    },
    {
      id: 'combo-3',
      name: 'Combo 3 Categorías',
      type: 'fixed_package',
      minCategories: 3,
      value: 600000,
      active: true,
    },
  ],
};

// 2 categorías estándar: subtotal = 460.000, combo 2 = 400.000, descuento = 60.000
const res4_2 = calculateRegistrationPricing(eventPromoCombos, ['mx-novatos', 'mx-b']);
assert.strictEqual(res4_2.subtotal, 460000);
assert.strictEqual(res4_2.total, 400000);
assert.strictEqual(res4_2.discount, 60000);
assert.strictEqual(res4_2.appliedPromotion?.id, 'combo-2');
console.log('✅ Caso 4a: Combo 2 categorías = $400.000 (Ahorro $60.000)');

// 3 categorías estándar: subtotal = 690.000, combo 3 = 600.000, descuento = 90.000
const res4_3 = calculateRegistrationPricing(eventPromoCombos, ['mx-novatos', 'mx-b', 'mx-a']);
assert.strictEqual(res4_3.subtotal, 690000);
assert.strictEqual(res4_3.total, 600000);
assert.strictEqual(res4_3.discount, 90000);
assert.strictEqual(res4_3.appliedPromotion?.id, 'combo-3');
console.log('✅ Caso 4b: Combo 3 categorías = $600.000 (Ahorro $90.000)');

// CASO 5: Promoción 2x1
const event2x1 = {
  id: 'evt-4',
  name: 'Válida 4',
  valorInscripcion: 230000,
  promotions: [
    {
      id: 'p-2x1',
      name: '2x1 Especial',
      type: 'two_for_one',
      minCategories: 2,
      active: true,
    },
  ],
};
const res5 = calculateRegistrationPricing(event2x1, ['mx-novatos', 'mx-b']);
assert.strictEqual(res5.subtotal, 460000);
assert.strictEqual(res5.total, 230000);
assert.strictEqual(res5.discount, 230000);
assert.strictEqual(res5.appliedPromotion?.type, 'two_for_one');
console.log('✅ Caso 5: Promoción 2x1 (2 categorías pagan 1 = $230.000)');

// CASO 6: Promoción con categorías específicas elegibles
const eventSpecific = {
  id: 'evt-5',
  name: 'Válida 5',
  valorInscripcion: 230000,
  promotions: [
    {
      id: 'p-spec',
      name: 'Descuento $50k en Juveniles',
      type: 'total_discount_fixed',
      minCategories: 2,
      value: 50000,
      applicableCategoryIds: ['65cc-a', '85cc-a'],
      active: true,
    },
  ],
};
// 1 elegible + 1 no elegible -> no alcanza mínimo de 2 elegibles
const res6_no = calculateRegistrationPricing(eventSpecific, ['65cc-a', 'mx-novatos']);
assert.strictEqual(res6_no.discount, 0);

// 2 elegibles + 1 no elegible -> aplica descuento solo a las elegibles
const res6_yes = calculateRegistrationPricing(eventSpecific, ['65cc-a', '85cc-a', 'mx-novatos']);
assert.strictEqual(res6_yes.subtotal, 690000);
assert.strictEqual(res6_yes.total, 640000);
assert.strictEqual(res6_yes.discount, 50000);
console.log('✅ Caso 6: Promoción aplicada solo a categorías específicas');

// CASO 7: Promoción de precio unitario por volumen (ej: cada una a $200.000 si son 2 o más)
const eventTier = {
  id: 'evt-6',
  name: 'Válida 6',
  valorInscripcion: 230000,
  promotions: [
    {
      id: 'p-tier',
      name: 'Precio por volumen',
      type: 'unit_price_tier',
      minCategories: 2,
      value: 200000,
      active: true,
    },
  ],
};
const res7 = calculateRegistrationPricing(eventTier, ['mx-novatos', 'mx-b']);
assert.strictEqual(res7.subtotal, 460000);
assert.strictEqual(res7.total, 400000);
assert.strictEqual(res7.discount, 60000);
console.log('✅ Caso 7: Precio unitario por volumen (2 categorías a $200.000 c/u = $400.000)');

console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
