/**
 * Gerstep Script Studio / CineDocs - Core Data Models & Script Structures
 */

export type ScriptStructureType =
  | 'cinematografica'
  | 'estandar_flexible'
  | 'hibrida'
  | 'voz_en_off'
  | 'audiovisual_tecnico'
  | 'sketch_comedia'
  | 'documental_entrevista'
  | 'tutorial_educativo'
  | 'programa_escaleta'
  | 'audio_podcast'
  | 'videoclip'
  // Backwards compatibility aliases
  | 'screenplay'
  | 'two_column'
  | 'youtube'
  | 'short';

export type TemplateType = ScriptStructureType;

export type BlockType =
  // A. Cinematográfica & Ficción
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'shot'
  | 'voice_over'
  | 'off_screen'
  | 'general'
  // B. Estándar flexible
  | 'heading_1'
  | 'heading_2'
  | 'paragraph'
  | 'narration'
  | 'description'
  | 'list_item'
  | 'note_block'
  // C. Híbrida (Divisor de sección con su propia estructura)
  | 'section_divider'
  // D. Voz en off
  | 'pause_mark'
  | 'emphasis'
  | 'visual_desc'
  | 'music_cue'
  | 'sfx_cue'
  // E. Audiovisual técnico (2 columnas VIDEO / AUDIO)
  | 'av_row'
  // F. Sketch y comedia
  | 'situation'
  | 'twist'
  | 'punchline'
  // G. Documental y entrevista
  | 'interview_question'
  | 'testimony'
  | 'interview_subject'
  | 'archive_footage'
  | 'source_ref'
  | 'reenactment'
  | 'research_note'
  // H. Tutorial y educativo
  | 'explanation'
  | 'demonstration'
  | 'screen_action'
  | 'example_block'
  | 'visual_resource'
  // I. Programa y escaleta
  | 'segment_header'
  | 'duration_mark'
  | 'host_cue'
  | 'guest_cue'
  | 'intro_cue'
  | 'outro_cue'
  | 'production_note'
  // J. Audio y podcast
  | 'narrator_cue'
  | 'voice_cue'
  | 'ambience_cue'
  | 'silence_mark'
  // K. Videoclip
  | 'music_section'
  | 'timecode_mark'
  | 'choreography';

export type NarrativeMethodologyId =
  | 'none'
  | 'cine_tres_actos'
  | 'cine_cinco_actos'
  | 'cine_viaje_heroe'
  | 'cine_beat_sheet'
  | 'series_tramas_abc'
  | 'series_teaser_actos'
  | 'sketch_escalada_remate'
  | 'video_gancho_desarrollo'
  | 'tutorial_objetivo_resultado'
  | 'publicidad_aida'
  | 'publicidad_problema_solucion'
  | 'documental_investigacion'
  | 'programa_escaleta_tiempo';

export interface ScriptBlock {
  id: string;
  type: BlockType;
  text: string;
  notes?: string;
  sceneNumber?: number;
  shotType?: string;
  // Two-column audio/video support
  visualText?: string;
  audioText?: string;
  // Hybrid section structure support: defines or overrides structure for this section/block
  sectionStructure?: ScriptStructureType;
  sectionTitle?: string;
}

export type ProjectCategory =
  | 'movie'
  | 'series'
  | 'video'
  | 'episodic'
  | 'custom';

export interface Character {
  id: string;
  name: string;
  description: string;
  age?: string;
  personality?: string;
  goals?: string;
  relationships?: string;
  personalHistory?: string;
  notes?: string;
  colorBadge?: string;
  dialogueCount?: number;
}

export interface LocationItem {
  id: string;
  name: string;
  type: 'INT' | 'EXT' | 'INT/EXT';
  description?: string;
  scenesCount?: number;
}

export type SupplementaryType =
  | 'synopsis'
  | 'logline'
  | 'premise'
  | 'beat_sheet'
  | 'treatment'
  | 'series_bible'
  | 'notes'
  | 'research';

export interface SupplementaryDoc {
  id: string;
  type: SupplementaryType;
  title: string;
  content: string;
  updatedAt: string;
}

export interface LocalSnapshot {
  id: string;
  timestamp: string;
  label: string;
  blocks: ScriptBlock[];
}

export interface ScriptDocument {
  id: string;
  projectId: string;
  seasonId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  templateType: ScriptStructureType;
  methodologyId?: NarrativeMethodologyId;
  blocks: ScriptBlock[];
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveFolderPath?: string;
  localDirectoryPath?: string;
  lastSyncedAt?: string;
  snapshots?: LocalSnapshot[];
}

export interface Season {
  id: string;
  projectId: string;
  seasonNumber: number;
  title: string;
  episodes: ScriptDocument[];
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  subCategory?: string;
  defaultStructure?: ScriptStructureType;
  methodologyId?: NarrativeMethodologyId;
  logline?: string;
  author?: string;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  documents: ScriptDocument[];
  seasons?: Season[];
  characters: Character[];
  locations: LocationItem[];
  supplementaryDocs: SupplementaryDoc[];
  coverColor?: string;
  driveFolderId?: string;
  driveFolderPath?: string;
  localDirectoryPath?: string;
  lastSyncedAt?: string;
}
