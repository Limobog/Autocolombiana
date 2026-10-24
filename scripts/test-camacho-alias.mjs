import assert from 'node:assert';

// Lógica de normalización y matching exacta de src/utils/championship.ts
function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDocument(doc) {
  return doc.replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
}

function tokenizeName(name) {
  const normalized = normalizeKey(name);
  if (!normalized) return [];
  const stopWords = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'jr', 'junior', 'hijo', 'ii', 'iii']);
  return normalized
    .split(' ')
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function areTokensFuzzyEqual(tokenA, tokenB) {
  if (tokenA === tokenB) return true;
  const maxLen = Math.max(tokenA.length, tokenB.length);
  if (maxLen <= 4) return false;
  const dist = levenshteinDistance(tokenA, tokenB);
  return maxLen <= 7 ? dist <= 1 : dist <= 2;
}

function areFirstNamesCompatible(tokenA, tokenB) {
  if (tokenA === tokenB) return true;
  if (areTokensFuzzyEqual(tokenA, tokenB)) return true;
  const [shorter, longer] = tokenA.length <= tokenB.length ? [tokenA, tokenB] : [tokenB, tokenA];
  if (shorter.length >= 3 && longer.startsWith(shorter)) return true;
  return false;
}

const KNOWN_RIDER_ALIAS_EXCEPTIONS = [
  {
    number: '413',
    canonicalName: 'Samuel Emilio CAMACHO SAENZ',
    aliases: ['emilio camacho', 'samuel emilio camacho saenz', 'samuel emilio camacho'],
  },
  {
    number: '169',
    canonicalName: 'Iván Santiago Chaparro',
    aliases: ['santiago chaparro', 'ivan santiago chaparro', 'ivan chaparro'],
  },
];

function checkKnownRiderAliasException(candidate, existing) {
  const cleanCandNum = candidate.number.replace(/^#+/, '').trim();
  const existHasNum = (num) =>
    existing.allNumbers.some((n) => n.replace(/^#+/, '').trim() === num) ||
    existing.number.replace(/^#+/, '').trim() === num;

  const normCandName = normalizeKey(candidate.name);
  const normExistName = normalizeKey(existing.name);

  for (const exc of KNOWN_RIDER_ALIAS_EXCEPTIONS) {
    const candHasNum = cleanCandNum === exc.number || !cleanCandNum;
    const existHasNumMatch = existHasNum(exc.number) || !existing.number;
    if (!candHasNum || !existHasNumMatch) continue;

    const candMatches = exc.aliases.some(
      (a) => normalizeKey(a) === normCandName || normCandName.includes(normalizeKey(a)) || normalizeKey(a).includes(normCandName)
    );
    const existMatches = exc.aliases.some(
      (a) => normalizeKey(a) === normExistName || normExistName.includes(normalizeKey(a)) || normalizeKey(a).includes(normExistName)
    );

    if (candMatches && existMatches) {
      return true;
    }
  }
  return false;
}

function resolveKnownRiderCanonicalName(name, number) {
  const cleanNum = number.replace(/^#+/, '').trim();
  const normName = normalizeKey(name);

  for (const exc of KNOWN_RIDER_ALIAS_EXCEPTIONS) {
    const numMatches = !cleanNum || cleanNum === exc.number;
    if (numMatches) {
      const isAlias = exc.aliases.some(
        (a) => normalizeKey(a) === normName || normName.includes(normalizeKey(a)) || normalizeKey(a).includes(normName)
      );
      if (isAlias) {
        return exc.canonicalName;
      }
    }
  }
  return name;
}

function areRidersSamePerson(candidate, existing) {
  if (candidate.documentId && existing.documentId) {
    const docA = normalizeDocument(candidate.documentId);
    const docB = normalizeDocument(existing.documentId);
    if (docA && docB && docA === docB) return true;
  }

  if (checkKnownRiderAliasException(candidate, existing)) {
    return true;
  }

  const normA = normalizeKey(candidate.name);
  const normB = normalizeKey(existing.name);
  if (normA && normB && normA === normB) return true;

  const tokensA = tokenizeName(candidate.name);
  const tokensB = tokenizeName(existing.name);
  const cleanNumA = candidate.number.replace(/^#+/, '').trim();
  const numMatches = cleanNumA && existing.allNumbers.some((num) => num.replace(/^#+/, '').trim() === cleanNumA);

  if (tokensA.length === 0 || tokensB.length === 0) return Boolean(numMatches);

  const firstA = tokensA[0];
  const firstB = tokensB[0];
  const firstNamesCompatible = areFirstNamesCompatible(firstA, firstB);
  if (!firstNamesCompatible) return false;

  if (numMatches) {
    const restA = tokensA.slice(1);
    const restB = tokensB.slice(1);
    if (restA.length > 0 && restB.length > 0) {
      const shareLastName = restA.some((tA) => restB.some((tB) => areTokensFuzzyEqual(tA, tB) || tA === tB));
      if (shareLastName) return true;
    } else {
      return true;
    }
  }

  return false;
}

console.log('🧪 Iniciando prueba de unificación aislada para el piloto #413 y #169...');

// Test 1: Comprobar que candidate "Samuel Emilio CAMACHO SAENZ" (#413) coincide con existing "EMILIO CAMACHO" (#413)
const cand1 = { name: 'Samuel Emilio CAMACHO SAENZ', number: '#413' };
const exist1 = { name: 'EMILIO CAMACHO', number: '#413', allNumbers: ['#413'] };
assert.strictEqual(areRidersSamePerson(cand1, exist1), true, 'Debe coincidir por la excepción aislada');
console.log('✅ Prueba 1 superada: areRidersSamePerson reconoce #413 EMILIO CAMACHO == Samuel Emilio CAMACHO SAENZ');

// Test 2: Inverso (V2 procesado primero, luego V1)
const cand2 = { name: 'EMILIO CAMACHO', number: '#413' };
const exist2 = { name: 'Samuel Emilio CAMACHO SAENZ', number: '#413', allNumbers: ['#413'] };
assert.strictEqual(areRidersSamePerson(cand2, exist2), true, 'Debe coincidir en orden inverso');
console.log('✅ Prueba 2 superada: Coincidencia en orden inverso');

// Test 3: resolveKnownRiderCanonicalName Camacho
assert.strictEqual(
  resolveKnownRiderCanonicalName('EMILIO CAMACHO', '#413'),
  'Samuel Emilio CAMACHO SAENZ'
);
assert.strictEqual(
  resolveKnownRiderCanonicalName('Samuel Emilio CAMACHO SAENZ', '#413'),
  'Samuel Emilio CAMACHO SAENZ'
);
console.log('✅ Prueba 3 superada: resolveKnownRiderCanonicalName Camacho devuelve el nombre canónico completo');

// Test 4: Comprobar Iván Santiago Chaparro (#169) vs Santiago CHAPARRO (#169)
const candChaparro1 = { name: 'Santiago CHAPARRO', number: '#169' };
const existChaparro1 = { name: 'Iván Santiago Chaparro', number: '#169', allNumbers: ['#169'] };
assert.strictEqual(areRidersSamePerson(candChaparro1, existChaparro1), true, 'Chaparro debe coincidir por excepción aislada');
console.log('✅ Prueba 4 superada: areRidersSamePerson reconoce #169 Santiago CHAPARRO == Iván Santiago Chaparro');

// Test 5: Inverso Chaparro
const candChaparro2 = { name: 'Iván Santiago Chaparro', number: '#169' };
const existChaparro2 = { name: 'Santiago CHAPARRO', number: '#169', allNumbers: ['#169'] };
assert.strictEqual(areRidersSamePerson(candChaparro2, existChaparro2), true, 'Chaparro debe coincidir en orden inverso');
console.log('✅ Prueba 5 superada: Chaparro coincidencia en orden inverso');

// Test 6: resolveKnownRiderCanonicalName Chaparro
assert.strictEqual(
  resolveKnownRiderCanonicalName('Santiago CHAPARRO', '#169'),
  'Iván Santiago Chaparro'
);
assert.strictEqual(
  resolveKnownRiderCanonicalName('Iván Santiago Chaparro', '#169'),
  'Iván Santiago Chaparro'
);
console.log('✅ Prueba 6 superada: resolveKnownRiderCanonicalName Chaparro devuelve Iván Santiago Chaparro');

// Test 7: Control negativo - Otros pilotos con nombres distintos NO deben unificarse
const candOther = { name: 'Martin Gomez', number: '#12' };
const existOther = { name: 'Matias Gomez', number: '#12', allNumbers: ['#12'] };
assert.strictEqual(areRidersSamePerson(candOther, existOther), false, 'Otros pilotos no deben verse afectados');
console.log('✅ Prueba 7 superada: Control negativo - Otros pilotos no se ven afectados');

// Test 8: Simulación de acumulación de puntos en MX Novatos para Chaparro
function simulateChaparroStandings() {
  const events = [
    {
      id: 'evt-001',
      entries: [{ number: '169', name: 'Iván Santiago Chaparro', points: 15 }],
    },
    {
      id: 'evt-002',
      entries: [{ number: '169', name: 'Santiago CHAPARRO', points: 21 }],
    },
  ];

  const riders = [];
  for (const ev of events) {
    for (const entry of ev.entries) {
      const formattedNumber = `#${entry.number}`;
      const canonicalResolved = resolveKnownRiderCanonicalName(entry.name, formattedNumber);

      let matched = riders.find((r) =>
        areRidersSamePerson(
          { name: canonicalResolved, number: formattedNumber },
          { name: r.canonicalName, number: r.latestNumber, allNumbers: Array.from(r.allNumbers) }
        )
      );

      if (!matched) {
        matched = {
          canonicalName: canonicalResolved,
          latestNumber: formattedNumber,
          allNumbers: new Set([formattedNumber]),
          pointsByEvent: {},
        };
        riders.push(matched);
      }

      matched.pointsByEvent[ev.id] = entry.points;
      if (canonicalResolved.length > matched.canonicalName.length) {
        matched.canonicalName = canonicalResolved;
      }
    }
  }

  assert.strictEqual(riders.length, 1, 'Debe haber exactamente 1 piloto unificado para Chaparro en MX Novatos');
  const rider = riders[0];
  assert.strictEqual(rider.canonicalName, 'Iván Santiago Chaparro');
  const total = Object.values(rider.pointsByEvent).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 36, 'MX Novatos debe sumar 15 + 21 = 36 puntos');
}

simulateChaparroStandings();
console.log('✅ Prueba 8 superada: Sumatoria acumulada de Iván Santiago Chaparro unificada con éxito en 1 sola fila');
console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LAS EXCEPCIONES AISLADAS PASARON CON ÉXITO!');
