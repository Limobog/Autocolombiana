export interface ReglamentoTable {
  headers: string[];
  rows: string[][];
}

export interface ReglamentoSection {
  id: string;
  title: string;
  paragraphs?: string[];
  paragraphsAfter?: string[];
  bullets?: string[];
  table?: ReglamentoTable;
  subsections?: { title: string; bullets: string[] }[];
}

export const REGLAMENTO_SECTIONS: ReglamentoSection[] = [
  {
    id: 'generalidades',
    title: '1. Generalidades',
    paragraphs: [
      'La Copa MX Autocolombiana es un campeonato privado de motocross organizado por la Liga de Motociclismo de Bogotá, creado para fortalecer el motocross colombiano mediante competencias organizadas, seguras y transparentes.',
      'Este campeonato nace como la evolución del exitoso Campeonato Interligas, evento que durante su última edición reunió a pilotos de diferentes regiones del país y se consolidó como uno de los campeonatos privados con mayor participación a nivel nacional. Conserva el mismo equipo organizador, la misma experiencia y el compromiso de seguir ofreciendo eventos de alta calidad.',
      'La Copa MX Autocolombiana tiene como objetivo promover el desarrollo deportivo de pilotos de todas las edades y niveles de experiencia, brindando igualdad de oportunidades para competir y sumar puntos durante toda la temporada, sin importar la ciudad, el club o la liga a la que pertenezcan.',
      'El campeonato contará con reglamentación propia y será administrado exclusivamente por la organización del evento. En los aspectos no contemplados en este reglamento, se aplicarán las disposiciones del Reglamento Nacional de Motocross de FEDEMOTO.',
      'Todos los pilotos, equipos, mecánicos, acompañantes y demás participantes aceptan el presente reglamento desde el momento en que realizan su inscripción.',
      'La organización podrá realizar modificaciones técnicas, deportivas o logísticas cuando sean necesarias para garantizar la seguridad de los participantes, el correcto desarrollo de cada válida y la transparencia del campeonato.',
    ],
  },
  {
    id: 'categorias',
    title: '2. Categorías oficiales',
    paragraphs: [
      'Las categorías estarán determinadas por edad y cilindrada de la motocicleta.',
    ],
    table: {
      headers: ['Categoría', 'Edad', 'Fondo y número'],
      rows: [
        ['50cc — motos originales de fábrica, rin 10', '4 a 6 años', 'Fondo blanco — números negros'],
        ['50cc', '6 a 8 años', 'Fondo blanco — números negros'],
        ['65cc Novatos', '7 a 10 años', 'Fondo blanco — números negros'],
        ['65cc A', '—', 'Fondo blanco — números negros'],
        ['85cc Novatos', '10 a 15 años', 'Fondo blanco — números negros'],
        ['85cc A', '—', 'Fondo blanco — números negros'],
        ['125cc — hasta 125cc (2T) / 150–250cc (4T)', '12 a 17 años', 'Fondo blanco — números negros'],
        ['MX Novatos — 125–250cc (2T) / 250–450cc (4T)', 'Desde 15 años', 'Fondo blanco — números negros'],
        ['MX B — 125–250cc (2T) / 250–250cc (4T)', 'Desde 15 años', 'Fondo blanco — números negros'],
        ['MX A — 125–250cc (2T) / 250–450cc (4T)', 'Desde 15 años', 'Fondo blanco — números negros'],
        ['MX Master — cilindraje libre', 'Mayores a 35 años', 'Fondo blanco — números negros'],
        ['Femenino — cilindraje libre desde 85cc', 'Desde 12 años', 'Fondo rosado — números blancos'],
        ['Enduro A — cilindraje libre, moto enduro', 'Desde 14 años', 'Fondo rojo — número negro'],
        ['Enduro B — cilindraje libre, moto enduro', 'Desde 14 años', 'Fondo rojo — número blanco'],
      ],
    },
    bullets: [
      'Se considera edad mínima a la primera fecha de la válida y edad máxima al 1 de enero del año correspondiente.',
      'Las categorías «Novatos» están diseñadas para pilotos que nunca han participado en una competencia oficial, ya sea de carácter departamental o nacional. Si un piloto se inscribe en novatos sin serlo, será descalificado y no habrá devolución del dinero de la inscripción.',
      'La categoría 50cc (4 a 6 años) exige motos originales sin modificación: deben ser originales de fábrica con rin 10.',
      'Las únicas categorías que pueden recibir asistencia en pista son 50cc (4 a 6 años) y 50cc (6 a 8 años). La persona que asista debe contar con chaleco reflectivo.',
      'Las categorías 65cc Novatos y 85cc Novatos: dependiendo de los pilotos inscritos, el director de carrera puede autorizar asistencia en pista.',
      'Todas las categorías A son para pilotos expertos; los pilotos que se inscriban en categoría B deben ser novatos.',
    ],
    subsections: [
      {
        title: 'Enduro A — criterios de elegibilidad',
        bullets: [
          'Haber participado en el Campeonato Nacional y/o Regional de Motocross en Cundinamarca, Antioquia o Bogotá en los últimos 5 años, en cualquier categoría.',
          'Estar clasificado dentro del top 10 del scratch en cualquier válida o campeonato de enduro a nivel nacional o departamental en los últimos 5 años.',
          'Pilotos de categorías juveniles (desde 15 años) que hayan finalizado dentro de los 5 primeros lugares en el Campeonato Nacional o Regional de Enduro a nivel nacional.',
        ],
      },
      {
        title: 'Enduro B — criterios de elegibilidad',
        bullets: [
          'Dirigida exclusivamente a pilotos novatos y aficionados que estén iniciando en la modalidad de enduro.',
          'Solo podrán competir pilotos que no hayan participado en ningún campeonato nacional ni departamental en los últimos 5 años.',
          'No podrán inscribirse pilotos con experiencia competitiva previa en motocross o enduro a nivel profesional o semiprofesional.',
        ],
      },
    ],
    paragraphsAfter: [
      'Todos los pilotos que compitan en las categorías Enduro A y Enduro B deberán utilizar exclusivamente motocicletas de enduro. No se permitirá la participación con motocicletas de motocross.',
    ],
  },
  {
    id: 'motocicletas',
    title: '3. Motocicletas permitidas',
    subsections: [
      {
        title: '50cc',
        bullets: [
          'Motocicletas automáticas de 2 tiempos hasta 50cc.',
          'Permitidas motocicletas eléctricas equivalentes autorizadas por la organización.',
          'Para la categoría 50cc (4–6 años), las motocicletas deberán conservar configuración original de fábrica, rin 10 delantero y trasero.',
          'Se prohíben modificaciones extremas de motor, chasis o suspensión.',
          'La organización podrá limitar motocicletas que considere excesivamente modificadas para la categoría infantil.',
        ],
      },
      {
        title: '65cc',
        bullets: ['Motocicletas 2 tiempos desde 55cc hasta 65cc.'],
      },
      {
        title: '85cc',
        bullets: [
          'Motocicletas 2 tiempos desde 75cc hasta 85cc.',
          'Rin delantero 17" o 19".',
          'Rin trasero 14" o 16".',
        ],
      },
      {
        title: '125cc',
        bullets: [
          'Motocicletas 2 tiempos hasta 125cc.',
          'Motocicletas 4 tiempos hasta 250cc.',
        ],
      },
      {
        title: 'Femenino',
        bullets: [
          'Motocicletas desde 75cc hasta 150cc (2T).',
          'Motocicletas desde 100cc hasta 250cc (4T).',
          'Motos eléctricas.',
        ],
      },
      {
        title: 'MX Novatos / MX B / MX A / MX Master',
        bullets: [
          'Motocicletas desde 125cc (2T) hasta 500cc (2T).',
          'Motocicletas desde 250cc (4T) hasta 450cc (4T).',
          'Motos eléctricas.',
        ],
      },
      {
        title: 'Enduro A y B',
        bullets: ['Motocicletas libres de cilindraje, moto de enduro.'],
      },
    ],
    paragraphsAfter: [
      'La organización y el director técnico podrán rechazar cualquier motocicleta que represente riesgo para el piloto o para los demás participantes.',
      'Toda motocicleta deberá encontrarse en condiciones óptimas de seguridad.',
    ],
  },
  {
    id: 'numeros',
    title: '4. Números',
    bullets: [
      'Todos los pilotos deberán portar número negro con fondo blanco visible en las tres placas reglamentarias de la motocicleta.',
      'El jersey o la pechera deberá estar marcado en la parte posterior con el número del piloto.',
      'La organización podrá asignar o reservar números oficiales.',
      'No se permitirán números repetidos dentro de la misma categoría.',
    ],
  },
  {
    id: 'competencia',
    title: '5. Sistema de competencia',
    bullets: [
      'El campeonato se desarrollará bajo formato acumulativo de dos (2) mangas por categoría.',
      'Cada manga otorgará puntos independientes y la sumatoria total determinará la clasificación general del evento.',
      'Todas las mangas tendrán igual valor en puntuación.',
      'El piloto ganador del evento será quien obtenga la mayor cantidad de puntos al finalizar las mangas.',
      'En caso de empate en puntos, se tomará como criterio de desempate el mejor resultado en la segunda manga.',
      'La organización podrá modificar el número de mangas por condiciones climáticas, seguridad o fuerza mayor.',
    ],
  },
  {
    id: 'puntuacion',
    title: '6. Sistema de puntuación',
    paragraphs: [
      'La puntuación oficial será la siguiente:',
      'Todo piloto que tome la salida oficial de una manga será considerado participante oficial de la misma.',
    ],
    table: {
      headers: ['Posición', 'Puntos'],
      rows: [
        ['1', '15'],
        ['2', '13'],
        ['3', '11'],
        ['4', '10'],
        ['5', '9'],
        ['6', '8'],
        ['7', '7'],
        ['8', '6'],
        ['9', '5'],
        ['10', '4'],
        ['11', '3'],
        ['12', '2'],
        ['13', '1'],
        ['14', '1'],
        ['15', '1'],
        ['16', '1'],
        ['17', '1'],
        ['18', '1'],
        ['19', '1'],
        ['20', '1'],
      ],
    },
  },
  {
    id: 'clasificacion',
    title: '7. Clasificación y orden de partida',
    bullets: [
      'El día sábado se realizarán prácticas libres oficiales para todas las categorías.',
      'El día domingo la clasificación será a 2 vueltas.',
      'El resultado de la clasificación define el orden del partidor.',
      'Dependiendo del número de pilotos inscritos, el director de carrera podrá dividir grupos cuando exista exceso de participantes.',
    ],
  },
  {
    id: 'salida',
    title: '8. Procedimiento de salida',
    bullets: [
      '15 minutos antes de la manga se abrirá zona de espera.',
      '5 minutos antes únicamente permanecerá un mecánico por piloto.',
      '2 minutos antes se autoriza encendido de motocicletas.',
      '15 segundos oficiales.',
      '5 segundos oficiales.',
      'Descenso de partidor.',
      'Una vez el piloto ingrese a la grilla no podrá cambiar de posición ni recibir asistencia.',
      'Toda salida falsa será señalizada con bandera roja.',
    ],
  },
  {
    id: 'duracion',
    title: '9. Duración de las mangas',
    table: {
      headers: ['Categoría', 'Duración'],
      rows: [
        ['50cc', '8 min + 2 vueltas'],
        ['65cc', '10 min + 2 vueltas'],
        ['85cc', '12 min + 2 vueltas'],
        ['125cc', '15 min + 2 vueltas'],
        ['Femenino', '12 min + 2 vueltas'],
        ['MX Novatos', '12 min + 2 vueltas'],
        ['MX B', '12 min + 2 vueltas'],
        ['MX A', '15 min + 2 vueltas'],
        ['MX Master', '12 min + 2 vueltas'],
        ['Enduro A y B', '12 min + 2 vueltas'],
      ],
    },
    paragraphs: [
      'La organización podrá modificar los tiempos de competencia por condiciones climáticas, seguridad o programación del evento.',
    ],
  },
  {
    id: 'asistencia',
    title: '10. Asistencia en pista',
    bullets: [
      'Las categorías 50cc podrán recibir asistencia externa únicamente en caso de caída o inmovilización de la motocicleta.',
      'La asistencia deberá realizarse exclusivamente por un adulto acreditado con chaleco oficial suministrado por la organización.',
      'Está prohibido empujar al piloto para generar ventaja deportiva.',
      'Para las categorías 65cc y superiores no estará permitida asistencia externa, salvo autorización expresa del director de carrera por razones de seguridad y/o climáticas.',
      'Para la categoría 65cc se permitirá un acompañante por razones climáticas.',
      'Toda conducta antideportiva relacionada con asistencia externa podrá generar sanción.',
    ],
  },
  {
    id: 'seguridad-equipo',
    title: '11. Equipo de seguridad obligatorio',
    paragraphs: ['Será obligatorio para todos los pilotos:'],
    bullets: [
      'Casco homologado para motocross.',
      'Gafas de protección.',
      'Pechera.',
      'Rodilleras.',
      'Botas de motocross.',
      'Guantes.',
      'Uniforme manga larga.',
      'Jersey marcado en la parte posterior.',
      'No se permitirá participación con equipamiento incompleto.',
      'La organización podrá impedir la participación de cualquier piloto cuyo equipamiento represente riesgo.',
    ],
  },
  {
    id: 'conducta',
    title: '12. Comportamiento de padres y acompañantes',
    paragraphs: [
      'El campeonato busca promover un ambiente deportivo sano, formativo y respetuoso.',
      'Todo padre de familia, acompañante, mecánico o integrante de equipo deberá mantener conducta respetuosa hacia pilotos, organizadores, oficiales, jueces, personal médico y otros equipos participantes.',
      'No se permitirán: agresiones verbales, amenazas, conductas antideportivas, invasión de pista ni discusiones con oficiales durante las competencias.',
      'El piloto será responsable por el comportamiento de sus acompañantes.',
      'La organización podrá expulsar personas o descalificar pilotos cuando considere que una conducta afecta el desarrollo del evento.',
    ],
  },
  {
    id: 'seguridad-pista',
    title: '13. Seguridad en pista',
    paragraphs: ['La organización contará con:'],
    bullets: [
      'Oficiales de pista (jueces, director, subdirector, jefe de cronometraje, jefe de revisión técnica).',
      'Personal médico.',
      'Ambulancia.',
      'Sistema oficial de banderas.',
      'Zona de mecánicos.',
      'Zona de espera.',
      'Todos los pilotos deberán respetar las señales oficiales.',
    ],
    subsections: [
      {
        title: 'Significado de las banderas',
        bullets: [
          'Bandera verde: pista libre y competencia en condiciones normales.',
          'Bandera amarilla: peligro en pista. Está prohibido adelantar y saltar en la zona señalizada.',
          'Bandera roja: suspensión inmediata de la manga o práctica. Todos los pilotos deberán disminuir velocidad y dirigirse de forma segura a la zona indicada por los oficiales.',
          'Bandera azul: un piloto más rápido intentará adelantar. El piloto alcanzado será al que se le muestre la bandera.',
          'Bandera negra: descalificación o sanción directa al piloto señalado. El piloto deberá abandonar la pista y dirigirse inmediatamente a pits.',
          'Bandera a cuadros: finalización oficial de la manga o práctica.',
          'El director de carrera podrá detener una manga por razones de seguridad.',
          'Si una manga es detenida antes de completarse el 50% del tiempo programado, podrá reiniciarse.',
          'Si la manga supera el 50% del tiempo oficial, podrá considerarse válida.',
        ],
      },
    ],
  },
  {
    id: 'ambiental',
    title: '14. Reglas ambientales',
    bullets: [
      'Todos los equipos deberán mantener limpia su zona de pits.',
      'Cada piloto deberá utilizar alfombra ambiental en la zona de mecánica.',
      'Cada equipo deberá contar con extintor visible.',
      'Está prohibido: botar aceite o gasolina al suelo, dejar residuos en pits o lavar motocicletas fuera de las zonas autorizadas.',
    ],
  },
  {
    id: 'premiacion',
    title: '15. Premiación',
    bullets: [
      'Todas las categorías tendrán premiación oficial.',
      'Todos los deportistas inscritos recibirán medalla de participación oficial del evento.',
      'La premiación final del campeonato será para los 3 primeros lugares de la tabla general.',
      'La organización podrá otorgar premios especiales como Holeshot.',
    ],
    subsections: [
      {
        title: '15.1 Premiación final del campeonato',
        bullets: [
          'Requisito de participación: haber competido en al menos 4 de las 5 válidas del campeonato.',
          'Los ganadores serán elegidos aleatoriamente entre todos los participantes que cumplan con los requisitos.',
          'El anuncio se realizará durante la premiación de la última válida.',
          'Bolsa de premios de $20.000.000 COP, dividida en 5 tarjetas de regalo de $4.000.000 COP cada una.',
          'Las tarjetas podrán usarse exclusivamente en Autocolombiana, en la compra de motos, accesorios, repuestos y merchán de las tres marcas (GASGAS, KTM, Husqvarna).',
          'No es transferible ni canjeable por dinero en efectivo.',
          'La entrega se realizará durante la última válida del campeonato.',
          'El ganador debe estar presente para reclamar su premio; de lo contrario, perderá el derecho al mismo.',
        ],
      },
    ],
  },
  {
    id: 'protestas',
    title: '16. Protestas',
    bullets: [
      'Toda protesta deberá realizarse de manera respetuosa y por escrito.',
      'La organización será la encargada de analizar y resolver cualquier situación deportiva o técnica.',
      'No se aceptarán protestas ofensivas o irrespetuosas.',
      'Toda protesta deberá realizarse en un tiempo no mayor a 30 minutos finalizada la manga.',
    ],
  },
  {
    id: 'responsabilidad',
    title: '17. Responsabilidad',
    bullets: [
      'Todo piloto participa bajo su propia responsabilidad.',
      'Los padres de familia o acudientes autorizan expresamente la participación del menor en el evento.',
      'La práctica del motocross es considerada una disciplina de alto riesgo.',
      'La organización no será responsable por accidentes, lesiones, daños materiales o pérdidas ocurridas durante el desarrollo del campeonato.',
    ],
  },
  {
    id: 'interpretacion',
    title: '18. Interpretación del reglamento',
    bullets: [
      'La interpretación del presente reglamento será responsabilidad exclusiva del Jurado y Director de Carrera.',
      'Toda situación no contemplada será resuelta conforme al criterio técnico y deportivo de la organización.',
      'El presente reglamento podrá ser actualizado o modificado por la organización cuando sea necesario para mejorar el desarrollo deportivo y la seguridad del campeonato.',
    ],
  },
  {
    id: 'regulacion-general',
    title: '19. Regulación general',
    bullets: [
      'Cualquier infracción de los miembros de equipos hará al piloto el único responsable solidario y directo por todas las acciones de sus acompañantes, mecánicos o auxiliares, asumiendo las sanciones o amonestaciones según el código deportivo FEDEMOTO, lo que podrá generar multa, suspensión del evento y costos de reparación a otros pilotos o la organización.',
      'Los clubes, pilotos y acompañantes están obligados a cumplir el Código Deportivo y Reglamento Nacional de Motocross en todas sus disposiciones, sin derecho a discutir el desconocimiento del mismo.',
      'El evento Copa MX Autocolombiana es propiedad exclusiva de Autocolombiana y ninguna persona natural y/o jurídica podrá beneficiarse de ella sin pleno conocimiento de Autocolombiana.',
      'Todos los pilotos, acompañantes y asistentes deberán cumplir estrictamente con los horarios establecidos por la organización. El incumplimiento no garantiza el ingreso al escenario ni la participación del piloto.',
      'Todo deportista, directivo y acompañante irá por cuenta y riesgo propio, quedando exonerados de toda responsabilidad Cogua Moto Park SAS, Autocolombiana, participantes, patrocinadores, organización y demás entes naturales y jurídicos.',
      'La práctica del motociclismo en cualquiera de sus modalidades la realiza el piloto, directivo, mecánico o colaborador por su cuenta y riesgo, de tal manera que Cogua Moto Park SAS, los clubes, personas jurídicas y naturales quedan exoneradas de toda responsabilidad por todo concepto.',
    ],
  },
  {
    id: 'organizador',
    title: '20. Organizador y propietario del evento',
    paragraphs: [
      'Organizador: Cogua Moto Park.',
      'Contacto: 314 610 5217.',
    ],
  },
];
