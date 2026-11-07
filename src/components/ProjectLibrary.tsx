import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Tv,
  Video,
  Layers,
  Sparkles,
  Search,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Upload,
  FilePlus2,
  ExternalLink,
} from 'lucide-react';
import { Project, ProjectCategory, TemplateType } from '../types/script';
import { getTargetDrivePath } from '../lib/googleDrive';

interface ProjectLibraryProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (projectData: Partial<Project>) => Promise<void>;
  onDuplicateProject: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleArchive: (id: string) => Promise<void>;
  onDeleteProject: (id: string, permanent?: boolean) => Promise<void>;
  onRestoreProject: (id: string) => Promise<void>;
  onImportBackup: (jsonText: string) => Promise<void>;
  isWizardOpenExternal?: boolean;
  onCloseWizardExternal?: () => void;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onToggleFavorite,
  onToggleArchive,
  onDeleteProject,
  onRestoreProject,
  onImportBackup,
  isWizardOpenExternal,
  onCloseWizardExternal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'favorites' | 'archived' | 'trash'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // New Project Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('movie');
  const [newSubCategory, setNewSubCategory] = useState('Película o Cortometraje');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTemplate, setNewTemplate] = useState<TemplateType>('screenplay');

  const modalVisible = isWizardOpen || !!isWizardOpenExternal;

  const closeModal = () => {
    setIsWizardOpen(false);
    if (onCloseWizardExternal) onCloseWizardExternal();
  };

  const openModalWithPreset = (
    cat: ProjectCategory,
    sub: string,
    tmpl: TemplateType = 'screenplay'
  ) => {
    setNewTitle('');
    setNewCategory(cat);
    setNewSubCategory(sub);
    setNewTemplate(tmpl);
    setIsWizardOpen(true);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedStatus === 'trash') {
        if (!p.isDeleted) return false;
      } else {
        if (p.isDeleted) return false;
        if (selectedStatus === 'favorites' && !p.isFavorite) return false;
        if (selectedStatus === 'archived' && !p.isArchived) return false;
        if (selectedStatus === 'all' && p.isArchived) return false;
      }

      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesLogline = p.logline?.toLowerCase().includes(query);
        const matchesAuthor = p.author?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLogline && !matchesAuthor) return false;
      }

      return true;
    });
  }, [projects, selectedCategory, selectedStatus, searchTerm]);

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = newTitle.trim() || 'Guion sin título';

    await onCreateProject({
      title: finalTitle,
      category: newCategory,
      subCategory: newSubCategory,
      author: newAuthor.trim() || 'Autor',
      templateType: newTemplate,
      presetType: 'empty',
    } as any);

    closeModal();
  };

  const getCategoryIcon = (category: ProjectCategory) => {
    switch (category) {
      case 'movie':
        return <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'series':
        return <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'episodic':
        return <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: ProjectCategory) => {
    switch (category) {
      case 'movie':
        return 'Película';
      case 'series':
        return 'Serie';
      case 'video':
        return 'Video';
      case 'episodic':
        return 'Episódico';
      default:
        return 'Personalizado';
    }
  };

  return (
    <div className="min-h-full bg-slate-100 dark:bg-neutral-950 transition-colors duration-200">
      {/* Google Docs Style Top "Start a new document" Ribbon */}
      <section className="bg-slate-200/60 dark:bg-neutral-900/70 border-b border-slate-200 dark:border-neutral-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Iniciar un nuevo guion
            </h2>
            <label className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar respaldo (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const text = evt.target?.result as string;
                      if (text) onImportBackup(text);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              {
                id: 'blank-movie',
                title: 'Guion en blanco',
                subtitle: 'Cine o Cortometraje',
                category: 'movie' as ProjectCategory,
                template: 'screenplay' as TemplateType,
                icon: Plus,
                accent: 'text-blue-600 dark:text-blue-400',
              },
              {
                id: 'series-ep',
                title: 'Serie por capítulos',
                subtitle: 'Temporadas y episodios',
                category: 'series' as ProjectCategory,
                template: 'screenplay' as TemplateType,
                icon: Tv,
                accent: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                id: 'youtube-2col',
                title: 'Video de YouTube',
                subtitle: '2 Columnas (Video y Audio)',
                category: 'video' as ProjectCategory,
                template: 'two_column' as TemplateType,
                icon: Video,
                accent: 'text-amber-600 dark:text-amber-400',
              },
              {
                id: 'video-narrativo',
                title: 'Sketch / Reel / Corto',
                subtitle: 'Guion corrido directo',
                category: 'video' as ProjectCategory,
                template: 'screenplay' as TemplateType,
                icon: Film,
                accent: 'text-rose-600 dark:text-rose-400',
              },
              {
                id: 'episodic-show',
                title: 'Programa o Podcast',
                subtitle: 'Entregas recurrentes',
                category: 'episodic' as ProjectCategory,
                template: 'screenplay' as TemplateType,
                icon: Layers,
                accent: 'text-indigo-600 dark:text-indigo-400',
              },
            ].map((card, i) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModalWithPreset(card.category, card.subtitle, card.template)}
                className="group flex flex-col text-left focus:outline-none"
              >
                {/* Miniature Document Sheet */}
                <div className="w-full h-32 rounded-lg bg-white dark:bg-neutral-900 border border-slate-300/80 dark:border-neutral-800 group-hover:border-blue-500 dark:group-hover:border-blue-500 shadow-xs group-hover:shadow-md transition-all p-3.5 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1.5 opacity-35 group-hover:opacity-60 transition-opacity">
                    <div className="w-1/2 h-1.5 bg-slate-400 dark:bg-neutral-600 rounded-full" />
                    <div className="w-full h-1 bg-slate-300 dark:bg-neutral-700 rounded-full" />
                    <div className="w-4/5 h-1 bg-slate-300 dark:bg-neutral-700 rounded-full" />
                    <div className="w-1/3 h-1.5 bg-slate-400 dark:bg-neutral-600 rounded-full mx-auto mt-2" />
                    <div className="w-2/3 h-1 bg-slate-300 dark:bg-neutral-700 rounded-full mx-auto" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                    <card.icon className={`w-5 h-5 ${card.accent}`} />
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      + Crear
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {card.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {card.subtitle}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Documents List Area */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-neutral-800">
          {/* Category Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-neutral-900 rounded-lg overflow-x-auto">
            {[
              { id: 'all', label: 'Todos mis documentos' },
              { id: 'movie', label: 'Películas' },
              { id: 'series', label: 'Series' },
              { id: 'video', label: 'Videos' },
              { id: 'episodic', label: 'Episódico' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & View Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedStatus === 'all'
                    ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-medium'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Recientes
              </button>
              <button
                onClick={() => setSelectedStatus('favorites')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedStatus === 'favorites'
                    ? 'bg-slate-200 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                Destacados
              </button>
              <button
                onClick={() => setSelectedStatus('archived')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedStatus === 'archived'
                    ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-medium'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3 h-3" />
                Archivados
              </button>
              <button
                onClick={() => setSelectedStatus('trash')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedStatus === 'trash'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-rose-500'
                }`}
              >
                <Trash2 className="w-3 h-3" />
                Papelera
              </button>
            </div>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-blue-500 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-neutral-900 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Vista en cuadrícula"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Vista en lista"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State (Zero Sample Data by Default) */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 py-16 px-4 text-center border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-white/60 dark:bg-neutral-900/40"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {selectedStatus === 'trash'
                ? 'Tu papelera está limpia'
                : 'Aún no tienes ningún guion creado'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              {selectedStatus === 'trash'
                ? 'Los documentos que envíes a la papelera aparecerán aquí por si necesitas restaurarlos.'
                : 'Tu espacio está completamente limpio y sin datos de prueba. Haz clic en cualquiera de las hojas de arriba o en el botón de abajo para empezar a escribir como en Google Docs o Word.'}
            </p>
            {selectedStatus !== 'trash' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModalWithPreset('movie', 'Película o Cortometraje', 'screenplay')}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Crear mi primer guion en blanco
              </motion.button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => {
                const sceneCount =
                  project.documents[0]?.blocks.filter((b) => b.type === 'scene_heading').length ||
                  project.seasons?.[0]?.episodes?.[0]?.blocks.filter((b) => b.type === 'scene_heading').length ||
                  0;

                const targetDriveFolder = getTargetDrivePath(project.category);

                return (
                  <motion.div
                    layout
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="group relative flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-400 dark:hover:border-blue-500/60 transition-all shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                          {getCategoryIcon(project.category)}
                          <span className="font-medium text-slate-700 dark:text-neutral-300">
                            {getCategoryLabel(project.category)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate font-mono text-[11px]">
                            {targetDriveFolder}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {selectedStatus !== 'trash' && (
                            <button
                              onClick={() => onToggleFavorite(project.id)}
                              aria-label="Destacar"
                              className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ${
                                project.isFavorite
                                  ? 'text-amber-500'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${project.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                              aria-label="Opciones"
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {menuOpenId === project.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg shadow-xl z-20 text-xs text-slate-700 dark:text-neutral-300">
                                {selectedStatus === 'trash' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        onRestoreProject(project.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-emerald-600 dark:text-emerald-400"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Restaurar
                                    </button>
                                    <button
                                      onClick={() => {
                                        onDeleteProject(project.id, true);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-rose-600 dark:text-rose-400"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Borrar definitivamente
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        onDuplicateProject(project.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      Hacer una copia
                                    </button>
                                    <button
                                      onClick={() => {
                                        onToggleArchive(project.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                      {project.isArchived ? 'Desarchivar' : 'Archivar'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        onDeleteProject(project.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-rose-600 dark:text-rose-400"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Enviar a papelera
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h3
                          onClick={() => onSelectProject(project.id)}
                          className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {project.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2">
                          {project.logline || `Autor: ${project.author || 'Sin especificar'}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {sceneCount} {sceneCount === 1 ? 'escena' : 'escenas'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                      >
                        Abrir
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* List Mode View */
          <div className="mt-6 border border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Nombre del Documento</th>
                  <th className="py-3 px-4 font-medium">Tipo / Carpeta Drive</th>
                  <th className="py-3 px-4 font-medium">Última edición</th>
                  <th className="py-3 px-4 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(project.category)}
                        <span
                          onClick={() => onSelectProject(project.id)}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          {project.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-neutral-400">
                      {getTargetDrivePath(project.category)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-neutral-400">
                      {new Date(project.updatedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      >
                        Abrir hoja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple & Friendly 1-Step Creation Modal */}
      <AnimatePresence>
        {modalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs"
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleCreateSubmit}
              className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Nuevo Guion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Ponle un nombre y empieza a escribir de inmediato.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Nombre de tu proyecto o historia
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej: Mi primer cortometraje, Episodio Piloto, Video..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    ¿Para qué es este guion? (Define su carpeta en Drive)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'movie', label: 'Película o Corto', template: 'screenplay', icon: Film },
                      { id: 'series', label: 'Serie por capítulos', template: 'screenplay', icon: Tv },
                      { id: 'video', label: 'Video / YouTube', template: 'two_column', icon: Video },
                      { id: 'episodic', label: 'Podcast / Programa', template: 'screenplay', icon: Layers },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setNewCategory(opt.id as ProjectCategory);
                          setNewSubCategory(opt.label);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                          newCategory === opt.id
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                    Carpeta en Google Drive: <strong>{getTargetDrivePath(newCategory)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Estilo de página
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTemplate('screenplay')}
                      className={`p-2 text-xs rounded-lg border font-medium ${
                        newTemplate === 'screenplay'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      Hoja de Guion (Cine/TV)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTemplate('two_column')}
                      className={`p-2 text-xs rounded-lg border font-medium ${
                        newTemplate === 'two_column'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      2 Columnas (Video y Audio)
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 dark:bg-neutral-800/60 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
                >
                  Abrir hoja y escribir
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
