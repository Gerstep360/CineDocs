/**
 * Gerstep Script Studio - Multi-Structure Screenplay, Hybrid & Narrative Engine
 */
import {
  BlockType,
  ScriptBlock,
  ScriptStructureType,
  NarrativeMethodologyId,
} from '../types/script';

export interface PageSection {
  pageNumber: number;
  blocks: ScriptBlock[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  shortLabel: string;
  hint: string;
  placeholder: string;
  isUppercase?: boolean;
  isCentered?: boolean;
  isRightAligned?: boolean;
  isIndentedDialogue?: boolean;
  isParenthetical?: boolean;
  isTwoColumn?: boolean;
  badgeColor?: string;
}

export interface StructureDefinition {
  id: ScriptStructureType;
  code: string;
  name: string;
  shortName: string;
  description: string;
  idealFor: string;
  allowedBlocks: BlockType[];
  defaultFirstBlock: BlockType;
  usesTwoColumns?: boolean;
  isHybrid?: boolean;
}

export interface NarrativeMethodology {
  id: NarrativeMethodologyId;
  categoryLabel: string;
  name: string;
  description: string;
  stages: {
    title: string;
    guidance: string;
    suggestedPrompt: string;
  }[];
}

export function normalizeStructureType(
  type?: ScriptStructureType | string
): ScriptStructureType {
  if (!type || type === 'screenplay') return 'cinematografica';
  if (type === 'two_column') return 'audiovisual_tecnico';
  if (type === 'youtube') return 'hibrida';
  if (type === 'short') return 'sketch_comedia';
  return type as ScriptStructureType;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  // A. Cinematográfica
  scene_heading: {
    type: 'scene_heading',
    label: 'Encabezado de escena (INT./EXT.)',
    shortLabel: 'Escena',
    hint: 'Lugar y momento del día (Ej: INT. CASA - NOCHE)',
    placeholder: 'INT. LUGAR - DÍA',
    isUppercase: true,
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
  },
  action: {
    type: 'action',
    label: 'Acción',
    shortLabel: 'Acción',
    hint: 'Descripción visual de lo que ocurre en la escena',
    placeholder: 'Describe la acción y lo que vemos...',
  },
  character: {
    type: 'character',
    label: 'Personaje',
    shortLabel: 'Personaje',
    hint: 'Nombre de quien habla (centrado en mayúsculas)',
    placeholder: 'NOMBRE DEL PERSONAJE',
    isUppercase: true,
    isCentered: true,
  },
  dialogue: {
    type: 'dialogue',
    label: 'Diálogo',
    shortLabel: 'Diálogo',
    hint: 'Palabras pronunciadas por el personaje',
    placeholder: 'Escribe lo que dice el personaje...',
    isIndentedDialogue: true,
  },
  parenthetical: {
    type: 'parenthetical',
    label: 'Acotación (entre paréntesis)',
    shortLabel: 'Acotación',
    hint: 'Tono, emoción o gesto breve al hablar',
    placeholder: '(con tono pausado)',
    isParenthetical: true,
    isCentered: true,
  },
  transition: {
    type: 'transition',
    label: 'Transición',
    shortLabel: 'Transición',
    hint: 'Corte o paso a otra escena (Ej: CORTE A:)',
    placeholder: 'CORTE A:',
    isUppercase: true,
    isRightAligned: true,
  },
  voice_over: {
    type: 'voice_over',
    label: 'Voz en off (V.O.)',
    shortLabel: 'Voz en Off',
    hint: 'Voz narrada sobre la imagen sin estar presente en escena',
    placeholder: 'NARRADOR (V.O.): Escribe la línea en voz en off...',
    isIndentedDialogue: true,
  },
  off_screen: {
    type: 'off_screen',
    label: 'Fuera de campo (O.S. / F.C.)',
    shortLabel: 'Fuera Campo',
    hint: 'Personaje que habla desde el lugar pero fuera de cámara',
    placeholder: 'PERSONAJE (F.C.): Línea desde fuera de cuadro...',
    isIndentedDialogue: true,
  },
  shot: {
    type: 'shot',
    label: 'Plano o indicación de cámara',
    shortLabel: 'Plano',
    hint: 'Primer plano, plano detalle, travelling, etc.',
    placeholder: 'PRIMER PLANO DE...',
    isUppercase: true,
  },
  general: {
    type: 'general',
    label: 'Texto general',
    shortLabel: 'General',
    hint: 'Texto libre sin formato restrictivo',
    placeholder: 'Escribe libremente...',
  },

  // B. Estándar flexible
  heading_1: {
    type: 'heading_1',
    label: 'Título de sección',
    shortLabel: 'Título',
    hint: 'Encabezado principal del documento',
    placeholder: 'Escribe un título principal...',
  },
  heading_2: {
    type: 'heading_2',
    label: 'Subtítulo',
    shortLabel: 'Subtítulo',
    hint: 'Subtítulo o apartado temático',
    placeholder: 'Escribe un subtítulo...',
  },
  paragraph: {
    type: 'paragraph',
    label: 'Párrafo normal',
    shortLabel: 'Párrafo',
    hint: 'Escritura fluida como en un documento convencional',
    placeholder: 'Escribe tu párrafo aquí...',
  },
  narration: {
    type: 'narration',
    label: 'Narración',
    shortLabel: 'Narración',
    hint: 'Texto continuo leído por el narrador o locutor',
    placeholder: 'Escribe el texto de la narración...',
  },
  description: {
    type: 'description',
    label: 'Descripción',
    shortLabel: 'Descripción',
    hint: 'Descripción de contexto, idea o escena libre',
    placeholder: 'Describe el contexto o situación...',
  },
  list_item: {
    type: 'list_item',
    label: 'Elemento de lista',
    shortLabel: 'Lista',
    hint: 'Punto clave o viñeta enumerada',
    placeholder: '• Punto o idea de la lista...',
  },
  note_block: {
    type: 'note_block',
    label: 'Nota de autor / producción',
    shortLabel: 'Nota',
    hint: 'Apunte interno o recordatorio visualmente diferenciado',
    placeholder: '[Nota: recordatorio o apunte sobre esta parte...]',
  },

  // C. Híbrida
  section_divider: {
    type: 'section_divider',
    label: 'Nueva Sección con Estructura Propia',
    shortLabel: 'Sección Híbrida',
    hint: 'Cambia de estructura (ej. de Voz en off a Sketch o 2 Columnas) desde este punto',
    placeholder: 'Nombre de la sección (ej: Introducción, Sketch 1, Entrevista)...',
  },

  // D. Voz en off
  pause_mark: {
    type: 'pause_mark',
    label: 'Pausa / Respiración',
    shortLabel: 'Pausa',
    hint: 'Marca una pausa dramática o silencio breve en la locución',
    placeholder: '[PAUSA DE 2 SEGUNDOS]',
    isCentered: true,
  },
  emphasis: {
    type: 'emphasis',
    label: 'Énfasis de locución',
    shortLabel: 'Énfasis',
    hint: 'Frase destacada con mayor fuerza o cambio de ritmo vocal',
    placeholder: 'Frase enfatizada en la narración...',
  },
  visual_desc: {
    type: 'visual_desc',
    label: 'Descripción visual / B-Roll',
    shortLabel: 'Imagen / B-Roll',
    hint: 'Lo que se muestra en pantalla mientras suena la voz',
    placeholder: '[EN PANTALLA: imágenes de apoyo o acción visual...]',
  },
  music_cue: {
    type: 'music_cue',
    label: 'Música',
    shortLabel: 'Música',
    hint: 'Entrada, cambio o corte de pista musical',
    placeholder: '♪ MÚSICA: Entra tema instrumental suave...',
  },
  sfx_cue: {
    type: 'sfx_cue',
    label: 'Efecto de sonido (SFX)',
    shortLabel: 'Efecto SFX',
    hint: 'Efecto sonoro puntual o diseño acústico',
    placeholder: '🔊 SFX: Sonido de proyector antiguo...',
  },

  // E. Audiovisual técnico (Dos Columnas VIDEO / AUDIO)
  av_row: {
    type: 'av_row',
    label: 'Bloque Dos Columnas (VIDEO / AUDIO)',
    shortLabel: 'Video / Audio',
    hint: 'Columna izquierda para imagen y derecha para voz/sonido',
    placeholder: 'Acción visual y audio sincronizado...',
    isTwoColumn: true,
  },

  // F. Sketch y comedia
  situation: {
    type: 'situation',
    label: 'Situación / Premisa del Sketch',
    shortLabel: 'Situación',
    hint: 'Planteamiento cómico inicial y contexto de los personajes',
    placeholder: 'SITUACIÓN: Dos desconocidos quedan atrapados en un ascensor...',
  },
  twist: {
    type: 'twist',
    label: 'Giro cómico (Escalation / Twist)',
    shortLabel: 'Giro',
    hint: 'Cambio inesperado que eleva el absurdo o la tensión del sketch',
    placeholder: 'GIRO: Se revela que el ascensor nunca estuvo cerrado...',
  },
  punchline: {
    type: 'punchline',
    label: 'Remate (Punchline)',
    shortLabel: 'Remate',
    hint: 'Chiste final o cierre contundente del sketch',
    placeholder: 'REMATE FINAL: Línea o acción que cierra el sketch...',
  },

  // G. Documental y entrevista
  interview_question: {
    type: 'interview_question',
    label: 'Pregunta de entrevista',
    shortLabel: 'Pregunta',
    hint: 'Pregunta formulada al entrevistado',
    placeholder: 'PREGUNTA: ¿Qué ocurrió realmente aquella mañana?',
  },
  interview_subject: {
    type: 'interview_subject',
    label: 'Entrevistado / Sujeto (Lower Third)',
    shortLabel: 'Entrevistado',
    hint: 'Nombre y cargo del entrevistado en cámara',
    placeholder: 'DRA. ELENA VARGAS (Historiadora):',
    isUppercase: true,
  },
  testimony: {
    type: 'testimony',
    label: 'Testimonio / Respuesta',
    shortLabel: 'Testimonio',
    hint: 'Declaración real o planeada del entrevistado',
    placeholder: 'Transcripción o puntos clave del testimonio...',
    isIndentedDialogue: true,
  },
  archive_footage: {
    type: 'archive_footage',
    label: 'Imágenes de archivo',
    shortLabel: 'Archivo',
    hint: 'Material histórico, fotografías, recortes de prensa o video de archivo',
    placeholder: '[ARCHIVO: Fotografías de 1994 sobre el suceso...]',
  },
  source_ref: {
    type: 'source_ref',
    label: 'Fuente documental / Cita',
    shortLabel: 'Fuente',
    hint: 'Referencia bibliográfica, expediente o dato verificado',
    placeholder: 'FUENTE: Informe oficial / Hemeroteca Nacional...',
  },
  reenactment: {
    type: 'reenactment',
    label: 'Recreación dramatizada',
    shortLabel: 'Recreación',
    hint: 'Escena reconstruida visualmente para ilustrar los hechos',
    placeholder: 'RECREACIÓN: Reconstrucción visual del acontecimiento...',
  },
  research_note: {
    type: 'research_note',
    label: 'Nota de investigación',
    shortLabel: 'Investigación',
    hint: 'Dato de contexto o verificación pendiente para el documental',
    placeholder: 'INVESTIGACIÓN: Confirmar fechas y permisos de archivo...',
  },

  // H. Tutorial y educativo
  explanation: {
    type: 'explanation',
    label: 'Explicación conceptual',
    shortLabel: 'Explicación',
    hint: 'Exposición clara del concepto o paso para el estudiante',
    placeholder: 'Explica el concepto de forma clara y directa...',
  },
  demonstration: {
    type: 'demonstration',
    label: 'Demostración práctica',
    shortLabel: 'Demostración',
    hint: 'Muestra paso a paso cómo se realiza el procedimiento',
    placeholder: 'DEMOSTRACIÓN: Paso a paso en vivo...',
  },
  screen_action: {
    type: 'screen_action',
    label: 'Acción en pantalla (Screencast / UI)',
    shortLabel: 'En Pantalla',
    hint: 'Captura de pantalla, clic, código o movimiento del cursor',
    placeholder: '[PANTALLA: Mostrar menú Archivo > Guardar y resaltar botón...]',
  },
  example_block: {
    type: 'example_block',
    label: 'Ejemplo práctico',
    shortLabel: 'Ejemplo',
    hint: 'Caso real o analogía para reforzar el aprendizaje',
    placeholder: 'EJEMPLO: Imagina que tenemos el siguiente caso...',
  },
  visual_resource: {
    type: 'visual_resource',
    label: 'Recurso visual / Gráfica / Pizarra',
    shortLabel: 'Gráfica',
    hint: 'Infografía, esquema, diapositiva o texto sobreimpreso',
    placeholder: '[GRÁFICA: Diagrama comparativo con 3 puntos clave]',
  },

  // I. Programa y escaleta
  segment_header: {
    type: 'segment_header',
    label: 'Segmento / Bloque del Programa',
    shortLabel: 'Segmento',
    hint: 'Nombre de la sección o bloque en la escaleta',
    placeholder: 'BLOQUE 1: BIENVENIDA Y TITULARES DEL DÍA',
    isUppercase: true,
  },
  duration_mark: {
    type: 'duration_mark',
    label: 'Duración estimada / Tiempo',
    shortLabel: 'Duración',
    hint: 'Tiempo asignado al segmento o cronómetro acumulado',
    placeholder: '⏱ DURACIÓN: 04:30 min (Acumulado: 00:00 - 04:30)',
  },
  host_cue: {
    type: 'host_cue',
    label: 'Presentador / Conductor',
    shortLabel: 'Presentador',
    hint: 'Intervención o pauta para quien conduce el programa',
    placeholder: 'PRESENTADOR: Da paso a la mesa de debate...',
  },
  guest_cue: {
    type: 'guest_cue',
    label: 'Participante / Invitado',
    shortLabel: 'Invitado',
    hint: 'Intervención prevista o tema a tratar con el invitado',
    placeholder: 'INVITADO: Comenta su experiencia sobre...',
  },
  intro_cue: {
    type: 'intro_cue',
    label: 'Entrada / Cortinilla inicial',
    shortLabel: 'Entrada',
    hint: 'Ráfaga de apertura, bienvenida o gancho del bloque',
    placeholder: '▶ ENTRADA: Cortinilla animada y saludo inicial...',
  },
  outro_cue: {
    type: 'outro_cue',
    label: 'Salida / Despedida de bloque',
    shortLabel: 'Salida',
    hint: 'Cierre del segmento, paso a corte o despedida',
    placeholder: '⏹ SALIDA: Cierre del bloque y anuncio del próximo tema...',
  },
  production_note: {
    type: 'production_note',
    label: 'Indicación de producción / Realización',
    shortLabel: 'Producción',
    hint: 'Instrucción técnica para cámaras, sonido, luces o teleprompter',
    placeholder: '[PRODUCCIÓN: Pasar a Cámara 2 y lanzar pleca en pantalla]',
  },

  // J. Audio y podcast
  narrator_cue: {
    type: 'narrator_cue',
    label: 'Narrador / Host del Podcast',
    shortLabel: 'Narrador',
    hint: 'Intervención de la voz conductora principal',
    placeholder: 'NARRADOR: Bienvenidos a un nuevo episodio...',
  },
  voice_cue: {
    type: 'voice_cue',
    label: 'Voz / Interlocutor',
    shortLabel: 'Voz',
    hint: 'Identificador del locutor, actor de voz o co-host',
    placeholder: 'VOZ 1 (tono íntimo):',
    isUppercase: true,
  },
  ambience_cue: {
    type: 'ambience_cue',
    label: 'Ambiente sonoro (Foley / Fondo)',
    shortLabel: 'Ambiente',
    hint: 'Colchón sonoro continuo (lluvia, cafetería, bosque)',
    placeholder: '🌧 AMBIENTE: Lluvia suave sobre cristal de fondo...',
  },
  silence_mark: {
    type: 'silence_mark',
    label: 'Silencio dramático',
    shortLabel: 'Silencio',
    hint: 'Corte total de música y voz para generar impacto auditivo',
    placeholder: '[SILENCIO ABSOLUTO - 3 SEGUNDOS]',
    isCentered: true,
  },

  // K. Videoclip
  music_section: {
    type: 'music_section',
    label: 'Sección musical (Intro, Verso, Estribillo, Puente)',
    shortLabel: 'Sección Musical',
    hint: 'Parte de la canción y letra de referencia',
    placeholder: '♫ ESTRIBILLO 1 — "Letra de la canción..."',
    isUppercase: true,
  },
  timecode_mark: {
    type: 'timecode_mark',
    label: 'Marca de tiempo (Timecode)',
    shortLabel: 'Tiempo',
    hint: 'Minuto y segundo exacto de la pista musical',
    placeholder: '⏱ [01:14 - 01:32]',
  },
  choreography: {
    type: 'choreography',
    label: 'Coreografía / Performance',
    shortLabel: 'Coreografía',
    hint: 'Movimiento de artistas, bailarines o banda en escena',
    placeholder: 'COREOGRAFÍA: El grupo avanza en sincronía con el beat...',
  },
};

export const STRUCTURES_CATALOG: StructureDefinition[] = [
  {
    id: 'cinematografica',
    code: 'A',
    name: 'A. Cinematográfica',
    shortName: 'Cinematográfica',
    description:
      'Convenciones profesionales de cine y ficción televisiva con sangrías y paginación estándar.',
    idealFor: 'Películas, cortometrajes, series de ficción y escenas dramáticas',
    allowedBlocks: [
      'scene_heading',
      'action',
      'character',
      'dialogue',
      'parenthetical',
      'voice_over',
      'off_screen',
      'transition',
      'shot',
    ],
    defaultFirstBlock: 'scene_heading',
  },
  {
    id: 'estandar_flexible',
    code: 'B',
    name: 'B. Estándar flexible',
    shortName: 'Estándar flexible',
    description:
      'Documento limpio y libre sin exigir encabezados INT./EXT. ni personajes.',
    idealFor: 'Videos independientes, ensayos, blogs en video y escritura general',
    allowedBlocks: [
      'heading_1',
      'heading_2',
      'paragraph',
      'narration',
      'description',
      'list_item',
      'note_block',
    ],
    defaultFirstBlock: 'heading_1',
  },
  {
    id: 'hibrida',
    code: 'C',
    name: 'C. Híbrida (Multiformato por secciones)',
    shortName: 'Híbrida',
    description:
      'Combina múltiples estructuras dentro del mismo guion (ej. introducción en Voz en off + sketch cinematográfico + cierre en 2 columnas).',
    idealFor: 'Videos de YouTube dinámicos, documentales modernos, programas mixtos y cine experimental',
    allowedBlocks: [
      'section_divider',
      'narration',
      'visual_desc',
      'scene_heading',
      'action',
      'character',
      'dialogue',
      'parenthetical',
      'av_row',
      'interview_question',
      'testimony',
      'heading_1',
      'paragraph',
      'note_block',
    ],
    defaultFirstBlock: 'section_divider',
    isHybrid: true,
  },
  {
    id: 'voz_en_off',
    code: 'D',
    name: 'D. Voz en off y Narración',
    shortName: 'Voz en off',
    description:
      'Enfocado en locución continua con marcas de pausa, énfasis, descripción de imágenes y música.',
    idealFor: 'Videos narrados, videoensayos, resúmenes e historias locutadas',
    allowedBlocks: [
      'narration',
      'pause_mark',
      'emphasis',
      'visual_desc',
      'music_cue',
      'sfx_cue',
      'note_block',
    ],
    defaultFirstBlock: 'narration',
  },
  {
    id: 'audiovisual_tecnico',
    code: 'E',
    name: 'E. Audiovisual técnico (2 Columnas)',
    shortName: '2 Columnas (Video/Audio)',
    description:
      'Formato clásico de dos columnas paralelas para sincronizar qué se ve (VIDEO) con qué se escucha (AUDIO).',
    idealFor: 'Publicidad, videos corporativos, producciones técnicas y spots',
    allowedBlocks: ['av_row'],
    defaultFirstBlock: 'av_row',
    usesTwoColumns: true,
  },
  {
    id: 'sketch_comedia',
    code: 'F',
    name: 'F. Sketch y Comedia',
    shortName: 'Sketch y Comedia',
    description:
      'Ágil para comedia de situaciones con planteamiento, diálogos rápidos, pausas, giros y remate.',
    idealFor: 'Sketches, Reels, TikToks de comedia, stand-up escénico y cápsulas de humor',
    allowedBlocks: [
      'situation',
      'action',
      'character',
      'dialogue',
      'parenthetical',
      'pause_mark',
      'twist',
      'punchline',
    ],
    defaultFirstBlock: 'situation',
  },
  {
    id: 'documental_entrevista',
    code: 'G',
    name: 'G. Documental y Entrevista',
    shortLabel: 'Documental',
    shortName: 'Documental y Entrevista',
    description:
      'Articula preguntas, testimonios reales, voz documental, material de archivo, recreaciones y fuentes.',
    idealFor: 'Documentales cinematográficos, reportajes periodísticos y entrevistas',
    allowedBlocks: [
      'narration',
      'interview_subject',
      'interview_question',
      'testimony',
      'archive_footage',
      'reenactment',
      'source_ref',
      'research_note',
    ],
    defaultFirstBlock: 'narration',
  } as StructureDefinition,
  {
    id: 'tutorial_educativo',
    code: 'H',
    name: 'H. Tutorial y Educativo',
    shortName: 'Tutorial y Educativo',
    description:
      'Diseñado para enseñar paso a paso mediante explicaciones, demostraciones, acciones en pantalla y ejemplos.',
    idealFor: 'Cursos online, tutoriales de software, clases grabadas y videos didácticos',
    allowedBlocks: [
      'heading_1',
      'explanation',
      'demonstration',
      'screen_action',
      'example_block',
      'visual_resource',
      'note_block',
    ],
    defaultFirstBlock: 'explanation',
  },
  {
    id: 'programa_escaleta',
    code: 'I',
    name: 'I. Programa y Escaleta',
    shortName: 'Programa y Escaleta',
    description:
      'Organiza bloques de emisión, tiempos estimados, entradas/salidas, intervenciones de presentadores e indicaciones técnicas.',
    idealFor: 'Programas de TV, transmisiones en vivo, shows de internet y eventos',
    allowedBlocks: [
      'segment_header',
      'duration_mark',
      'intro_cue',
      'host_cue',
      'guest_cue',
      'outro_cue',
      'production_note',
    ],
    defaultFirstBlock: 'segment_header',
  },
  {
    id: 'audio_podcast',
    code: 'J',
    name: 'J. Audio y Podcast',
    shortName: 'Audio y Podcast',
    description:
      'Especializado en narrativa sonora, ficción en audio y podcasts conversacionales con música, ambientes y efectos.',
    idealFor: 'Podcasts narrativos, audiodramas, ficción sonora y radio',
    allowedBlocks: [
      'narrator_cue',
      'voice_cue',
      'dialogue',
      'music_cue',
      'ambience_cue',
      'sfx_cue',
      'silence_mark',
    ],
    defaultFirstBlock: 'narrator_cue',
  },
  {
    id: 'videoclip',
    code: 'K',
    name: 'K. Videoclip Musical',
    shortName: 'Videoclip',
    description:
      'Sincroniza secciones de la canción y marcas de tiempo con acciones visuales, coreografía y planos.',
    idealFor: 'Videos musicales, lyric videos escénicos y performances',
    allowedBlocks: [
      'music_section',
      'timecode_mark',
      'visual_desc',
      'choreography',
      'shot',
      'transition',
    ],
    defaultFirstBlock: 'music_section',
  },
];

export const NARRATIVE_METHODOLOGIES: NarrativeMethodology[] = [
  {
    id: 'none',
    categoryLabel: 'General',
    name: 'Sin metodología guiada (Escritura libre)',
    description: 'Escribe a tu propio ritmo sin guías de estructura dramática.',
    stages: [],
  },
  {
    id: 'cine_tres_actos',
    categoryLabel: 'Cine y Ficción',
    name: 'Estructura Clásica en Tres Actos',
    description: 'Planteamiento, Confrontación y Resolución dramática.',
    stages: [
      {
        title: 'Acto I: Planteamiento y Detonante',
        guidance: 'Presenta el mundo ordinario del protagonista y el suceso que altera su estabilidad.',
        suggestedPrompt: 'Presentación del personaje principal y detonante de la historia...',
      },
      {
        title: 'Acto II: Confrontación y Punto Medio',
        guidance: 'El protagonista enfrenta obstáculos crecientes hasta un giro central que eleva el riesgo.',
        suggestedPrompt: 'El conflicto se complica cuando...',
      },
      {
        title: 'Acto III: Clímax y Resolución',
        guidance: 'Enfrentamiento decisivo con el conflicto principal y nuevo equilibrio final.',
        suggestedPrompt: 'En el momento decisivo...',
      },
    ],
  },
  {
    id: 'cine_cinco_actos',
    categoryLabel: 'Cine y Ficción',
    name: 'Estructura Dramática en Cinco Actos',
    description: 'Exposición, Acción ascendente, Clímax, Acción descendente y Desenlace.',
    stages: [
      { title: '1. Exposición', guidance: 'Contexto, atmósfera y presentación del conflicto latente.', suggestedPrompt: '' },
      { title: '2. Acción Ascendente', guidance: 'Complicaciones progresivas y alianzas.', suggestedPrompt: '' },
      { title: '3. Clímax / Giro Central', guidance: 'Punto de máxima tensión e inflexión.', suggestedPrompt: '' },
      { title: '4. Acción Descendente', guidance: 'Consecuencias directas del giro central.', suggestedPrompt: '' },
      { title: '5. Desenlace', guidance: 'Cierre del destino de los personajes.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'cine_viaje_heroe',
    categoryLabel: 'Cine y Ficción',
    name: 'El Viaje del Héroe',
    description: 'Llamada a la aventura, cruce del umbral, pruebas, abismo y regreso con el elixir.',
    stages: [
      { title: '1. Mundo Ordinario y Llamada', guidance: 'El protagonista recibe el desafío que lo invita a salir de lo conocido.', suggestedPrompt: '' },
      { title: '2. Cruce del Umbral y Pruebas', guidance: 'Aliados, enemigos y aprendizaje de las reglas del nuevo mundo.', suggestedPrompt: '' },
      { title: '3. El Abismo / Prueba Suprema', guidance: 'Crisis mayor donde el protagonista enfrenta su mayor temor.', suggestedPrompt: '' },
      { title: '4. Regreso Transformado', guidance: 'Vuelta al origen con una nueva visión o conquista.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'cine_beat_sheet',
    categoryLabel: 'Cine y Ficción',
    name: 'Beat Sheet (Hoja de Tiempos Narrativos)',
    description: 'Imagen de apertura, catalizador, debate, punto medio, noche oscura del alma y cierre.',
    stages: [
      { title: 'Imagen de Apertura y Catalizador', guidance: 'Primera impresión visual e incidente incitador.', suggestedPrompt: '' },
      { title: 'Promesa de la Premisa y Punto Medio', guidance: 'Desarrollo del concepto central y cambio de rumbo.', suggestedPrompt: '' },
      { title: 'Todo está perdido y Finale', guidance: 'Momento más bajo antes de hallar la solución definitiva.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'series_tramas_abc',
    categoryLabel: 'Series',
    name: 'Tramas A / B / C (Episódica)',
    description: 'Entrelaza la historia principal del episodio (Trama A) con la subtrama relacional (B) y el alivio o arco largo (C).',
    stages: [
      { title: 'Trama A (Principal)', guidance: 'Conflicto central del episodio que impulsa la acción.', suggestedPrompt: '' },
      { title: 'Trama B (Secundaria / Emocional)', guidance: 'Desarrollo de relaciones entre personajes que complementa el tema.', suggestedPrompt: '' },
      { title: 'Trama C (Corredor / Arco de Temporada)', guidance: 'Semilla ligera o misterio que conecta con futuros capítulos.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'series_teaser_actos',
    categoryLabel: 'Series',
    name: 'Teaser (Cold Open), Actos y Tag Cierre',
    description: 'Arranque impactante antes de títulos, desarrollo por actos y gancho final (cliffhanger).',
    stages: [
      { title: 'Teaser / Cold Open', guidance: 'Escena inicial atrapante antes de los créditos.', suggestedPrompt: '' },
      { title: 'Actos Centrales', guidance: 'Desarrollo del problema del episodio y giros.', suggestedPrompt: '' },
      { title: 'Tag / Cierre con Gancho', guidance: 'Remate o revelación que invita a ver el siguiente episodio.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'sketch_escalada_remate',
    categoryLabel: 'Sketches y Comedia',
    name: 'Premisa, Planteamiento, Escalada y Remate',
    description: 'Fórmula clásica de comedia para construir el juego cómico (Game of the Scene) y rematar.',
    stages: [
      { title: '1. Planteamiento Realista', guidance: 'Establece una situación reconocible en los primeros segundos.', suggestedPrompt: '' },
      { title: '2. Premisa Cómica (El Juego)', guidance: 'Introduce el elemento absurdo o comportamiento inusual.', suggestedPrompt: '' },
      { title: '3. Escalada (3 niveles)', guidance: 'Lleva la premisa a consecuencias cada vez más exageradas.', suggestedPrompt: '' },
      { title: '4. Remate (Punchline / Corte)', guidance: 'Termina en el punto más alto con un giro inesperado.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'video_gancho_desarrollo',
    categoryLabel: 'Videos y YouTube',
    name: 'Gancho (Hook), Introducción, Desarrollo y Cierre',
    description: 'Estructura de alta retención para videos digitales y videoensayos.',
    stages: [
      { title: '1. Gancho (Primeros 15-30s)', guidance: 'Promesa clara, pregunta intrigante o impacto visual inmediato.', suggestedPrompt: '' },
      { title: '2. Contexto / Introducción breve', guidance: 'Por qué importa este tema hoy sin rodeos innecesarios.', suggestedPrompt: '' },
      { title: '3. Desarrollo por Bloques', guidance: 'Puntos centrales con ritmo y cambios visuales.', suggestedPrompt: '' },
      { title: '4. Conclusión y Llamado a la Acción', guidance: 'Idea final memorable y cierre ágil.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'tutorial_objetivo_resultado',
    categoryLabel: 'Tutoriales',
    name: 'Objetivo, Explicación, Demostración y Resultado',
    description: 'Guía pedagógica clara para enseñar habilidades o herramientas.',
    stages: [
      { title: '1. Objetivo (Qué lograremos)', guidance: 'Muestra desde el inicio el resultado final que aprenderán.', suggestedPrompt: '' },
      { title: '2. Explicación Conceptual', guidance: 'Explica el porqué de manera sencilla.', suggestedPrompt: '' },
      { title: '3. Demostración Paso a Paso', guidance: 'Ejecuta el proceso en pantalla sin saltar pasos críticos.', suggestedPrompt: '' },
      { title: '4. Resumen y Resultado', guidance: 'Verifica el resultado y ofrece un consejo práctico extra.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'publicidad_aida',
    categoryLabel: 'Publicidad',
    name: 'Método AIDA (Atención, Interés, Deseo, Acción)',
    description: 'Secuencia persuasiva para spots publicitarios, reels de marca y lanzamientos.',
    stages: [
      { title: 'A — Atención', guidance: 'Rompe el patrón con una imagen o pregunta poderosa.', suggestedPrompt: '' },
      { title: 'I — Interés', guidance: 'Conecta con una necesidad o situación cotidiana de la audiencia.', suggestedPrompt: '' },
      { title: 'D — Deseo', guidance: 'Muestra la transformación y el beneficio real.', suggestedPrompt: '' },
      { title: 'A — Acción', guidance: 'Instrucción clara, única y directa de qué hacer ahora.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'publicidad_problema_solucion',
    categoryLabel: 'Publicidad',
    name: 'Problema — Agitación — Solución (PAS)',
    description: 'Ideal para videos explicativos de productos, servicios y campañas directas.',
    stages: [
      { title: '1. Problema', guidance: 'Presenta el obstáculo exacto que vive el espectador.', suggestedPrompt: '' },
      { title: '2. Empatía / Consecuencia', guidance: 'Muestra lo frustrante que resulta no resolverlo.', suggestedPrompt: '' },
      { title: '3. Solución y Prueba', guidance: 'Demuestra cómo funciona la alternativa de forma visual.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'documental_investigacion',
    categoryLabel: 'Documentales',
    name: 'Pregunta Central, Investigación, Evidencias y Conclusión',
    description: 'Estructura de indagación periodística y narrativa de no-ficción.',
    stages: [
      { title: '1. Pregunta Central / Hipótesis', guidance: 'El misterio humano, histórico o social que guía el documental.', suggestedPrompt: '' },
      { title: '2. Contexto e Investigación', guidance: 'Antecedentes, archivo y primeras voces expertas.', suggestedPrompt: '' },
      { title: '3. Contraste de Evidencias y Testimonios', guidance: 'Perspectivas enfrentadas y hallazgos reveladores.', suggestedPrompt: '' },
      { title: '4. Síntesis y Reflexión Abierta', guidance: 'Lo que el hallazgo significa hacia el futuro.', suggestedPrompt: '' },
    ],
  },
  {
    id: 'programa_escaleta_tiempo',
    categoryLabel: 'Programas',
    name: 'Escaleta por Bloques de Tiempo',
    description: 'Distribución rítmica de apertura, secciones principales, dinámicas y cierre.',
    stages: [
      { title: 'Apertura y Sumario (00:00 - 03:00)', guidance: 'Bienvenida energética y adelanto de los contenidos del programa.', suggestedPrompt: '' },
      { title: 'Bloque Central / Entrevista (03:00 - 15:00)', guidance: 'Tema principal con preguntas de apoyo y recursos en pantalla.', suggestedPrompt: '' },
      { title: 'Sección Dinámica / Participación (15:00 - 22:00)', guidance: 'Cambio de ritmo, debate rápido o sección especial.', suggestedPrompt: '' },
      { title: 'Cierre y Créditos (22:00 - 25:00)', guidance: 'Conclusiones, agradecimientos y adelanto de la próxima entrega.', suggestedPrompt: '' },
    ],
  },
];

const SCENE_PREFIXES = [
  'INT.',
  'EXT.',
  'INT/EXT.',
  'EXT/INT.',
  'I/E.',
  'EST.',
  'INTERIOR',
  'EXTERIOR',
];

const TRANSITION_PATTERNS = [
  'CORTE A:',
  'DISUELVE A:',
  'FUNDIDO A NEGRO:',
  'FUNDIDO DE ENTRADA:',
  'FUNDIDO A BLANCO:',
  'CORTE DIRECTO A:',
  'FADE OUT.',
  'FADE IN:',
  'CUT TO:',
  'SMASH CUT TO:',
];

export const ScreenplayEngine = {
  getStructureDefinition(structureType?: ScriptStructureType | string): StructureDefinition {
    const normalized = normalizeStructureType(structureType);
    return (
      STRUCTURES_CATALOG.find((s) => s.id === normalized) || STRUCTURES_CATALOG[0]
    );
  },

  getBlockDefinition(blockType: BlockType): BlockDefinition {
    return BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS.paragraph;
  },

  /**
   * Resolves the effective structure for a specific block index.
   * In Hybrid ('hibrida') mode, walks backwards to the nearest section_divider or block override.
   */
  getEffectiveStructureAtBlock(
    blocks: ScriptBlock[],
    blockIndex: number,
    documentStructure?: ScriptStructureType
  ): ScriptStructureType {
    const docStruct = normalizeStructureType(documentStructure);
    const targetBlock = blocks[blockIndex];
    if (targetBlock?.sectionStructure) {
      return normalizeStructureType(targetBlock.sectionStructure);
    }

    if (docStruct === 'hibrida') {
      for (let i = blockIndex; i >= 0; i--) {
        if (blocks[i]?.type === 'section_divider' && blocks[i]?.sectionStructure) {
          return normalizeStructureType(blocks[i].sectionStructure);
        }
      }
      return 'hibrida';
    }

    return docStruct;
  },

  /**
   * Returns allowed blocks for the current cursor position (supports Hybrid sub-sections)
   */
  getAllowedBlocksForPosition(
    blocks: ScriptBlock[],
    blockIndex: number,
    documentStructure?: ScriptStructureType
  ): BlockDefinition[] {
    const docStruct = normalizeStructureType(documentStructure);
    const effectiveStruct = this.getEffectiveStructureAtBlock(
      blocks,
      blockIndex,
      docStruct
    );
    const def = this.getStructureDefinition(effectiveStruct);

    const list = [...def.allowedBlocks];
    // If document is Hybrid, always allow inserting a new section_divider or two-column row
    if (docStruct === 'hibrida' && !list.includes('section_divider')) {
      list.unshift('section_divider');
    }

    return list.map((t) => this.getBlockDefinition(t));
  },

  /**
   * Generates clean initial blocks for a new script according to its chosen structure.
   * Never forces "INT. LUGAR DE INICIO - DÍA" on non-cinematic structures!
   */
  getInitialBlocksForStructure(structureType?: ScriptStructureType): ScriptBlock[] {
    const struct = normalizeStructureType(structureType);
    const now = Date.now();

    switch (struct) {
      case 'cinematografica':
        return [
          {
            id: `blk-${now}-1`,
            type: 'scene_heading',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'action',
            text: '',
          },
        ];

      case 'estandar_flexible':
        return [
          {
            id: `blk-${now}-1`,
            type: 'heading_1',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'paragraph',
            text: '',
          },
        ];

      case 'hibrida':
        return [
          {
            id: `blk-${now}-1`,
            type: 'section_divider',
            text: 'Sección 1: Introducción',
            sectionStructure: 'voz_en_off',
          },
          {
            id: `blk-${now}-2`,
            type: 'narration',
            text: '',
          },
        ];

      case 'voz_en_off':
        return [
          {
            id: `blk-${now}-1`,
            type: 'narration',
            text: '',
          },
        ];

      case 'audiovisual_tecnico':
        return [
          {
            id: `blk-${now}-1`,
            type: 'av_row',
            text: '',
            visualText: '',
            audioText: '',
          },
        ];

      case 'sketch_comedia':
        return [
          {
            id: `blk-${now}-1`,
            type: 'situation',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'action',
            text: '',
          },
        ];

      case 'documental_entrevista':
        return [
          {
            id: `blk-${now}-1`,
            type: 'narration',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'interview_question',
            text: '',
          },
        ];

      case 'tutorial_educativo':
        return [
          {
            id: `blk-${now}-1`,
            type: 'explanation',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'demonstration',
            text: '',
          },
        ];

      case 'programa_escaleta':
        return [
          {
            id: `blk-${now}-1`,
            type: 'segment_header',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'duration_mark',
            text: '',
          },
        ];

      case 'audio_podcast':
        return [
          {
            id: `blk-${now}-1`,
            type: 'narrator_cue',
            text: '',
          },
        ];

      case 'videoclip':
        return [
          {
            id: `blk-${now}-1`,
            type: 'music_section',
            text: '',
          },
          {
            id: `blk-${now}-2`,
            type: 'visual_desc',
            text: '',
          },
        ];

      default:
        return [
          {
            id: `blk-${now}-1`,
            type: 'paragraph',
            text: '',
          },
        ];
    }
  },

  /**
   * Structure-aware Enter key transition
   */
  getNextBlockTypeOnEnter(
    currentType: BlockType,
    activeStructure: ScriptStructureType = 'cinematografica'
  ): BlockType {
    const struct = normalizeStructureType(activeStructure);

    if (currentType === 'section_divider') {
      const targetDef = this.getStructureDefinition(struct);
      return targetDef.defaultFirstBlock === 'section_divider'
        ? 'narration'
        : targetDef.defaultFirstBlock;
    }

    // Specific rules per structure
    if (struct === 'estandar_flexible') {
      if (currentType === 'heading_1' || currentType === 'heading_2') return 'paragraph';
      if (currentType === 'list_item') return 'list_item';
      if (currentType === 'narration') return 'narration';
      return 'paragraph';
    }

    if (struct === 'voz_en_off') {
      if (currentType === 'pause_mark' || currentType === 'emphasis' || currentType === 'visual_desc') {
        return 'narration';
      }
      return 'narration';
    }

    if (struct === 'audiovisual_tecnico') {
      return 'av_row';
    }

    if (struct === 'sketch_comedia') {
      switch (currentType) {
        case 'situation':
          return 'action';
        case 'action':
          return 'character';
        case 'character':
          return 'dialogue';
        case 'parenthetical':
          return 'dialogue';
        case 'dialogue':
          return 'character'; // Fast sketch dialogue alternation
        case 'twist':
          return 'action';
        case 'punchline':
          return 'action';
        default:
          return 'action';
      }
    }

    if (struct === 'documental_entrevista') {
      switch (currentType) {
        case 'interview_subject':
          return 'testimony';
        case 'interview_question':
          return 'testimony';
        case 'testimony':
          return 'narration';
        default:
          return 'narration';
      }
    }

    if (struct === 'tutorial_educativo') {
      switch (currentType) {
        case 'heading_1':
          return 'explanation';
        case 'explanation':
          return 'demonstration';
        case 'demonstration':
          return 'screen_action';
        case 'screen_action':
          return 'explanation';
        default:
          return 'explanation';
      }
    }

    if (struct === 'programa_escaleta') {
      switch (currentType) {
        case 'segment_header':
          return 'duration_mark';
        case 'duration_mark':
          return 'host_cue';
        case 'intro_cue':
          return 'host_cue';
        case 'host_cue':
          return 'guest_cue';
        case 'guest_cue':
          return 'host_cue';
        default:
          return 'host_cue';
      }
    }

    if (struct === 'audio_podcast') {
      switch (currentType) {
        case 'voice_cue':
          return 'dialogue';
        case 'narrator_cue':
          return 'narrator_cue';
        case 'dialogue':
          return 'voice_cue';
        case 'music_cue':
        case 'ambience_cue':
        case 'sfx_cue':
        case 'silence_mark':
          return 'narrator_cue';
        default:
          return 'narrator_cue';
      }
    }

    if (struct === 'videoclip') {
      switch (currentType) {
        case 'music_section':
          return 'timecode_mark';
        case 'timecode_mark':
          return 'visual_desc';
        case 'visual_desc':
          return 'choreography';
        default:
          return 'visual_desc';
      }
    }

    // Default Cinematográfica / Híbrida behavior
    switch (currentType) {
      case 'scene_heading':
        return 'action';
      case 'character':
        return 'dialogue';
      case 'parenthetical':
        return 'dialogue';
      case 'dialogue':
      case 'voice_over':
      case 'off_screen':
        return 'action';
      case 'transition':
        return 'scene_heading';
      case 'shot':
        return 'action';
      case 'heading_1':
      case 'heading_2':
        return 'paragraph';
      case 'paragraph':
        return 'paragraph';
      case 'narration':
        return 'narration';
      case 'av_row':
        return 'av_row';
      default:
        return 'action';
    }
  },

  /**
   * Structure-aware Tab key cycling
   */
  cycleBlockTypeOnTab(
    currentType: BlockType,
    reverse = false,
    activeStructure: ScriptStructureType = 'cinematografica'
  ): BlockType {
    const structDef = this.getStructureDefinition(activeStructure);
    const order: BlockType[] = structDef.allowedBlocks.filter((b) => b !== 'section_divider');
    if (order.length === 0) return currentType;

    const idx = order.indexOf(currentType);
    if (idx === -1) return order[0];

    if (reverse) {
      return order[(idx - 1 + order.length) % order.length];
    }
    return order[(idx + 1) % order.length];
  },

  /**
   * Intelligently classifies raw imported text into a block type
   */
  classifyBlock(text: string, previousBlockType?: BlockType): BlockType {
    const trimmed = text.trim();
    if (!trimmed) return 'action';

    const upper = trimmed.toUpperCase();

    for (const prefix of SCENE_PREFIXES) {
      if (upper.startsWith(prefix)) {
        return 'scene_heading';
      }
    }

    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return 'parenthetical';
    }

    for (const trans of TRANSITION_PATTERNS) {
      if (upper.endsWith(trans) || upper === trans) {
        return 'transition';
      }
    }

    if (
      upper === trimmed &&
      trimmed.length >= 2 &&
      trimmed.length <= 35 &&
      !trimmed.endsWith('.') &&
      !trimmed.includes('...') &&
      (previousBlockType === 'action' ||
        previousBlockType === 'scene_heading' ||
        previousBlockType === 'transition' ||
        !previousBlockType)
    ) {
      return 'character';
    }

    if (previousBlockType === 'character' || previousBlockType === 'parenthetical') {
      return 'dialogue';
    }

    return 'action';
  },

  /**
   * Non-destructively converts blocks when switching structure on a document or section.
   * Never deletes or invents dialogue/narrative content.
   */
  convertBlocksToStructure(
    blocks: ScriptBlock[],
    targetStructure: ScriptStructureType
  ): { convertedBlocks: ScriptBlock[]; isAmbiguous: boolean; summary: string } {
    const target = normalizeStructureType(targetStructure);

    if (target === 'hibrida') {
      // Hybrid keeps all existing blocks intact and adds a section header at top if none exists
      const hasDivider = blocks.some((b) => b.type === 'section_divider');
      const next = hasDivider
        ? [...blocks]
        : [
            {
              id: `blk-sec-${Date.now()}`,
              type: 'section_divider' as BlockType,
              text: 'Sección 1',
              sectionStructure: 'cinematografica' as ScriptStructureType,
            },
            ...blocks,
          ];
      return {
        convertedBlocks: next,
        isAmbiguous: false,
        summary: 'Modo Híbrido activado: todos tus bloques actuales se conservan intactos y puedes añadir nuevas secciones con distintas estructuras.',
      };
    }

    if (target === 'audiovisual_tecnico') {
      // Convert 1-column blocks into 2-column VIDEO / AUDIO rows preserving all text
      const rows: ScriptBlock[] = blocks.map((b) => {
        if (b.type === 'av_row') return b;
        const isAudioType =
          b.type === 'dialogue' ||
          b.type === 'narration' ||
          b.type === 'voice_over' ||
          b.type === 'off_screen' ||
          b.type === 'music_cue' ||
          b.type === 'sfx_cue' ||
          b.type === 'testimony' ||
          b.type === 'host_cue' ||
          b.type === 'guest_cue' ||
          b.type === 'narrator_cue';

        return {
          ...b,
          type: 'av_row' as BlockType,
          visualText: isAudioType ? b.visualText || '' : b.visualText || b.text,
          audioText: isAudioType ? b.audioText || b.text : b.audioText || '',
        };
      });
      return {
        convertedBlocks: rows,
        isAmbiguous: true,
        summary:
          'Las acciones y encabezados pasarán a la columna VIDEO y los diálogos, narraciones o sonidos pasarán a la columna AUDIO sin perder ninguna palabra.',
      };
    }

    // Converting from 2-column or other structures to a 1-column structure
    const targetDef = this.getStructureDefinition(target);
    const hadTwoColumns = blocks.some(
      (b) => b.type === 'av_row' || (b.visualText && b.audioText)
    );

    const mapped: ScriptBlock[] = [];
    blocks.forEach((b) => {
      if (b.type === 'av_row' || (b.visualText && b.audioText)) {
        if (b.visualText?.trim()) {
          mapped.push({
            id: `${b.id}-vis`,
            type: targetDef.allowedBlocks.includes('visual_desc')
              ? 'visual_desc'
              : targetDef.allowedBlocks.includes('action')
              ? 'action'
              : targetDef.defaultFirstBlock,
            text: b.visualText,
          });
        }
        if (b.audioText?.trim()) {
          mapped.push({
            id: `${b.id}-aud`,
            type: targetDef.allowedBlocks.includes('narration')
              ? 'narration'
              : targetDef.allowedBlocks.includes('dialogue')
              ? 'dialogue'
              : targetDef.defaultFirstBlock,
            text: b.audioText,
          });
        }
        if (!b.visualText?.trim() && !b.audioText?.trim()) {
          mapped.push({
            ...b,
            type: targetDef.defaultFirstBlock,
          });
        }
        return;
      }

      if (targetDef.allowedBlocks.includes(b.type)) {
        mapped.push(b);
        return;
      }

      // Semantic equivalence mapping across structures
      let mappedType: BlockType = targetDef.defaultFirstBlock;
      if (
        (b.type === 'action' || b.type === 'paragraph' || b.type === 'description') &&
        targetDef.allowedBlocks.includes('paragraph')
      ) {
        mappedType = 'paragraph';
      } else if (
        (b.type === 'paragraph' || b.type === 'description' || b.type === 'visual_desc') &&
        targetDef.allowedBlocks.includes('action')
      ) {
        mappedType = 'action';
      } else if (
        (b.type === 'dialogue' || b.type === 'narration' || b.type === 'testimony') &&
        targetDef.allowedBlocks.includes('narration')
      ) {
        mappedType = 'narration';
      } else if (
        (b.type === 'narration' || b.type === 'testimony') &&
        targetDef.allowedBlocks.includes('dialogue')
      ) {
        mappedType = 'dialogue';
      } else if (
        (b.type === 'scene_heading' || b.type === 'segment_header' || b.type === 'music_section') &&
        targetDef.allowedBlocks.includes('heading_1')
      ) {
        mappedType = 'heading_1';
      }

      mapped.push({
        ...b,
        type: mappedType,
      });
    });

    return {
      convertedBlocks: mapped.length > 0 ? mapped : this.getInitialBlocksForStructure(target),
      isAmbiguous: hadTwoColumns,
      summary: `Los bloques se adaptarán a la estructura "${targetDef.shortName}" conservando íntegramente tu texto.`,
    };
  },

  getBlockLineCount(block: ScriptBlock): number {
    const textLen = (block.text || '').length + (block.visualText || '').length + (block.audioText || '').length;
    switch (block.type) {
      case 'scene_heading':
      case 'heading_1':
      case 'segment_header':
      case 'music_section':
      case 'section_divider':
        return 3;
      case 'character':
      case 'interview_subject':
      case 'voice_cue':
        return 2;
      case 'parenthetical':
      case 'pause_mark':
      case 'silence_mark':
      case 'duration_mark':
      case 'timecode_mark':
        return 1;
      case 'dialogue':
      case 'voice_over':
      case 'off_screen':
      case 'testimony':
        return Math.max(1, Math.ceil(textLen / 36));
      case 'av_row':
        return Math.max(2, Math.ceil(textLen / 45)) + 1;
      default:
        return Math.max(1, Math.ceil(textLen / 60)) + 1;
    }
  },

  paginate(blocks: ScriptBlock[]): PageSection[] {
    const LINES_PER_PAGE = 52;
    const pages: PageSection[] = [];

    let currentPageBlocks: ScriptBlock[] = [];
    let currentLineCount = 0;
    let pageNum = 1;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockLines = this.getBlockLineCount(block);

      const isCharacterAtBottom =
        (block.type === 'character' || block.type === 'interview_subject' || block.type === 'voice_cue') &&
        currentLineCount + blockLines + 2 > LINES_PER_PAGE;

      if (
        (currentLineCount + blockLines > LINES_PER_PAGE || isCharacterAtBottom) &&
        currentPageBlocks.length > 0
      ) {
        pages.push({
          pageNumber: pageNum,
          blocks: currentPageBlocks,
        });
        pageNum++;
        currentPageBlocks = [block];
        currentLineCount = blockLines;
      } else {
        currentPageBlocks.push(block);
        currentLineCount += blockLines;
      }
    }

    if (currentPageBlocks.length > 0 || pages.length === 0) {
      pages.push({
        pageNumber: pageNum,
        blocks: currentPageBlocks,
      });
    }

    return pages;
  },

  extractScenes(blocks: ScriptBlock[]) {
    const scenes: {
      index: number;
      block: ScriptBlock;
      sceneNumber: number;
      title: string;
      badge: string;
    }[] = [];
    let counter = 1;

    blocks.forEach((block, index) => {
      if (
        block.type === 'scene_heading' ||
        block.type === 'heading_1' ||
        block.type === 'section_divider' ||
        block.type === 'segment_header' ||
        block.type === 'music_section' ||
        block.type === 'situation'
      ) {
        const badge =
          block.type === 'section_divider'
            ? 'SECCIÓN'
            : block.type === 'segment_header'
            ? 'BLOQUE'
            : block.type === 'music_section'
            ? 'TEMA'
            : block.type === 'heading_1'
            ? 'TÍTULO'
            : block.type === 'situation'
            ? 'SKETCH'
            : `ESC. ${block.sceneNumber || counter}`;

        scenes.push({
          index,
          block,
          sceneNumber: block.sceneNumber || counter,
          title: block.text || 'Sin título',
          badge,
        });
        counter++;
      }
    });

    return scenes;
  },

  extractCharactersInScript(blocks: ScriptBlock[]): { name: string; count: number }[] {
    const charMap: Record<string, number> = {};

    blocks.forEach((b) => {
      if (b.type === 'character' || b.type === 'voice_cue' || b.type === 'interview_subject') {
        const name = b.text.trim().toUpperCase().replace(/\s*\(.*\)$/, '');
        if (name) {
          charMap[name] = (charMap[name] || 0) + 1;
        }
      }
    });

    return Object.entries(charMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  extractLocationsInScript(blocks: ScriptBlock[]): string[] {
    const locations = new Set<string>();

    blocks.forEach((b) => {
      if (b.type === 'scene_heading') {
        const cleaned = b.text
          .replace(/^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)\s*/i, '')
          .split('-')[0]
          ?.trim()
          .toUpperCase();
        if (cleaned) {
          locations.add(cleaned);
        }
      }
    });

    return Array.from(locations);
  },
};
