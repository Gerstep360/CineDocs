/**
 * CineDocs Studio - Main Application Orchestrator
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ScriptDocument, BlockType } from './types/script';
import { StorageService } from './lib/storage';
import {
  initDriveAuth,
  googleDriveSignIn,
  googleDriveLogout,
} from './lib/googleDrive';
import { Navbar } from './components/Navbar';
import { ProjectLibrary } from './components/ProjectLibrary';
import { ScreenplayEditor } from './components/Editor/ScreenplayEditor';
import { CharactersPanel } from './components/Editor/CharactersPanel';
import { SupplementaryDocs } from './components/Editor/SupplementaryDocs';
import { BackupView } from './components/BackupView';

const THEME_STORAGE_KEY = 'cinedocs_theme_preference';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    'library' | 'editor' | 'characters' | 'supplementary' | 'backup'
  >('library');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'idle'>('saved');

  // Theme state (persisted, supports instant switching between Light and Dark mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    } catch {
      // ignore
    }
    return false; // Default to clean Google Docs / Word Light mode
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<{
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync theme with <html class="dark"> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDarkMode]);

  // Initialize Firebase Google Auth listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setGoogleUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await googleDriveSignIn();
      if (res?.user) {
        setGoogleUser({
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
        });
      }
    } catch (e) {
      console.error('Login cancelado o fallido:', e);
    }
  };

  const handleGoogleLogout = async () => {
    await googleDriveLogout();
    setGoogleUser(null);
  };

  // Load user's projects from IndexedDB (starts empty without demo data)
  const refreshProjectsList = useCallback(async () => {
    try {
      const list = await StorageService.getProjects();
      setProjects(list);
      if (!activeProjectId && list.length > 0) {
        const firstActive = list.find((p) => !p.isDeleted) || list[0];
        setActiveProjectId(firstActive.id);
      }
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  }, [activeProjectId]);

  useEffect(() => {
    refreshProjectsList();
  }, [refreshProjectsList]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId && !p.isDeleted) ||
    projects.find((p) => !p.isDeleted) ||
    null;

  const activeDocument = React.useMemo<ScriptDocument | null>(() => {
    if (!activeProject) return null;

    if (activeDocumentId) {
      const direct = activeProject.documents?.find((d) => d.id === activeDocumentId);
      if (direct) return direct;

      if (activeProject.seasons) {
        for (const s of activeProject.seasons) {
          const ep = s.episodes.find((e) => e.id === activeDocumentId);
          if (ep) return ep;
        }
      }
    }

    if (activeProject.documents && activeProject.documents.length > 0) {
      return activeProject.documents[0];
    }
    if (activeProject.seasons && activeProject.seasons[0]?.episodes?.[0]) {
      return activeProject.seasons[0].episodes[0];
    }

    return null;
  }, [activeProject, activeDocumentId]);

  // Save Project with fast debounce
  const saveProjectDebounced = useCallback((projectToSave: Project) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await StorageService.saveProject(projectToSave);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error saving project:', err);
        setSaveStatus('offline');
      }
    }, 250);
  }, []);

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    saveProjectDebounced(updatedProject);
  };

  const handleUpdateDocument = (updatedDoc: ScriptDocument) => {
    if (!activeProject) return;

    let updatedProject: Project;

    if (activeProject.category === 'series' && activeProject.seasons) {
      const nextSeasons = activeProject.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((ep) => (ep.id === updatedDoc.id ? updatedDoc : ep)),
      }));
      updatedProject = {
        ...activeProject,
        seasons: nextSeasons,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const nextDocs = activeProject.documents.map((d) =>
        d.id === updatedDoc.id ? updatedDoc : d
      );
      updatedProject = {
        ...activeProject,
        documents: nextDocs,
        updatedAt: new Date().toISOString(),
      };
    }

    setActiveDocumentId(updatedDoc.id);
    handleUpdateProject(updatedProject);
  };

  // Create clean blank project
  const handleCreateProject = async (data: any) => {
    const newId = `proj-${Date.now()}`;
    const initialDocId = `doc-${Date.now()}`;

    const initialBlocks = [
      {
        id: `blk-${Date.now()}-1`,
        type: 'scene_heading' as BlockType,
        text: 'INT. LUGAR - DÍA',
      },
      {
        id: `blk-${Date.now()}-2`,
        type: 'action' as BlockType,
        text: '',
      },
    ];

    const initialDoc: ScriptDocument = {
      id: initialDocId,
      projectId: newId,
      title: data.category === 'series' ? 'Capítulo 1' : data.title || 'Guion sin título',
      templateType: data.templateType || 'screenplay',
      blocks: initialBlocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newProject: Project = {
      id: newId,
      title: data.title || 'Guion sin título',
      category: data.category || 'movie',
      subCategory: data.subCategory,
      author: data.author || 'Autor',
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: [],
      locations: [],
      supplementaryDocs: [
        {
          id: `doc-sup-${Date.now()}`,
          type: 'synopsis',
          title: 'Resumen e Ideas de la Historia',
          content: '',
          updatedAt: new Date().toISOString(),
        },
      ],
      documents: data.category === 'series' ? [] : [initialDoc],
      seasons:
        data.category === 'series'
          ? [
              {
                id: `seas-${Date.now()}`,
                projectId: newId,
                seasonNumber: 1,
                title: 'Temporada 1',
                episodes: [initialDoc],
              },
            ]
          : undefined,
    };

    await StorageService.saveProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newId);
    setActiveDocumentId(initialDocId);
    setCurrentView('editor');
  };

  const handleDuplicateProject = async (id: string) => {
    const copy = await StorageService.duplicateProject(id);
    if (copy) {
      await refreshProjectsList();
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const p = projects.find((item) => item.id === id);
    if (p) {
      handleUpdateProject({ ...p, isFavorite: !p.isFavorite });
    }
  };

  const handleToggleArchive = async (id: string) => {
    const p = projects.find((item) => item.id === id);
    if (p) {
      handleUpdateProject({ ...p, isArchived: !p.isArchived });
    }
  };

  const handleDeleteProject = async (id: string, permanent = false) => {
    await StorageService.deleteProject(id, permanent);
    await refreshProjectsList();
  };

  const handleRestoreProject = async (id: string) => {
    await StorageService.restoreProject(id);
    await refreshProjectsList();
  };

  const handleImportBackup = async (jsonText: string) => {
    try {
      await StorageService.importBackupJSON(jsonText);
      await refreshProjectsList();
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 flex flex-col font-ui antialiased transition-colors duration-200">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        activeProject={activeProject}
        onNewProjectClick={() => {
          setCurrentView('library');
          setIsNewModalOpen(true);
        }}
        saveStatus={saveStatus}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        googleUser={googleUser}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="flex-1 overflow-y-auto"
            >
              <ProjectLibrary
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={(id) => {
                  setActiveProjectId(id);
                  const proj = projects.find((p) => p.id === id);
                  if (proj) {
                    const firstDoc =
                      proj.documents?.[0]?.id ||
                      proj.seasons?.[0]?.episodes?.[0]?.id ||
                      null;
                    setActiveDocumentId(firstDoc);
                  }
                  setCurrentView('editor');
                }}
                onCreateProject={handleCreateProject}
                onDuplicateProject={handleDuplicateProject}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
                onDeleteProject={handleDeleteProject}
                onRestoreProject={handleRestoreProject}
                onImportBackup={handleImportBackup}
                isWizardOpenExternal={isNewModalOpen}
                onCloseWizardExternal={() => setIsNewModalOpen(false)}
              />
            </motion.div>
          )}

          {currentView === 'editor' && activeProject && activeDocument && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden"
            >
              <ScreenplayEditor
                project={activeProject}
                activeDocument={activeDocument}
                onUpdateDocument={handleUpdateDocument}
                onUpdateProject={handleUpdateProject}
                onNavigateToView={(view) => setCurrentView(view)}
                onGoogleUserConnected={(user) =>
                  setGoogleUser({
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                  })
                }
              />
            </motion.div>
          )}

          {currentView === 'characters' && activeProject && (
            <motion.div
              key="characters"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full p-6"
            >
              <CharactersPanel
                characters={activeProject.characters}
                currentBlocks={activeDocument?.blocks || []}
                onAddCharacter={(char) => {
                  const newChar = { ...char, id: `char-${Date.now()}` };
                  handleUpdateProject({
                    ...activeProject,
                    characters: [...activeProject.characters, newChar],
                  });
                }}
                onUpdateCharacter={(char, updateInScript, oldName) => {
                  const nextChars = activeProject.characters.map((c) =>
                    c.id === char.id ? char : c
                  );
                  handleUpdateProject({
                    ...activeProject,
                    characters: nextChars,
                  });
                }}
                onDeleteCharacter={(id) => {
                  handleUpdateProject({
                    ...activeProject,
                    characters: activeProject.characters.filter((c) => c.id !== id),
                  });
                }}
              />
            </motion.div>
          )}

          {currentView === 'supplementary' && activeProject && (
            <motion.div
              key="supplementary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="flex-1 overflow-hidden"
            >
              <SupplementaryDocs
                documents={activeProject.supplementaryDocs}
                onSaveDocument={(doc) => {
                  const next = activeProject.supplementaryDocs.map((d) =>
                    d.id === doc.id ? doc : d
                  );
                  handleUpdateProject({
                    ...activeProject,
                    supplementaryDocs: next,
                  });
                }}
                onDeleteDocument={(docId) => {
                  handleUpdateProject({
                    ...activeProject,
                    supplementaryDocs: activeProject.supplementaryDocs.filter(
                      (d) => d.id !== docId
                    ),
                  });
                }}
                onAddDocument={(type, title) => {
                  const newDoc = {
                    id: `sup-${Date.now()}`,
                    type,
                    title,
                    content: '',
                    updatedAt: new Date().toISOString(),
                  };
                  handleUpdateProject({
                    ...activeProject,
                    supplementaryDocs: [...activeProject.supplementaryDocs, newDoc],
                  });
                }}
              />
            </motion.div>
          )}

          {currentView === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="flex-1 overflow-y-auto"
            >
              <BackupView
                projects={projects}
                onRefreshProjects={refreshProjectsList}
                googleUser={googleUser}
                onGoogleLogin={handleGoogleLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
