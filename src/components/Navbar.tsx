import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Sun,
  Moon,
  Plus,
  FolderOpen,
  Users,
  Bookmark,
  HardDrive,
  CloudCheck,
  LogOut,
} from 'lucide-react';
import { Project } from '../types/script';

interface NavbarProps {
  currentView: 'library' | 'editor' | 'characters' | 'supplementary' | 'backup';
  onNavigate: (view: 'library' | 'editor' | 'characters' | 'supplementary' | 'backup') => void;
  activeProject: Project | null;
  onNewProjectClick: () => void;
  saveStatus: 'saved' | 'saving' | 'offline' | 'idle';
  isDarkMode: boolean;
  onToggleTheme: () => void;
  googleUser: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeProject,
  onNewProjectClick,
  saveStatus,
  isDarkMode,
  onToggleTheme,
  googleUser,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-2.5 border-b border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md transition-colors duration-200">
      {/* Zone 1: Brand Title */}
      <button
        onClick={() => onNavigate('library')}
        className="flex items-center gap-2.5 text-left group focus:outline-none whitespace-nowrap shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
          <FileText className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          CineDocs
        </span>
      </button>

      {/* Zone 2: Navigation Links (clean single-line links) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-neutral-400">
        <button
          onClick={() => onNavigate('library')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'library'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Mis Guiones
        </button>

        <button
          onClick={() => onNavigate('editor')}
          disabled={!activeProject}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            !activeProject
              ? 'opacity-40 cursor-not-allowed'
              : currentView === 'editor'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Hoja de Escritura
        </button>

        <button
          onClick={() => onNavigate('characters')}
          disabled={!activeProject}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            !activeProject
              ? 'opacity-40 cursor-not-allowed'
              : currentView === 'characters'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Personajes
        </button>

        <button
          onClick={() => onNavigate('supplementary')}
          disabled={!activeProject}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            !activeProject
              ? 'opacity-40 cursor-not-allowed'
              : currentView === 'supplementary'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Ideas y Notas
        </button>

        <button
          onClick={() => onNavigate('backup')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'backup'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Guardado y Drive
        </button>
      </nav>

      {/* Zone 3: Theme Switcher, Google Account & Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Local Save Status */}
        <span className="hidden lg:inline-block text-xs text-slate-500 dark:text-neutral-400 whitespace-nowrap">
          {saveStatus === 'saving'
            ? 'Guardando...'
            : saveStatus === 'saved'
            ? 'Guardado en este equipo'
            : 'Listo'}
        </span>

        {/* Google Sign-In or Connected User */}
        {googleUser ? (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs text-slate-700 dark:text-neutral-200">
            <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="max-w-[120px] truncate">
              {googleUser.displayName || googleUser.email}
            </span>
            <button
              onClick={onGoogleLogout}
              title="Desconectar Google Drive"
              className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button onClick={onGoogleLogin} className="gsi-material-button" title="Conectar Google Drive para sincronizar en Gerstep/Guiones">
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">Sign in with Google</span>
            </div>
          </button>
        )}

        {/* Animated Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggleTheme}
          aria-label="Cambiar modo claro u oscuro"
          title={isDarkMode ? 'Cambiar a modo claro (Estilo Word/Docs)' : 'Cambiar a modo oscuro'}
          className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none"
        >
          <motion.div
            key={isDarkMode ? 'dark' : 'light'}
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </motion.div>
        </motion.button>

        {/* Primary Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewProjectClick}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-xs focus:outline-none whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Guion
        </motion.button>
      </div>
    </header>
  );
};
