import type { ReglamentoSection } from './reglamento-sections';

/**
 * Reglamento provisional de la Copa Autocolombiana de Enduro (1.ª Edición).
 * El documento oficial completo se publicará cuando la organización lo entregue.
 */
export const REGLAMENTO_ENDURO_SECTIONS: ReglamentoSection[] = [
  {
    id: 'generalidades',
    title: '1. Generalidades',
    paragraphs: [
      'La Copa Autocolombiana de Enduro — 1.ª Edición es un campeonato privado de enduro organizado por el mismo equipo de la Copa Autocolombiana de Clubes MX, con la misma experiencia y compromiso de ofrecer eventos organizados, seguros y transparentes.',
      'El campeonato se disputa contra el cronómetro: la clasificación de cada válida se define por los tiempos registrados en las pruebas especiales.',
      'Todos los pilotos, equipos, mecánicos, acompañantes y demás participantes aceptan el presente reglamento desde el momento en que realizan su inscripción.',
      'Este es un resumen provisional. El reglamento oficial completo será publicado próximamente en esta misma página.',
    ],
  },
  {
    id: 'categorias',
    title: '2. Categorías oficiales',
    paragraphs: [
      'Las categorías estarán determinadas por edad, cilindrada de la motocicleta y nivel de experiencia del piloto.',
    ],
    table: {
      headers: ['Categoría', 'Edad', 'Cilindrada'],
      rows: [
        ['Enduro 1 — Infantiles', '4 a 8 años', '50cc 4T'],
        ['Enduro 1 — Infantiles', '4 a 8 años', '50cc 2T'],
        ['Enduro 2 — Infantiles', '7 a 12 años', '65cc 2T / 110cc 4T / 125cc 4T'],
        ['Enduro 3', '10 a 15 años', '85cc / 150cc 4T'],
        ['Juvenil', '14 a 16 años', 'Cualquier cilindrada'],
        ['Bronce', 'Desde 15 años', 'Libre'],
        ['Plata', 'Desde 15 años', 'Libre'],
        ['Oro', 'Desde 15 años', 'Libre'],
      ],
    },
    bullets: [
      'Bronce: categoría para pilotos novatos.',
      'Plata: categoría para pilotos de nivel intermedio.',
      'Oro: categoría abierta para pilotos expertos. Incluye pilotos con títulos, podios o amplia experiencia en competencia.',
      'Se considera edad mínima a la primera fecha de la válida y edad máxima al 1 de enero del año correspondiente.',
    ],
  },
  {
    id: 'formato',
    title: '3. Formato del campeonato',
    paragraphs: [
      'El campeonato consta de dos válidas con formatos diferentes, ambas contra el cronómetro y con clasificación por tiempos.',
    ],
    subsections: [
      {
        title: '1.ª Válida — Sprint Enduro · 30 de agosto · Cogua Motopark',
        bullets: [
          'Competencia contra el cronómetro.',
          'Clasificación por tiempos.',
          '2 pruebas especiales.',
        ],
      },
      {
        title: '2.ª Válida — Hard Scrambler · 11 de octubre · La Pista Off Road',
        bullets: [
          'Competencia contra el cronómetro.',
          'Clasificación por tiempos.',
          '1 prueba especial.',
        ],
      },
    ],
  },
  {
    id: 'reglamento-oficial',
    title: '4. Reglamento oficial',
    paragraphs: [
      'El reglamento oficial completo de la Copa Autocolombiana de Enduro (equipamiento, seguridad, puntuación, premiación y protestas) será publicado próximamente.',
      'Mientras tanto, aplican los criterios generales de seguridad y comportamiento deportivo de la organización. En los aspectos no contemplados se aplicarán las disposiciones del Reglamento Nacional de FEDEMOTO.',
    ],
  },
];
