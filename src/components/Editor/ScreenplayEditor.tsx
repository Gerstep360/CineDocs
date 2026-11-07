import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Users,
  CloudUpload,
  ExternalLink,
  Check,
  Maximize2,
  Minimize2,
  Columns,
  ShieldCheck,
  X,
  Layers,
  Compass,
  FolderOpen,
  SplitSquareVertical,
  ArrowRightLeft,
} from 'lucide-react';
import {
  BlockType,
  ScriptBlock,
  ScriptDocument,
  ScriptStructureType,
  NarrativeMethodologyId,
  Project,
  Character,
  LocalSnapshot,
} from '../../types/script';
import {
  ScreenplayEngine,
  STRUCTURES_CATALOG,
  NARRATIVE_METHODOLOGIES,
  normalizeStructureType,
} from '../../lib/screenplay-engine';
import {
  getDriveAccessToken,
  googleDriveSignIn,
  ensureCategoryFolderHierarchy,
  checkExistingScriptFileInDrive,
  uploadScriptToGoogleDrive,
  getTargetDrivePath,
  getTargetLocalDirectoryPath,
  saveToLocalGerstepDirectory,
} from '../../lib/googleDrive';
import { Exporters } from '../../lib/exporters';
import { SceneNavigator } from './SceneNavigator';
import { CharactersPanel } from './CharactersPanel';
import { GuidedAssistant } from './GuidedAssistant';
import { ExportModal } from './ExportModal';
import { AiAssistantModal } from './AiAssistantModal';

interface ScreenplayEditorProps {
  project: Project;
  activeDocument: ScriptDocument;
  onUpdateDocument: (updatedDoc: ScriptDocument) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onNavigateToView: (view: 'library' | 'characters' | 'supplementary' | 'backup') => void;
  onGoogleUserConnected?: (user: any) => void;
}

export const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  project,
  activeDocument,
  onUpdateDocument,
  onUpdateProject,
  onNavigateToView,
  onGoogleUserConnected,
}) => {
  const [blocks, setBlocks] = useState<ScriptBlock[]>(activeDocument.blocks || []);
  const [docTitle, setDocTitle] = useState(activeDocument.title);
  const [history, setHistory] = useState<ScriptBlock[][]>([activeDocument.blocks || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Google Docs / Word style UI states
  const [zoom, setZoom] = useState<number>(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'scenes' | 'characters' | 'episodes'>('scenes');
  const [showAssistantDrawer, setShowAssistantDrawer] = useState(false);
  const [showMethodologyGuide, setShowMethodologyGuide] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [paperAppearance, setPaperAppearance] = useState<'white' | 'adaptive'>('white');
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);

  // Dropdown menus state
  const [openMenu, setOpenMenu] = useState<
    | 'file'
    | 'insert'
    | 'format'
    | 'tools'
    | 'style'
    | 'structure'
    | 'zoom'
    | 'snapshots'
    | null
  >(null);
  const [showPlusMenuAt, setShowPlusMenuAt] = useState<number | null>(null);

  // Structure Conversion Preview Modal (when changing structure of a document with content)
  const [pendingStructureChange, setPendingStructureChange] = useState<{
    targetStructure: ScriptStructureType;
    convertedBlocks: ScriptBlock[];
    summary: string;
    isAmbiguous: boolean;
  } | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Google Drive Sync & Confirmation State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveToast, setDriveToast] = useState<{
    message: string;
    link?: string;
    isError?: boolean;
  } | null>(null);
  const [pendingDriveOverwrite, setPendingDriveOverwrite] = useState<{
    folderId: string;
    existingFileId: string;
    fileName: string;
    folderPath: string;
    token: string;
  } | null>(null);

  // Autocomplete Suggestions
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([]);

  const blockRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBlocks(activeDocument.blocks || []);
    setDocTitle(activeDocument.title);
    setHistory([activeDocument.blocks || []]);
    setHistoryIndex(0);
  }, [activeDocument.id]);

  // Close top dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSeasonTitle = useMemo(() => {
    if (project.category === 'series' && project.seasons && activeDocument.seasonId) {
      return project.seasons.find((s) => s.id === activeDocument.seasonId)?.title;
    }
    return undefined;
  }, [project, activeDocument.seasonId]);

  const documentStructure = normalizeStructureType(
    activeDocument.templateType || project.defaultStructure || 'cinematografica'
  );
  const documentStructureDef = ScreenplayEngine.getStructureDefinition(documentStructure);

  // Effective structure at current block (supports Hybrid sub-sections)
  const effectiveStructureAtCursor = useMemo(() => {
    return ScreenplayEngine.getEffectiveStructureAtBlock(
      blocks,
      activeBlockIndex,
      documentStructure
    );
  }, [blocks, activeBlockIndex, documentStructure]);

  const effectiveStructureDef = useMemo(() => {
    return ScreenplayEngine.getStructureDefinition(effectiveStructureAtCursor);
  }, [effectiveStructureAtCursor]);

  const allowedBlockDefsAtCursor = useMemo(() => {
    return ScreenplayEngine.getAllowedBlocksForPosition(
      blocks,
      activeBlockIndex,
      documentStructure
    );
  }, [blocks, activeBlockIndex, documentStructure]);

  const activeMethodologyId: NarrativeMethodologyId =
    activeDocument.methodologyId || project.methodologyId || 'none';
  const activeMethodology = useMemo(
    () =>
      NARRATIVE_METHODOLOGIES.find((m) => m.id === activeMethodologyId) ||
      NARRATIVE_METHODOLOGIES[0],
    [activeMethodologyId]
  );

  const pushHistory = (newBlocks: ScriptBlock[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newBlocks);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const updateBlocksState = (
    newBlocks: ScriptBlock[],
    recordHistory = true,
    overrideStructure?: ScriptStructureType
  ) => {
    setBlocks(newBlocks);
    if (recordHistory) {
      pushHistory(newBlocks);
    }
    onUpdateDocument({
      ...activeDocument,
      title: docTitle,
      templateType: overrideStructure || activeDocument.templateType,
      blocks: newBlocks,
      updatedAt: new Date().toISOString(),
    });
  };

  // Request changing the document's structure (preserving 100% of text, with preview if needed)
  const handleRequestStructureChange = (targetStructure: ScriptStructureType) => {
    setOpenMenu(null);
    const normalizedTarget = normalizeStructureType(targetStructure);
    if (normalizedTarget === documentStructure) return;

    const hasWrittenContent = blocks.some(
      (b) =>
        (b.text && b.text.trim().length > 0 && !b.text.startsWith('Sección ')) ||
        (b.visualText && b.visualText.trim().length > 0) ||
        (b.audioText && b.audioText.trim().length > 0)
    );

    if (!hasWrittenContent) {
      const freshBlocks = ScreenplayEngine.getInitialBlocksForStructure(normalizedTarget);
      updateBlocksState(freshBlocks, true, normalizedTarget);
      const structDef = ScreenplayEngine.getStructureDefinition(normalizedTarget);
      setDriveToast({
        message: `Estructura cambiada a: ${structDef.code}. ${structDef.name}`,
      });
      setTimeout(() => setDriveToast(null), 3500);
      return;
    }

    const conversion = ScreenplayEngine.convertBlocksToStructure(blocks, normalizedTarget);
    if (conversion.isAmbiguous) {
      setPendingStructureChange({
        targetStructure: normalizedTarget,
        convertedBlocks: conversion.convertedBlocks,
        summary: conversion.summary,
        isAmbiguous: true,
      });
    } else {
      updateBlocksState(conversion.convertedBlocks, true, normalizedTarget);
      const structDef = ScreenplayEngine.getStructureDefinition(normalizedTarget);
      setDriveToast({
        message: `Estructura adaptada a "${structDef.shortName}" sin perder contenido (Ctrl+Z para deshacer).`,
      });
      setTimeout(() => setDriveToast(null), 4000);
    }
  };

  const confirmStructureConversion = () => {
    if (!pendingStructureChange) return;
    const { targetStructure, convertedBlocks } = pendingStructureChange;
    updateBlocksState(convertedBlocks, true, targetStructure);
    setPendingStructureChange(null);
    const structDef = ScreenplayEngine.getStructureDefinition(targetStructure);
    setDriveToast({
      message: `Estructura convertida a "${structDef.shortName}" (Puedes deshacer con Ctrl+Z).`,
    });
    setTimeout(() => setDriveToast(null), 4000);
  };

  // Insert a new hybrid section divider with its own chosen structure
  const handleInsertHybridSection = (sectionStructure: ScriptStructureType) => {
    setOpenMenu(null);
    const structDef = ScreenplayEngine.getStructureDefinition(sectionStructure);
    const sectionCount = blocks.filter((b) => b.type === 'section_divider').length + 1;

    const dividerBlock: ScriptBlock = {
      id: `blk-sec-${Date.now()}`,
      type: 'section_divider',
      text: `Sección ${sectionCount}: ${structDef.shortName}`,
      sectionStructure,
    };

    const firstChildType =
      structDef.defaultFirstBlock === 'section_divider'
        ? 'narration'
        : structDef.defaultFirstBlock;

    const firstChildBlock: ScriptBlock = {
      id: `blk-${Date.now() + 1}`,
      type: firstChildType,
      text: '',
      visualText: firstChildType === 'av_row' ? '' : undefined,
      audioText: firstChildType === 'av_row' ? '' : undefined,
    };

    const nextBlocks = [...blocks];
    nextBlocks.splice(activeBlockIndex + 1, 0, dividerBlock, firstChildBlock);

    // Ensure document structure is set to 'hibrida' when adding hybrid sections
    updateBlocksState(nextBlocks, true, 'hibrida');
    setActiveBlockIndex(activeBlockIndex + 2);
  };

  // Change the structure of an existing Hybrid section divider
  const handleChangeSectionStructure = (
    dividerIndex: number,
    newSectionStruct: ScriptStructureType
  ) => {
    const nextBlocks = [...blocks];
    const current = nextBlocks[dividerIndex];
    if (!current) return;
    nextBlocks[dividerIndex] = {
      ...current,
      sectionStructure: newSectionStruct,
    };
    updateBlocksState(nextBlocks, true);
  };

  // Save a named local snapshot for extra safety
  const handleCreateLocalSnapshot = (label = 'Punto de guardado manual') => {
    const snap: LocalSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      blocks: JSON.parse(JSON.stringify(blocks)),
    };
    const nextSnaps = [snap, ...(activeDocument.snapshots || [])].slice(0, 15);
    onUpdateDocument({
      ...activeDocument,
      snapshots: nextSnaps,
      updatedAt: new Date().toISOString(),
    });
    setDriveToast({ message: 'Versión guardada de forma segura en este dispositivo.' });
    setTimeout(() => setDriveToast(null), 3500);
    setOpenMenu(null);
  };

  // Save directly into Local Directory: Documento/Gerstep/[Categoría]/[Nombre del Guion]/[Archivo]
  const handleSaveToLocalDirectory = async () => {
    setOpenMenu(null);
    try {
      const res = await saveToLocalGerstepDirectory({
        project,
        document: { ...activeDocument, title: docTitle, blocks },
        seasonTitle: activeSeasonTitle,
      });

      onUpdateProject({
        ...project,
        localDirectoryPath: res.savedPath,
      });
      setDriveToast({
        message: `Guardado en directorio local: ${res.savedPath}`,
      });
      setTimeout(() => setDriveToast(null), 5000);
    } catch (e: any) {
      if (e?.message) {
        setDriveToast({ message: e.message, isError: true });
        setTimeout(() => setDriveToast(null), 4000);
      }
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setBlocks(prev);
      onUpdateDocument({
        ...activeDocument,
        blocks: prev,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setBlocks(next);
      onUpdateDocument({
        ...activeDocument,
        blocks: next,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCreateLocalSnapshot('Guardado con Ctrl+S');
      } else if (e.key === 'Escape') {
        setOpenMenu(null);
        setShowPlusMenuAt(null);
        setAutoCompleteSuggestions([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, blocks]);

  const paginatedPages = useMemo(() => {
    return ScreenplayEngine.paginate(blocks);
  }, [blocks]);

  // Handle Google Drive Sync to "Gerstep/Guiones/[Categoría]/[Nombre del Guion]"
  const handleSyncToGoogleDrive = async () => {
    setOpenMenu(null);
    setIsSyncingDrive(true);
    setDriveToast(null);

    try {
      let token = getDriveAccessToken();
      if (!token) {
        const authResult = await googleDriveSignIn();
        if (!authResult) {
          setIsSyncingDrive(false);
          return;
        }
        token = authResult.accessToken;
        if (onGoogleUserConnected) {
          onGoogleUserConnected(authResult.user);
        }
      }

      // 1. Ensure folder hierarchy Gerstep/Guiones/[Categoría]/[Nombre del Guion]/[Temporada X] exists
      const { folderId, fullPath } = await ensureCategoryFolderHierarchy(
        project.category,
        token,
        project.title,
        activeSeasonTitle
      );

      const safeDocName =
        project.category === 'series'
          ? `${project.title.trim()} - ${docTitle.trim()}.fountain`
          : `${project.title.trim()}.fountain`;

      // 2. Check if file already exists in Google Drive (require confirmation before mutating/overwriting)
      const existingFile = await checkExistingScriptFileInDrive(
        safeDocName,
        folderId,
        activeDocument.driveFileId,
        token
      );

      if (existingFile) {
        setPendingDriveOverwrite({
          folderId,
          existingFileId: existingFile.id,
          fileName: safeDocName,
          folderPath: fullPath,
          token,
        });
        setIsSyncingDrive(false);
        return;
      }

      // 3. Create new file in Google Drive
      await executeDriveUpload(folderId, undefined, token, fullPath);
    } catch (err: any) {
      console.error('Error syncing to Google Drive:', err);
      setDriveToast({
        message: err.message || 'No se pudo sincronizar con Google Drive.',
        isError: true,
      });
      setTimeout(() => setDriveToast(null), 5000);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const executeDriveUpload = async (
    folderId: string,
    existingFileId: string | undefined,
    token: string,
    folderPath: string
  ) => {
    setIsSyncingDrive(true);
    setPendingDriveOverwrite(null);
    try {
      const result = await uploadScriptToGoogleDrive({
        project,
        document: { ...activeDocument, title: docTitle, blocks },
        folderId,
        existingFileId,
        token,
        seasonTitle: activeSeasonTitle,
      });

      const nowIso = new Date().toISOString();
      const updatedDoc: ScriptDocument = {
        ...activeDocument,
        title: docTitle,
        blocks,
        driveFileId: result.fileId,
        driveWebViewLink: result.webViewLink,
        driveFolderPath: result.folderPath,
        lastSyncedAt: nowIso,
      };

      onUpdateDocument(updatedDoc);
      onUpdateProject({
        ...project,
        driveFolderId: folderId,
        driveFolderPath: folderPath,
        lastSyncedAt: nowIso,
      });

      setDriveToast({
        message: `Guardado en Google Drive (${result.folderPath})`,
        link: result.webViewLink,
      });
      setTimeout(() => setDriveToast(null), 6000);
    } catch (err: any) {
      setDriveToast({
        message: err.message || 'Error al subir archivo a Google Drive',
        isError: true,
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleBlockChange = (index: number, newText: string) => {
    // Open quick block selector if user types "/" on an empty line
    if (newText === '/') {
      setShowPlusMenuAt(index);
      return;
    }

    if (showPlusMenuAt === index && newText !== '/') {
      setShowPlusMenuAt(null);
    }

    const nextBlocks = [...blocks];
    const current = nextBlocks[index];
    if (!current) return;

    // Autocomplete suggestions
    if (
      current.type === 'character' ||
      current.type === 'interview_subject' ||
      current.type === 'voice_cue'
    ) {
      const query = newText.trim().toUpperCase();
      if (query.length > 0) {
        const matches = project.characters
          .map((c) => c.name)
          .filter((n) => n.startsWith(query) && n !== query);
        setAutoCompleteSuggestions(matches);
      } else {
        setAutoCompleteSuggestions([]);
      }
    } else if (current.type === 'scene_heading') {
      const query = newText.replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '').trim().toUpperCase();
      if (query.length > 1) {
        const matches = project.locations
          .map((l) => l.name)
          .filter((l) => l.includes(query) && l !== query);
        setAutoCompleteSuggestions(matches);
      } else {
        setAutoCompleteSuggestions([]);
      }
    } else {
      setAutoCompleteSuggestions([]);
    }

    nextBlocks[index] = { ...current, text: newText };
    updateBlocksState(nextBlocks, false);
  };

  const handleTwoColumnChange = (
    index: number,
    field: 'visualText' | 'audioText',
    value: string
  ) => {
    const nextBlocks = [...blocks];
    const current = nextBlocks[index];
    if (!current) return;
    nextBlocks[index] = { ...current, [field]: value };
    updateBlocksState(nextBlocks, false);
  };

  const handleChangeBlockType = (index: number, newType: BlockType) => {
    const nextBlocks = [...blocks];
    const current = nextBlocks[index];
    if (!current) return;

    let updatedText = current.text;
    if (
      newType === 'character' ||
      newType === 'scene_heading' ||
      newType === 'transition' ||
      newType === 'segment_header' ||
      newType === 'music_section'
    ) {
      updatedText = updatedText.toUpperCase();
    } else if (newType === 'parenthetical' || newType === 'pause_mark' || newType === 'silence_mark') {
      if (updatedText && !updatedText.startsWith('(') && !updatedText.startsWith('[')) {
        updatedText = `(${updatedText})`;
      }
    }

    nextBlocks[index] = {
      ...current,
      type: newType,
      text: updatedText,
      sectionStructure:
        newType === 'section_divider'
          ? current.sectionStructure || 'cinematografica'
          : current.sectionStructure,
    };
    updateBlocksState(nextBlocks, true);
    setOpenMenu(null);
    setShowPlusMenuAt(null);
    setTimeout(() => {
      blockRefs.current[index]?.focus();
    }, 20);
  };

  const handleInsertNewBlockAfter = (index: number, type: BlockType, defaultText = '') => {
    const newBlock: ScriptBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      text: defaultText,
      visualText: type === 'av_row' ? '' : undefined,
      audioText: type === 'av_row' ? '' : undefined,
      sectionStructure: type === 'section_divider' ? 'voz_en_off' : undefined,
    };
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, newBlock);
    updateBlocksState(nextBlocks, true);
    setActiveBlockIndex(index + 1);
    setOpenMenu(null);
    setShowPlusMenuAt(null);
    setTimeout(() => {
      blockRefs.current[index + 1]?.focus();
    }, 30);
  };

  const handleBlockKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const current = blocks[index];
    if (!current) return;

    const effectiveStruct = ScreenplayEngine.getEffectiveStructureAtBlock(
      blocks,
      index,
      documentStructure
    );

    if (e.key === 'Tab') {
      e.preventDefault();
      const nextType = ScreenplayEngine.cycleBlockTypeOnTab(
        current.type,
        e.shiftKey,
        effectiveStruct
      );
      handleChangeBlockType(index, nextType);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Auto-register character/speaker name if user just finished typing a character block
      if (
        (current.type === 'character' ||
          current.type === 'interview_subject' ||
          current.type === 'voice_cue') &&
        current.text.trim()
      ) {
        const cleanName = current.text.trim().toUpperCase();
        const exists = project.characters.some((c) => c.name.toUpperCase() === cleanName);
        if (!exists) {
          onUpdateProject({
            ...project,
            characters: [
              ...project.characters,
              {
                id: `char-${Date.now()}`,
                name: cleanName,
                description: 'Añadido automáticamente desde el guion',
              },
            ],
          });
        }
      }

      const nextType = ScreenplayEngine.getNextBlockTypeOnEnter(
        current.type,
        effectiveStruct
      );
      handleInsertNewBlockAfter(index, nextType);
      return;
    }

    if (e.key === 'Backspace' && current.text === '') {
      if (blocks.length > 1) {
        e.preventDefault();
        const filtered = blocks.filter((_, i) => i !== index);
        updateBlocksState(filtered, true);
        const targetIdx = Math.max(0, index - 1);
        setActiveBlockIndex(targetIdx);
        setTimeout(() => {
          blockRefs.current[targetIdx]?.focus();
        }, 30);
      }
      return;
    }

    if (e.key === 'ArrowUp' && (e.currentTarget.selectionStart === 0 || e.ctrlKey)) {
      if (index > 0) {
        e.preventDefault();
        setActiveBlockIndex(index - 1);
        blockRefs.current[index - 1]?.focus();
      }
    } else if (
      e.key === 'ArrowDown' &&
      (e.currentTarget.selectionStart === current.text.length || e.ctrlKey)
    ) {
      if (index < blocks.length - 1) {
        e.preventDefault();
        setActiveBlockIndex(index + 1);
        blockRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleJumpToScene = (blockIndex: number) => {
    setActiveBlockIndex(blockIndex);
    const el = blockRefs.current[blockIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const handleMoveScene = (fromIndex: number, direction: 'up' | 'down') => {
    const scenes = ScreenplayEngine.extractScenes(blocks);
    const sceneIdx = scenes.findIndex((s) => s.index === fromIndex);
    if (sceneIdx === -1) return;

    const targetSceneIdx = direction === 'up' ? sceneIdx - 1 : sceneIdx + 1;
    if (targetSceneIdx < 0 || targetSceneIdx >= scenes.length) return;

    const currentScene = scenes[sceneIdx];
    const nextScene = scenes[sceneIdx + 1];
    const currentEnd = nextScene ? nextScene.index : blocks.length;

    const currentBlocks = blocks.slice(currentScene.index, currentEnd);
    const remaining = blocks.filter((_, idx) => idx < currentScene.index || idx >= currentEnd);

    const targetScene = scenes[targetSceneIdx];
    let insertAt = targetScene.index;
    if (direction === 'down') {
      const afterTargetScene = scenes[targetSceneIdx + 1];
      insertAt = afterTargetScene
        ? afterTargetScene.index - currentBlocks.length
        : remaining.length;
    }

    remaining.splice(insertAt, 0, ...currentBlocks);
    updateBlocksState(remaining, true);
  };

  const handleUpdateCharacter = (
    updatedChar: Character,
    updateInScript = false,
    oldName?: string
  ) => {
    const nextChars = project.characters.map((c) => (c.id === updatedChar.id ? updatedChar : c));
    let nextBlocks = [...blocks];

    if (updateInScript && oldName && oldName !== updatedChar.name) {
      nextBlocks = nextBlocks.map((b) => {
        if (
          (b.type === 'character' ||
            b.type === 'interview_subject' ||
            b.type === 'voice_cue') &&
          b.text.trim().toUpperCase() === oldName.trim().toUpperCase()
        ) {
          return { ...b, text: updatedChar.name };
        }
        return b;
      });
      updateBlocksState(nextBlocks, true);
    }

    onUpdateProject({
      ...project,
      characters: nextChars,
      documents: project.documents.map((d) =>
        d.id === activeDocument.id ? { ...d, blocks: nextBlocks } : d
      ),
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const current = blocks[activeBlockIndex];
    if (!current) return;

    let updatedText = suggestion;
    if (current.type === 'scene_heading') {
      const prefix = current.text.match(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i)?.[0] || 'INT. ';
      updatedText = `${prefix}${suggestion} - DÍA`;
    }

    const nextBlocks = [...blocks];
    nextBlocks[activeBlockIndex] = { ...current, text: updatedText };
    updateBlocksState(nextBlocks, true);
    setAutoCompleteSuggestions([]);
  };

  const currentActiveBlock = blocks[activeBlockIndex] || blocks[0];
  const currentBlockDef = ScreenplayEngine.getBlockDefinition(
    currentActiveBlock?.type || 'paragraph'
  );

  const targetDriveFolder = getTargetDrivePath(
    project.category,
    project.title,
    activeSeasonTitle
  );
  const targetLocalFolder = getTargetLocalDirectoryPath(
    project.category,
    project.title,
    activeSeasonTitle
  );

  // CSS styling helper for any BlockType across all 11 structures
  const getBlockVisualClasses = (type: BlockType) => {
    switch (type) {
      case 'scene_heading':
      case 'segment_header':
      case 'music_section':
        return 'pt-4 font-bold uppercase tracking-wide text-slate-900 dark:text-white border-b border-slate-200/70 dark:border-neutral-800 pb-1';
      case 'heading_1':
        return 'pt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white';
      case 'heading_2':
      case 'situation':
        return 'pt-3 text-sm font-bold text-slate-800 dark:text-neutral-200';
      case 'character':
      case 'interview_subject':
      case 'voice_cue':
        return 'pt-3 uppercase font-bold text-center pl-16 pr-16';
      case 'dialogue':
      case 'voice_over':
      case 'off_screen':
      case 'testimony':
      case 'host_cue':
      case 'guest_cue':
        return 'pl-20 pr-20 text-left';
      case 'parenthetical':
      case 'pause_mark':
      case 'silence_mark':
        return 'pl-28 pr-28 text-center italic opacity-75 text-[11pt]';
      case 'transition':
        return 'pt-3 font-bold uppercase text-right pr-4';
      case 'twist':
      case 'punchline':
      case 'emphasis':
        return 'pt-2 font-semibold bg-amber-500/10 border-l-2 border-amber-500 pl-3 py-1 rounded-r';
      case 'visual_desc':
      case 'screen_action':
      case 'demonstration':
      case 'archive_footage':
      case 'reenactment':
      case 'visual_resource':
      case 'choreography':
      case 'shot':
        return 'pt-1.5 text-blue-950 dark:text-blue-200 bg-blue-500/5 border-l-2 border-blue-500/60 pl-3 py-1 rounded-r';
      case 'music_cue':
      case 'sfx_cue':
      case 'ambience_cue':
      case 'duration_mark':
      case 'timecode_mark':
        return 'pt-1.5 font-mono text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300 bg-purple-500/5 border-l-2 border-purple-500/50 pl-3 py-1 rounded-r';
      case 'note_block':
      case 'research_note':
      case 'production_note':
      case 'source_ref':
        return 'pt-1.5 text-xs italic bg-slate-100 dark:bg-neutral-800/70 border-l-2 border-slate-400 pl-3 py-1.5 rounded-r';
      case 'list_item':
        return 'pl-6 pt-1';
      default:
        return 'pt-1 leading-relaxed';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 overflow-hidden select-none transition-colors duration-200">
      {/* Google Docs / Word Style Top Menu & Formatting Ribbon */}
      {!isDistractionFree && (
        <div
          ref={menuContainerRef}
          className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 shrink-0 z-30 shadow-2xs transition-colors duration-200"
        >
          {/* Row 1: Document Title, Classic Dropdown Menu Bar (Archivo, Insertar, Formato, Herramientas) & Drive Sync */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-2.5 pb-1.5">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => {
                      setDocTitle(e.target.value);
                      onUpdateDocument({ ...activeDocument, title: e.target.value });
                    }}
                    aria-label="Título del documento"
                    className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-blue-500 rounded px-1.5 py-0.5 focus:outline-none max-w-[240px] truncate transition-colors"
                  />
                  <span
                    className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono hidden md:inline bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded"
                    title={`Ruta Local: ${targetLocalFolder} | Ruta Drive: ${targetDriveFolder}`}
                  >
                    {targetDriveFolder}
                  </span>
                </div>

                {/* Classic Word / Google Docs Menu Bar */}
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-600 dark:text-neutral-300">
                  {/* ARCHIVO */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                      className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ${
                        openMenu === 'file' ? 'bg-slate-100 dark:bg-neutral-800 font-medium' : ''
                      }`}
                    >
                      Archivo
                    </button>
                    <AnimatePresence>
                      {openMenu === 'file' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-1 w-72 py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                        >
                          <button
                            onClick={() => handleCreateLocalSnapshot('Guardado manual')}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <span>Guardar versión local en navegador</span>
                            <span className="text-[10px] font-mono text-slate-400">Ctrl+S</span>
                          </button>
                          <button
                            onClick={handleSaveToLocalDirectory}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-emerald-700 dark:text-emerald-400 font-medium"
                          >
                            <div>
                              <div>Guardar en carpeta local del equipo</div>
                              <div className="text-[10px] font-mono opacity-75 truncate max-w-[210px]">
                                {targetLocalFolder}
                              </div>
                            </div>
                            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                          </button>
                          <button
                            onClick={handleSyncToGoogleDrive}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-blue-600 dark:text-blue-400 font-medium"
                          >
                            <div>
                              <div>Guardar en Google Drive</div>
                              <div className="text-[10px] font-mono opacity-75 truncate max-w-[210px]">
                                {targetDriveFolder}
                              </div>
                            </div>
                            <CloudUpload className="w-3.5 h-3.5 shrink-0" />
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              setIsExportOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <span>Descargar o Importar (PDF, TXT, Fountain)...</span>
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                          <button
                            onClick={() => onNavigateToView('library')}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-slate-500"
                          >
                            <span>Volver a Mis Guiones</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* INSERTAR */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'insert' ? null : 'insert')}
                      className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ${
                        openMenu === 'insert' ? 'bg-slate-100 dark:bg-neutral-800 font-medium' : ''
                      }`}
                    >
                      Insertar
                    </button>
                    <AnimatePresence>
                      {openMenu === 'insert' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-1 w-72 max-h-96 overflow-y-auto py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                        >
                          <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Bloques de {effectiveStructureDef.shortName}
                          </div>
                          {allowedBlockDefsAtCursor.map((item) => (
                            <button
                              key={item.type}
                              onClick={() => handleInsertNewBlockAfter(activeBlockIndex, item.type)}
                              className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                            >
                              <div>
                                <div className="font-medium text-slate-800 dark:text-neutral-200">
                                  {item.label}
                                </div>
                                <div className="text-[10px] text-slate-400">{item.hint}</div>
                              </div>
                              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded shrink-0">
                                {item.shortLabel}
                              </span>
                            </button>
                          ))}
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                          <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Sección Híbrida (Combinar Estructuras)
                          </div>
                          <button
                            onClick={() => handleInsertHybridSection('voz_en_off')}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-neutral-800 text-left text-amber-700 dark:text-amber-300 font-medium"
                          >
                            <SplitSquareVertical className="w-3.5 h-3.5 shrink-0" />
                            <span>+ Añadir nueva sección con otra estructura</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* FORMATO Y ESTRUCTURA */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'format' ? null : 'format')}
                      className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ${
                        openMenu === 'format' ? 'bg-slate-100 dark:bg-neutral-800 font-medium' : ''
                      }`}
                    >
                      Formato y Estructura
                    </button>
                    <AnimatePresence>
                      {openMenu === 'format' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-1 w-80 max-h-[420px] overflow-y-auto py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                        >
                          <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Cambiar Estructura del Guion (Conserva tu texto)
                          </div>
                          {STRUCTURES_CATALOG.map((struct) => {
                            const isSelected = documentStructure === struct.id;
                            return (
                              <button
                                key={struct.id}
                                onClick={() => handleRequestStructureChange(struct.id)}
                                className="w-full flex items-start justify-between gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                              >
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-neutral-200">
                                    {struct.code}. {struct.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {struct.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })}
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                          <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Color de la Hoja en Modo Oscuro
                          </div>
                          <button
                            onClick={() => {
                              setPaperAppearance('white');
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <span>Hoja Blanca Clásica (Como papel real)</span>
                            {paperAppearance === 'white' && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setPaperAppearance('adaptive');
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <span>Hoja Oscura (Descanso nocturno)</span>
                            {paperAppearance === 'adaptive' && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* HERRAMIENTAS / AYUDA */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
                      className={`px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ${
                        openMenu === 'tools' ? 'bg-slate-100 dark:bg-neutral-800 font-medium' : ''
                      }`}
                    >
                      Asistente y Metodología
                    </button>
                    <AnimatePresence>
                      {openMenu === 'tools' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-1 w-64 py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                        >
                          <button
                            onClick={() => {
                              setShowMethodologyGuide(!showMethodologyGuide);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left font-medium text-emerald-700 dark:text-emerald-400"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Guía de Metodología Narrativa</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAssistantDrawer(!showAssistantDrawer);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left font-medium text-blue-600 dark:text-blue-400"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Escribir escena paso a paso</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsAiModalOpen(true);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Sugerencias creativas con IA</span>
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                          <button
                            onClick={() => {
                              onNavigateToView('characters');
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ver fichas de personajes</span>
                          </button>
                          <button
                            onClick={() => {
                              onNavigateToView('supplementary');
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ver resumen e ideas del proyecto</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Actions: Local History, Google Drive Sync & Download */}
            <div className="flex items-center gap-2">
              {/* Local Snapshot History Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'snapshots' ? null : 'snapshots')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Ver historial de guardado seguro en este dispositivo"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Guardado seguro</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                <AnimatePresence>
                  {openMenu === 'snapshots' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 top-full mt-1 w-72 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Protección Local Activa
                        </span>
                        <button
                          onClick={() => handleCreateLocalSnapshot('Copia manual')}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          + Crear punto ahora
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                        Directorio local asignado:{' '}
                        <code className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          {targetLocalFolder}
                        </code>
                      </p>
                      <button
                        onClick={handleSaveToLocalDirectory}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Guardar archivo en carpeta local</span>
                      </button>

                      {activeDocument.snapshots && activeDocument.snapshots.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 max-h-40 overflow-y-auto space-y-1">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">
                            Versiones recuperables:
                          </div>
                          {activeDocument.snapshots.map((snap) => (
                            <div
                              key={snap.id}
                              className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-neutral-800"
                            >
                              <div>
                                <div className="font-medium text-slate-700 dark:text-neutral-200">
                                  {snap.label}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {new Date(snap.timestamp).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  updateBlocksState(snap.blocks, true);
                                  setOpenMenu(null);
                                }}
                                className="px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium"
                              >
                                Restaurar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Google Drive Sync Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSyncToGoogleDrive}
                disabled={isSyncingDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                title={`Sincronizar en Google Drive: ${targetDriveFolder}`}
              >
                <CloudUpload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{isSyncingDrive ? 'Sincronizando...' : 'Guardar en Drive'}</span>
              </motion.button>

              {activeDocument.driveWebViewLink && (
                <a
                  href={activeDocument.driveWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver archivo en Google Drive"
                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Export / PDF Button */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>

          {/* Row 2: Clean Google Docs / Word Formatting Toolbar */}
          <div className="flex items-center justify-between gap-2 px-5 py-1.5 bg-slate-50 dark:bg-neutral-900/80 border-t border-slate-200/80 dark:border-neutral-800/80 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Index Sidebar */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800 transition-colors"
                title={isSidebarOpen ? 'Ocultar índice lateral' : 'Mostrar índice lateral'}
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Índice</span>
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-neutral-700" />

              {/* Undo / Redo */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800 disabled:opacity-30 rounded-md transition-colors"
                  title="Deshacer (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800 disabled:opacity-30 rounded-md transition-colors"
                  title="Rehacer (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-neutral-700" />

              {/* Zoom Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'zoom' ? null : 'zoom')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 font-mono text-[11px] hover:border-slate-300"
                >
                  <span>{zoom}%</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                <AnimatePresence>
                  {openMenu === 'zoom' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute left-0 top-full mt-1 w-28 py-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 text-xs font-mono"
                    >
                      {[75, 90, 100, 115, 125].map((z) => (
                        <button
                          key={z}
                          onClick={() => {
                            setZoom(z);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-between"
                        >
                          <span>{z}%</span>
                          {zoom === z && <Check className="w-3 h-3 text-blue-600" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Structure Selector Pill (A-K) */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'structure' ? null : 'structure')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold hover:border-blue-400 transition-colors"
                  title="Cambiar estructura de escritura o insertar sección híbrida"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Estructura {documentStructureDef.code}: {documentStructureDef.shortName}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                <AnimatePresence>
                  {openMenu === 'structure' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute left-0 top-full mt-1 w-80 max-h-96 overflow-y-auto py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                    >
                      <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Modalidad de Estructura del Guion (A–K)
                      </div>
                      {STRUCTURES_CATALOG.map((struct) => {
                        const isCurrent = documentStructure === struct.id;
                        return (
                          <button
                            key={struct.id}
                            onClick={() => handleRequestStructureChange(struct.id)}
                            className={`w-full flex items-start justify-between gap-2 px-3.5 py-2 text-left transition-colors ${
                              isCurrent
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">
                                {struct.code}. {struct.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {struct.description}
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                      <button
                        onClick={() => handleInsertHybridSection('cinematografica')}
                        className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-neutral-800 text-amber-700 dark:text-amber-300 font-semibold text-left"
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        <span>+ Dividir e insertar sección con otra estructura</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Structure-Aware Block Type Selector */}
              {documentStructure !== 'audiovisual_tecnico' && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === 'style' ? null : 'style')}
                    className="flex items-center justify-between gap-3 px-3 py-1 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-100 font-medium hover:border-blue-500 transition-colors min-w-[210px]"
                    title="Cambiar qué tipo de bloque estás escribiendo (También puedes pulsar Tab)"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        {currentBlockDef.shortLabel}
                      </span>
                      <span className="truncate">{currentBlockDef.label}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  <AnimatePresence>
                    {openMenu === 'style' && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute left-0 top-full mt-1 w-76 max-h-96 overflow-y-auto py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs"
                      >
                        <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Bloques de {effectiveStructureDef.shortName} (Atajo: Tab)
                        </div>
                        {allowedBlockDefsAtCursor.map((style) => {
                          const isCurrent = currentActiveBlock?.type === style.type;
                          return (
                            <button
                              key={style.type}
                              onClick={() => handleChangeBlockType(activeBlockIndex, style.type)}
                              className={`w-full flex items-start justify-between gap-2.5 px-3.5 py-2 text-left transition-colors ${
                                isCurrent
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2">
                                  <span>{style.label}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-neutral-400">
                                  {style.hint}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 shrink-0">
                                {style.shortLabel}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Optional Narrative Methodology Guide Pill */}
              <button
                onClick={() => setShowMethodologyGuide(!showMethodologyGuide)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  showMethodologyGuide
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
                title="Abrir o cerrar guía de metodología narrativa opcional"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {activeMethodology.id !== 'none'
                    ? `Guía: ${activeMethodology.name.split(' ')[0]}...`
                    : 'Guía Narrativa'}
                </span>
              </button>

              {/* Step-by-step Beginner Assistant Pill */}
              <button
                onClick={() => setShowAssistantDrawer(!showAssistantDrawer)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  showAssistantDrawer
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Asistente paso a paso</span>
              </button>
            </div>

            {/* Right side of formatting toolbar: Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDistractionFree(true)}
                className="p-1.5 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded-md transition-colors"
                title="Pantalla completa de lectura y escritura"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Google Drive & Local Snapshots */}
      <AnimatePresence>
        {driveToast && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed top-16 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium ${
              driveToast.isError
                ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <span>{driveToast.message}</span>
            {driveToast.link && (
              <a
                href={driveToast.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-1"
              >
                <span>Abrir en Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Collapsible Outline / Index Sidebar */}
        <AnimatePresence initial={false}>
          {!isDistractionFree && isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-slate-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 shrink-0 overflow-hidden"
            >
              <div className="flex items-center p-1.5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs">
                <button
                  onClick={() => setSidebarTab('scenes')}
                  className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors ${
                    sidebarTab === 'scenes'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Índice
                </button>
                <button
                  onClick={() => setSidebarTab('characters')}
                  className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors ${
                    sidebarTab === 'characters'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Voces/Personajes ({project.characters.length})
                </button>
                {project.category === 'series' && (
                  <button
                    onClick={() => setSidebarTab('episodes')}
                    className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors ${
                      sidebarTab === 'episodes'
                        ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Capítulos
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                {sidebarTab === 'scenes' && (
                  <SceneNavigator
                    blocks={blocks}
                    selectedBlockIndex={activeBlockIndex}
                    onJumpToScene={handleJumpToScene}
                    onMoveScene={handleMoveScene}
                    onUpdateSceneNote={(idx, note) => {
                      const next = [...blocks];
                      next[idx] = { ...next[idx], notes: note };
                      updateBlocksState(next, true);
                    }}
                  />
                )}

                {sidebarTab === 'characters' && (
                  <CharactersPanel
                    characters={project.characters}
                    currentBlocks={blocks}
                    onAddCharacter={(char) => {
                      const newChar: Character = {
                        ...char,
                        id: `char-${Date.now()}`,
                      };
                      onUpdateProject({
                        ...project,
                        characters: [...project.characters, newChar],
                      });
                    }}
                    onUpdateCharacter={handleUpdateCharacter}
                    onDeleteCharacter={(id) => {
                      onUpdateProject({
                        ...project,
                        characters: project.characters.filter((c) => c.id !== id),
                      });
                    }}
                    onSelectCharacterToInsert={(name) => {
                      handleInsertNewBlockAfter(activeBlockIndex, 'character', name);
                    }}
                  />
                )}

                {sidebarTab === 'episodes' && project.category === 'series' && (
                  <div className="p-3 overflow-y-auto space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        Temporadas y Capítulos
                      </span>
                      <button
                        onClick={() => {
                          if (!project.seasons || project.seasons.length === 0) return;
                          const firstSeason = project.seasons[0];
                          const nextEpNum = firstSeason.episodes.length + 1;
                          const defaultStruct =
                            project.defaultStructure || activeDocument.templateType || 'cinematografica';
                          const newEp: ScriptDocument = {
                            id: `ep-${Date.now()}`,
                            projectId: project.id,
                            seasonId: firstSeason.id,
                            episodeNumber: nextEpNum,
                            title: `Capítulo ${nextEpNum}`,
                            templateType: defaultStruct,
                            methodologyId: project.methodologyId,
                            blocks: ScreenplayEngine.getInitialBlocksForStructure(defaultStruct),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          const updatedSeasons = project.seasons.map((s, idx) =>
                            idx === 0 ? { ...s, episodes: [...s.episodes, newEp] } : s
                          );
                          onUpdateProject({ ...project, seasons: updatedSeasons });
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        + Nuevo capítulo
                      </button>
                    </div>

                    {project.seasons?.map((season) => (
                      <div key={season.id} className="space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-neutral-200 text-xs px-2 py-1 bg-slate-100 dark:bg-neutral-800/50 rounded">
                          {season.title}
                        </div>
                        <div className="pl-2 space-y-1">
                          {season.episodes.map((ep) => (
                            <button
                              key={ep.id}
                              onClick={() => onUpdateDocument(ep)}
                              className={`w-full text-left p-2 rounded-lg transition-colors text-xs ${
                                ep.id === activeDocument.id
                                  ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 font-semibold'
                                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800/40'
                              }`}
                            >
                              {ep.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Central Google Docs / Word Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-slate-100 dark:bg-neutral-950 relative transition-colors duration-200">
          {isDistractionFree && (
            <button
              onClick={() => setIsDistractionFree(false)}
              className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-200 shadow-md"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Mostrar barra de herramientas</span>
            </button>
          )}

          {/* Non-Intrusive Optional Narrative Methodology Guide Panel */}
          <AnimatePresence>
            {showMethodologyGuide && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-[8.5in] mb-6 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 shadow-md text-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Guía de Metodología Narrativa (Opcional y No Intrusiva)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeMethodologyId}
                      onChange={(e) => {
                        const nextId = e.target.value as NarrativeMethodologyId;
                        onUpdateDocument({
                          ...activeDocument,
                          methodologyId: nextId,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-800 dark:text-neutral-200"
                    >
                      {NARRATIVE_METHODOLOGIES.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id === 'none' ? m.name : `[${m.categoryLabel}] ${m.name}`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowMethodologyGuide(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeMethodology.id === 'none' ? (
                  <p className="text-slate-500 dark:text-neutral-400">
                    Estás en escritura libre sin metodología activa. Si deseas consultar una estructura narrativa de apoyo (Tres Actos, Viaje del Héroe, Tramas A/B/C, Gancho-Desarrollo, AIDA, etc.) sin alterar tu guion, selecciónala en el desplegable superior.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-slate-600 dark:text-neutral-300">
                      {activeMethodology.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {activeMethodology.stages.map((stage, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1"
                        >
                          <div className="font-bold text-emerald-900 dark:text-emerald-300">
                            {stage.title}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                            {stage.guidance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step-by-step Guided Assistant Drawer */}
          <AnimatePresence>
            {showAssistantDrawer && (
              <div className="w-full max-w-[8.5in] mb-6">
                <GuidedAssistant
                  existingCharacters={project.characters}
                  existingLocations={project.locations}
                  onInsertBlocks={(newBlocks) => {
                    const updated = [...blocks];
                    updated.splice(activeBlockIndex + 1, 0, ...newBlocks);
                    updateBlocksState(updated, true);
                    setActiveBlockIndex(activeBlockIndex + newBlocks.length);
                  }}
                  onClose={() => setShowAssistantDrawer(false)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Paper Container with Zoom */}
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="flex flex-col items-center gap-8 pb-36"
          >
            {documentStructure === 'audiovisual_tecnico' ? (
              /* Structure E: Full Two-Column Audio/Video Document Sheet */
              <div
                className={`screenplay-page ${
                  paperAppearance === 'adaptive' ? 'page-adaptive' : ''
                } min-w-[8.5in] rounded-sm p-8`}
              >
                <div className="text-center pb-4 border-b border-slate-200 dark:border-neutral-700/60 mb-6">
                  <h2 className="font-bold text-lg font-mono uppercase tracking-wider">
                    {docTitle}
                  </h2>
                  <p className="text-xs opacity-60 font-mono mt-0.5">
                    Estructura E: Guion Audiovisual Técnico (Dos Columnas VIDEO / AUDIO)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-300 dark:border-neutral-700 font-bold text-xs uppercase text-blue-600 dark:text-blue-400 font-mono">
                  <div>VIDEO (Imagen / Cámara / Acción Visual)</div>
                  <div>AUDIO (Narración / Diálogo / Música / Efectos)</div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-neutral-800">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className="py-4 grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <textarea
                          rows={Math.max(
                            3,
                            Math.ceil((block.visualText || block.text).length / 35)
                          )}
                          value={block.visualText ?? block.text}
                          onFocus={() => setActiveBlockIndex(idx)}
                          onChange={(e) => handleTwoColumnChange(idx, 'visualText', e.target.value)}
                          placeholder="Describe la imagen, plano o acción visual..."
                          className="w-full bg-transparent resize-none focus:outline-none focus:bg-blue-50/40 dark:focus:bg-neutral-800/30 p-2 rounded leading-relaxed"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={Math.max(3, Math.ceil((block.audioText || '').length / 35))}
                          value={block.audioText || ''}
                          onFocus={() => setActiveBlockIndex(idx)}
                          onChange={(e) => handleTwoColumnChange(idx, 'audioText', e.target.value)}
                          placeholder="Escribe la locución, diálogo, música o SFX..."
                          className="w-full bg-transparent resize-none focus:outline-none focus:bg-blue-50/40 dark:focus:bg-neutral-800/30 p-2 rounded leading-relaxed border-l border-slate-200 dark:border-neutral-800 pl-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => handleInsertNewBlockAfter(blocks.length - 1, 'av_row')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir fila VIDEO / AUDIO</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Paginated US Letter Sheets supporting all structures (A-K) and Hybrid sections */
              paginatedPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className={`screenplay-page ${
                    paperAppearance === 'adaptive' ? 'page-adaptive' : ''
                  } rounded-xs relative select-text`}
                >
                  {page.pageNumber > 1 && (
                    <div className="absolute top-8 right-12 text-xs font-script opacity-50">
                      {page.pageNumber}.
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {page.blocks.map((block) => {
                      const globalIndex = blocks.findIndex((b) => b.id === block.id);
                      const isFocused = activeBlockIndex === globalIndex;
                      const blockDef = ScreenplayEngine.getBlockDefinition(block.type);
                      const allowedAtThisBlock = ScreenplayEngine.getAllowedBlocksForPosition(
                        blocks,
                        globalIndex,
                        documentStructure
                      );

                      // Render Hybrid Section Divider with inline structure selector
                      if (block.type === 'section_divider') {
                        const secStruct = normalizeStructureType(
                          block.sectionStructure || 'cinematografica'
                        );
                        return (
                          <div
                            key={block.id}
                            className="my-4 p-3 rounded-xl bg-amber-50/80 dark:bg-neutral-800/80 border border-amber-300/70 dark:border-amber-700/50 font-ui"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <SplitSquareVertical className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <input
                                  type="text"
                                  value={block.text}
                                  onFocus={() => setActiveBlockIndex(globalIndex)}
                                  onChange={(e) => handleBlockChange(globalIndex, e.target.value)}
                                  placeholder="Título de la sección (Ej: Introducción en Voz en Off)"
                                  className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-500 dark:text-neutral-400">
                                  Estructura de esta sección:
                                </span>
                                <select
                                  value={secStruct}
                                  onChange={(e) =>
                                    handleChangeSectionStructure(
                                      globalIndex,
                                      e.target.value as ScriptStructureType
                                    )
                                  }
                                  className="px-2 py-1 rounded-md bg-white dark:bg-neutral-900 border border-amber-300 dark:border-neutral-700 text-xs font-semibold text-amber-900 dark:text-amber-300 focus:outline-none"
                                >
                                  {STRUCTURES_CATALOG.filter((s) => s.id !== 'hibrida').map(
                                    (s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.code}. {s.shortName}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Render inline Two-Column row (e.g. inside a Hybrid script)
                      if (block.type === 'av_row') {
                        return (
                          <div
                            key={block.id}
                            className="my-2 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 grid grid-cols-2 gap-4 text-xs font-mono relative group"
                          >
                            <div>
                              <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">
                                VIDEO (Imagen)
                              </div>
                              <textarea
                                rows={Math.max(
                                  2,
                                  Math.ceil((block.visualText || block.text).length / 32)
                                )}
                                value={block.visualText ?? block.text}
                                onFocus={() => setActiveBlockIndex(globalIndex)}
                                onChange={(e) =>
                                  handleTwoColumnChange(globalIndex, 'visualText', e.target.value)
                                }
                                placeholder="Acción o imagen en pantalla..."
                                className="w-full bg-transparent resize-none focus:outline-none"
                              />
                            </div>
                            <div className="border-l border-slate-200 dark:border-neutral-800 pl-3">
                              <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 mb-1">
                                AUDIO (Voz / Sonido)
                              </div>
                              <textarea
                                rows={Math.max(2, Math.ceil((block.audioText || '').length / 32))}
                                value={block.audioText || ''}
                                onFocus={() => setActiveBlockIndex(globalIndex)}
                                onChange={(e) =>
                                  handleTwoColumnChange(globalIndex, 'audioText', e.target.value)
                                }
                                placeholder="Narración, diálogo o efectos..."
                                className="w-full bg-transparent resize-none focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={block.id}
                          className={`relative group ${getBlockVisualClasses(block.type)}`}
                        >
                          {/* Interactive Left Margin Control (Click to change block style or insert) */}
                          <div
                            className={`absolute -left-24 top-1 flex items-center gap-1 transition-opacity ${
                              isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setShowPlusMenuAt(
                                  showPlusMenuAt === globalIndex ? null : globalIndex
                                )
                              }
                              title="Haz clic para cambiar el tipo de bloque o insertar sección"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-ui font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{blockDef.shortLabel}</span>
                            </button>
                          </div>

                          {/* Floating Quick Block Selector Menu (on clicking + or typing /) */}
                          <AnimatePresence>
                            {showPlusMenuAt === globalIndex && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                className="absolute left-0 top-full mt-1 z-40 w-76 max-h-80 overflow-y-auto py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl font-ui text-xs text-slate-800 dark:text-neutral-100"
                              >
                                <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                                  <span>Bloques disponibles en esta sección</span>
                                  <button
                                    onClick={() => setShowPlusMenuAt(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {allowedAtThisBlock.map((item) => (
                                  <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => handleChangeBlockType(globalIndex, item.type)}
                                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2 hover:bg-blue-50 dark:hover:bg-neutral-800 text-left transition-colors"
                                  >
                                    <div>
                                      <div className="font-semibold">{item.label}</div>
                                      <div className="text-[10px] text-slate-400">{item.hint}</div>
                                    </div>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shrink-0">
                                      {item.shortLabel}
                                    </span>
                                  </button>
                                ))}
                                <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPlusMenuAt(null);
                                    handleInsertHybridSection('voz_en_off');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50 dark:hover:bg-neutral-800 text-left text-amber-700 dark:text-amber-300 font-semibold"
                                >
                                  <SplitSquareVertical className="w-3.5 h-3.5" />
                                  <span>+ Nueva sección con otra estructura (Híbrido)</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <textarea
                            ref={(el) => {
                              blockRefs.current[globalIndex] = el;
                            }}
                            rows={Math.max(1, Math.ceil(block.text.length / 55))}
                            value={block.text}
                            onFocus={() => setActiveBlockIndex(globalIndex)}
                            onChange={(e) => handleBlockChange(globalIndex, e.target.value)}
                            onKeyDown={(e) => handleBlockKeyDown(globalIndex, e)}
                            placeholder={blockDef.placeholder}
                            className={`w-full bg-transparent ${
                              documentStructure === 'estandar_flexible' ? 'font-ui' : 'font-script'
                            } resize-none focus:outline-none focus:bg-blue-500/5 rounded-xs transition-colors overflow-hidden ${
                              block.type === 'character' ||
                              block.type === 'interview_subject' ||
                              block.type === 'voice_cue' ||
                              block.type === 'parenthetical' ||
                              block.type === 'pause_mark' ||
                              block.type === 'silence_mark'
                                ? 'text-center'
                                : block.type === 'transition'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          />

                          {/* Autocomplete Popup */}
                          {isFocused && autoCompleteSuggestions.length > 0 && (
                            <div className="absolute left-1/4 top-full mt-1 z-30 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl py-1 text-xs font-mono text-left w-56 text-slate-800 dark:text-neutral-200">
                              <div className="px-3 py-1 text-[10px] text-slate-400 uppercase font-ui">
                                Autocompletar:
                              </div>
                              {autoCompleteSuggestions.map((sug) => (
                                <button
                                  key={sug}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(sug)}
                                  className="w-full px-3 py-1.5 text-left hover:bg-blue-600 hover:text-white transition-colors"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gentle Non-Intrusive Bottom Helper Bar */}
          {!isDistractionFree && (
            <div className="fixed bottom-4 right-6 z-20 hidden lg:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-neutral-900/95 border border-slate-200 dark:border-neutral-800 shadow-md text-[11px] text-slate-600 dark:text-neutral-400 backdrop-blur-xs">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {effectiveStructureDef.shortName}
              </span>
              <span>·</span>
              <span>
                <strong>Enter</strong>: Siguiente bloque lógico
              </span>
              <span>·</span>
              <span>
                <strong>Tab</strong>: Alternar bloque en esta estructura
              </span>
              <span>·</span>
              <span>
                <strong>/</strong>: Menú de bloques
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Preview & Confirmation Modal for Ambiguous Structure Conversion (e.g. 1-col <-> 2-col) */}
      <AnimatePresence>
        {pendingStructureChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vista previa de conversión de estructura
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                {pendingStructureChange.summary}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/70 border border-slate-200 dark:border-neutral-700 max-h-48 overflow-y-auto space-y-2 text-xs font-mono">
                <div className="text-[10px] font-sans font-semibold uppercase text-slate-400">
                  Muestra de adaptación ({pendingStructureChange.convertedBlocks.length} bloques conservados):
                </div>
                {pendingStructureChange.convertedBlocks.slice(0, 4).map((b, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 text-[11px]"
                  >
                    {b.type === 'av_row' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-blue-600 font-bold">VIDEO:</span>{' '}
                          {b.visualText || '(Vacío)'}
                        </div>
                        <div>
                          <span className="text-purple-600 font-bold">AUDIO:</span>{' '}
                          {b.audioText || '(Vacío)'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-blue-600 font-bold">
                          [{ScreenplayEngine.getBlockDefinition(b.type).shortLabel}]:
                        </span>{' '}
                        {b.text || '(Línea en blanco)'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                No se eliminará ninguna palabra y podrás revertir el cambio en cualquier momento con{' '}
                <strong>Ctrl+Z</strong>.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPendingStructureChange(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmStructureConversion}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Aplicar conversión segura
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Confirmation Dialog for Updating Existing File in Google Drive */}
      <AnimatePresence>
        {pendingDriveOverwrite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <CloudUpload className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirmar actualización en Google Drive
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                El archivo{' '}
                <strong className="text-slate-900 dark:text-white">
                  "{pendingDriveOverwrite.fileName}"
                </strong>{' '}
                ya existe en tu carpeta de Google Drive{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 font-mono">
                  {pendingDriveOverwrite.folderPath}
                </code>
                . ¿Deseas sobrescribirlo y actualizarlo con el contenido actual de tu guion?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPendingDriveOverwrite(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    executeDriveUpload(
                      pendingDriveOverwrite.folderId,
                      pendingDriveOverwrite.existingFileId,
                      pendingDriveOverwrite.token,
                      pendingDriveOverwrite.folderPath
                    )
                  }
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Confirmar y Actualizar en Drive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export / Import Modal */}
      {isExportOpen && (
        <ExportModal
          blocks={blocks}
          projectTitle={docTitle}
          projectAuthor={project.author}
          onImportBlocks={(imported, replace) => {
            const next = replace ? imported : [...blocks, ...imported];
            updateBlocksState(next, true);
          }}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* AI Creative Assistant Modal */}
      {isAiModalOpen && (
        <AiAssistantModal
          characters={project.characters}
          currentBlocks={blocks}
          onApplySceneBlocks={(newBlocks) => {
            const next = [...blocks];
            next.splice(activeBlockIndex + 1, 0, ...newBlocks);
            updateBlocksState(next, true);
          }}
          onReplaceDialogue={(blockId, newText) => {
            const next = blocks.map((b) => (b.id === blockId ? { ...b, text: newText } : b));
            updateBlocksState(next, true);
          }}
          onClose={() => setIsAiModalOpen(false)}
        />
      )}
    </div>
  );
};
