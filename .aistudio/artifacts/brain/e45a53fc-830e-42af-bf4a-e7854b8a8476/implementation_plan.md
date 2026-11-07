# Gerstep Script Studio — Plan de Implementación

Gerstep Script Studio es un entorno integral de escritura y gestión audiovisual que une la fluidez colaborativa y visual de Google Docs, la precisión semántica y de sangrías de Final Draft y la organización de producciones cinematográficas y televisivas. Su motor central automatiza el formato y paginación para que el escritor se enfoque exclusivamente en la narrativa.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> **Preferencias del usuario confirmadas en Fase 1:**
> 1. **Almacenamiento y Persistencia**: Almacenamiento local inmediato y resiliente mediante IndexedDB (sin bloqueos de inicio de sesión, con guardado automático continuo, exportación/importación de copias de seguridad en JSON y soporte para sincronización remota opcional).
> 2. **Identidad Visual**: Modo oscuro cinematográfico como predeterminado (inspirado en Linear y estaciones de trabajo de postproducción, con lienzo de hoja de papel contrastada y conmutador rápido claro/oscuro en barra superior).
> 3. **Experiencia de Entrada**: Modo dual con acceso directo para alternar fluidamente entre el **Modo Profesional** (atajos de teclado Tab/Enter, autocompletado de personajes/lugares) y el **Modo Asistente** (cuestionario guiado en lenguaje natural con vista previa y confirmación previa).

---

## 1. Visión General y Concepto Central

- **Propósito**: Permitir que cualquier creador (desde un aficionado de YouTube hasta un guionista de series o largometrajes) escriba y estructure guiones audiovisuales sin necesidad de memorizar sangrías, tabulaciones o reglas complejas de maquetación cinematográfica.
- **Público Objetivo**: Guionistas, directores independientes, creadores de contenido digital (YouTube, Reels, TikTok), dramaturgos y estudiantes audiovisuales.
- **Principio Fundamental**: *"Tú cuentas la historia. Nosotros nos encargamos del formato"*. El editor detecta y clasifica la intención dramática respetando la libertad creativa del autor.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos de Usuario Principales

1. **Biblioteca y Organización**:
   - Acceso instantáneo a proyectos organizados en 5 categorías maestras: **Películas**, **Series** (con temporadas y episodios independientes pero universo compartido), **Videos Independientes** (YouTube, videoclips, publicidad en dos columnas), **Contenido Episódico** y **Proyectos Personalizados**.
   - Asistente ágil de 3 pasos para nuevo proyecto (Categoría → Título → Plantilla de inicio: Vacío, Idea inicial o Ejemplo estructurado).
   - Búsqueda en tiempo real, filtros por categoría, favoritos, proyectos archivados y papelera con recuperación.

2. **Lienzo de Escritura Profesional (El Editor)**:
   - **Barra Superior**: Título editable con un clic, indicador de estado de guardado en tiempo real ("Guardado localmente"), botones Deshacer/Rehacer, conmutador de Modo Dual (Pro / Asistente), selector de Zoom (75%, 100%, 125%), menú de Exportación (PDF, Fountain, TXT, JSON) y cambio de tema Claro/Oscuro.
   - **Panel Lateral Plegable**: Navegador de escenas con salto directo y reordenamiento, panel de personajes y lugares con estadísticas de apariciones, y documentos complementarios (Sinopsis, Logline, Escaleta, Biblia de serie, Notas).
   - **Lienzo Central**: Simulación de hojas de papel tamaño US Letter (8.5 × 11 pulgadas) con numeración de página calculada, márgenes normalizados (izquierdo 1.5 pulgadas para encuadernación, superior/inferior/derecho 1.0 pulgada) y tipografía Courier Prime / Courier New a 12pt.

3. **Modo Asistente para Principiantes**:
   - Tarjeta flotante discreta o panel lateral con preguntas guiadas: *¿Dónde ocurre? ¿Es interior o exterior? ¿Día o noche? ¿Qué acción sucede? ¿Quién habla? ¿Qué dice?*.
   - Generación de propuesta con vista previa antes de insertar en el guion.

### Identidad Visual y Estilo

- **Paleta de Colores**:
  - Fondo de interfaz: Slate oscuro neutro (`#0B0F19` y `#111827`) con bordes sutiles de 1px (`#1F2937`).
  - Hojas de papel: Contraste editorial blanco nítido (`#FAFAFA`) en modo claro o papel neutro cinematográfico en modo oscuro, con tipografía tipográfica monoespaciada negra/carbón de máxima legibilidad.
  - Acentos: Azul zafiro (`#2563EB`) y ámbar dorado (`#D97706`) para elementos activos y foco de escritura.
- **Tipografía**:
  - Interfaz: *Plus Jakarta Sans* y *DM Sans* para navegación, menús y botones.
  - Documento: *Courier Prime* / *Courier New* a 12pt con espaciado de línea tradicional (1.0 - 1.15) y sangrías exactas por tipo de bloque.

---

## 3. Decisiones de Producto y Reglas de Formato

### Bloques Semánticos de Guion

| Bloque | Sangría / Alineación | Transformación Automática |
| :--- | :--- | :--- |
| **Encabezado de Escena (Scene Heading)** | Margen izquierdo 1.5", MAYÚSCULAS | Detecta prefijos `INT.`, `EXT.`, `INT/EXT.` y transiciones horarias ` - DÍA`, ` - NOCHE`. |
| **Acción (Action)** | Margen izquierdo 1.5", ancho completo | Bloque por defecto tras un encabezado de escena. Texto normal. |
| **Personaje (Character)** | Sangría centrada a ~3.7" (MAYÚSCULAS) | Al pulsar Enter tras un personaje, pasa automáticamente a **Diálogo**. |
| **Diálogo (Dialogue)** | Sangría izquierda a ~2.5", ancho ~3.5" | Texto justificado a la izquierda dentro de la columna de diálogo. |
| **Acotación (Parenthetical)** | Sangría izquierda a ~3.1", entre paréntesis `()` | Usado para instrucciones actorales breves. Al pulsar Enter vuelve a Diálogo. |
| **Transición (Transition)** | Alineado a la derecha ~6.0", MAYÚSCULAS | Detecta `CORTE A:`, `DISUELVE A:`, `FUNDIDO A NEGRO:`. |
| **Plano / Indicación Especial (Shot)** | Margen izquierdo 1.5", MAYÚSCULAS | Para guiones técnicos o de rodaje. |

### Atajos de Teclado Inteligentes

- `Enter`: Crea el siguiente bloque lógico (Escena → Acción; Personaje → Diálogo; Diálogo → Acción o nuevo Personaje si hay doble salto).
- `Tab`: Alterna cíclicamente el tipo de bloque actual (Acción → Personaje → Acotación → Transición → Escena).
- `Ctrl + S`: Guarda y confirma el estado en IndexedDB.
- `Ctrl + Z / Ctrl + Y`: Historial de cambios continuo.
- `Escape`: Cierra menús de autocompletado y modales.

---

## 4. Arquitectura Técnica y Estrategia de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GERSTEP SCRIPT STUDIO                           │
├────────────────────────────────┬───────────────────────────────────────┤
│          BIBLIOTECA            │           EDITOR DE GUIONES           │
│  - Proyectos (5 categorías)    │  - Árbol de episodios / escenas       │
│  - Temporadas y Episodios      │  - Hojas paginadas US Letter (12pt)   │
│  - Documentos complementarios  │  - Selector de bloque (Tab/Enter)     │
│  - Papelera / Favoritos        │  - Modo Dual: Pro / Asistente         │
├────────────────────────────────┴───────────────────────────────────────┤
│                          MOTOR SEMÁNTICO                               │
│   - Nodos tipados: SceneHeading, Action, Character, Dialogue, Parenthetical│
│   - Parser de Fountain e Importador TXT                                │
│   - Generador real de PDF (jsPDF / HTML-Canvas paginado) & TXT         │
├────────────────────────────────────────────────────────────────────────┤
│                       CAPA DE PERSISTENCIA                             │
│   - Repositorio IndexedDB (idb-keyval / dexie-like reactivo)           │
│   - Auto-save debounced (700ms) + Backup exportable en JSON           │
│   - Opcional: Proxy backend Node.js + Firebase / Gemini                │
└────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos Principal

- **Project**: `id`, `title`, `type` (`movie` | `series` | `video` | `episodic` | `custom`), `category`, `createdAt`, `updatedAt`, `isFavorite`, `isArchived`, `seasons` (array opcional), `characters` (compartidos a nivel de proyecto), `locations`, `supplementaryDocs` (sinopsis, escaleta, biblia).
- **Episode / ScriptDocument**: `id`, `projectId`, `seasonId` (opcional), `title`, `templateType` (`screenplay` | `two_column` | `youtube` | `short`), `blocks`: Array de `ScriptBlock`.
- **ScriptBlock**: `id`, `type` (`scene_heading` | `action` | `character` | `dialogue` | `parenthetical` | `transition` | `shot` | `general`), `text`: `string`, `notes` (opcional), `sceneNumber` (opcional).

### Motor de Exportación e Importación

- **PDF Real**: Renderizado con fuentes monoespaciadas idénticas a Courier Prime, cálculo de saltos de página evitando dejar personajes huérfanos sin su diálogo correspondiente, encabezado de página con número correlativo en margen superior derecho.
- **Fountain**: Compatibilidad completa con el estándar de la industria (.fountain), importación y exportación bidireccional limpia.
- **JSON Backup**: Respaldo completo de proyectos y configuraciones.

---

## Pasos de Ejecución

1. **Infraestructura y Tipos de Datos**: Definir interfaces en TypeScript para proyectos, episodios, personajes, escenas y bloques semánticos.
2. **Capa de Persistencia IndexedDB**: Crear cliente de almacenamiento reactivo con datos de demostración enriquecidos (ej. cortometraje y serie en español con personajes).
3. **Biblioteca de Proyectos**: Vistas de proyectos recientes, árbol jerárquico, creación modal guiada, archivado y favoritos.
4. **Editor Central de Guiones**: Componente de páginas US Letter, cursor fluido, atajos de teclado Tab/Enter, autocompletado y formateador instantáneo.
5. **Modo Asistente Guiado**: Modal interactivo de preguntas cotidianas que traduce respuestas a bloques de guion con previa confirmación.
6. **Navegador de Escenas y Personajes**: Panel lateral para saltar entre escenas, reordenarlas y gestionar fichas de personajes del proyecto.
7. **Documentos Complementarios**: Pestañas de Sinopsis, Logline, Escaleta y Notas.
8. **Motor de Exportación**: Generador de PDF paginado, exportador Fountain y TXT, e importador.
9. **Asistente AI Opcional**: Integración en backend con Gemini API (`@google/genai`) para sugerencias de diálogos y revisión de formato con aprobación obligatoria del usuario.
10. **Verificación y Pulido**: Compilación limpia, linting sin errores y pruebas de flujos.
