/**
 * CineDocs Studio - Core Data Models & Types
 */

export type BlockType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'shot'
  | 'general';

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
}

export type ProjectCategory =
  | 'movie'
  | 'series'
  | 'video'
  | 'episodic'
  | 'custom';

export type TemplateType =
  | 'screenplay'
  | 'two_column'
  | 'youtube'
  | 'short';

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
  episodeNumber?: number;
  title: string;
  templateType: TemplateType;
  blocks: ScriptBlock[];
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveFolderPath?: string;
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
  lastSyncedAt?: string;
}
