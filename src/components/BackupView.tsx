import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HardDriveDownload,
  Upload,
  Check,
  ShieldCheck,
  Database,
  CloudUpload,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { Project } from '../types/script';
import { StorageService } from '../lib/storage';
import { Exporters } from '../lib/exporters';
import {
  getDriveAccessToken,
  googleDriveSignIn,
  ensureCategoryFolderHierarchy,
  uploadScriptToGoogleDrive,
  getTargetDrivePath,
} from '../lib/googleDrive';

interface BackupViewProps {
  projects: Project[];
  onRefreshProjects: () => Promise<void>;
  googleUser: { displayName: string | null; email: string | null } | null;
  onGoogleLogin: () => Promise<void>;
}

export const BackupView: React.FC<BackupViewProps> = ({
  projects,
  onRefreshProjects,
  googleUser,
  onGoogleLogin,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showConfirmBulkSync, setShowConfirmBulkSync] = useState(false);

  const activeProjects = projects.filter((p) => !p.isDeleted);

  const handleDownloadBackup = () => {
    const jsonString = StorageService.exportFullBackupJSON(projects);
    const dateStr = new Date().toISOString().split('T')[0];
    Exporters.downloadBlob(
      jsonString,
      `cinedocs_respaldo_${dateStr}.json`,
      'application/json;charset=utf-8'
    );
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const count = await StorageService.importBackupJSON(text);
        await onRefreshProjects();
        setStatusMessage(`Se importaron ${count} guiones correctamente en tu biblioteca local.`);
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (err: any) {
        setStatusMessage(`Error al importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmSyncAllToDrive = async () => {
    setShowConfirmBulkSync(false);
    setIsSyncingAll(true);
    setStatusMessage(null);

    try {
      let token = getDriveAccessToken();
      if (!token) {
        const authRes = await googleDriveSignIn();
        if (!authRes) {
          setIsSyncingAll(false);
          return;
        }
        token = authRes.accessToken;
      }

      let syncedCount = 0;
      for (const proj of activeProjects) {
        const { folderId, fullPath } = await ensureCategoryFolderHierarchy(
          proj.category,
          token
        );

        const primaryDoc =
          proj.documents?.[0] || proj.seasons?.[0]?.episodes?.[0];
        if (!primaryDoc) continue;

        const uploadRes = await uploadScriptToGoogleDrive({
          project: proj,
          document: primaryDoc,
          folderId,
          existingFileId: primaryDoc.driveFileId,
          token,
        });

        primaryDoc.driveFileId = uploadRes.fileId;
        primaryDoc.driveWebViewLink = uploadRes.webViewLink;
        primaryDoc.driveFolderPath = fullPath;
        primaryDoc.lastSyncedAt = new Date().toISOString();
        proj.driveFolderId = folderId;
        proj.driveFolderPath = fullPath;
        proj.lastSyncedAt = new Date().toISOString();

        await StorageService.saveProject(proj);
        syncedCount++;
      }

      await onRefreshProjects();
      setStatusMessage(
        `Se sincronizaron ${syncedCount} guiones en sus carpetas correspondientes dentro de "Gerstep/Guiones/..." en tu Google Drive.`
      );
    } catch (e: any) {
      setStatusMessage(e.message || 'Error al sincronizar con Google Drive.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 text-slate-900 dark:text-neutral-100">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Guardado Local Seguro y Sincronización con Google Drive
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Tus guiones se guardan de forma inmediata en este dispositivo y pueden sincronizarse automáticamente en tu Google Drive.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{statusMessage}</span>
        </motion.div>
      )}

      {/* Google Drive Folder Structure Section */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Organización Automática en Google Drive
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Al guardar en Drive, la aplicación crea y organiza tus archivos automáticamente según el tipo de proyecto:
              </p>
            </div>
          </div>

          {googleUser ? (
            <button
              onClick={() => setShowConfirmBulkSync(true)}
              disabled={isSyncingAll || activeProjects.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <CloudUpload className="w-4 h-4" />
              <span>
                {isSyncingAll
                  ? 'Sincronizando con Drive...'
                  : `Sincronizar todos (${activeProjects.length})`}
              </span>
            </button>
          ) : (
            <button
              onClick={onGoogleLogin}
              className="gsi-material-button shrink-0"
            >
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { cat: 'movie' as const, label: 'Películas y Cortos' },
            { cat: 'series' as const, label: 'Series por Capítulos' },
            { cat: 'video' as const, label: 'Videos / YouTube' },
            { cat: 'episodic' as const, label: 'Contenido Episódico' },
          ].map((item) => (
            <div
              key={item.cat}
              className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-800"
            >
              <div className="font-sans font-semibold text-slate-800 dark:text-neutral-200 mb-1">
                {item.label}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 break-all">
                {getTargetDrivePath(item.cat)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Persistence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Doble Guardado Local (IndexedDB + LocalStorage)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Cada cambio en tus hojas se guarda de manera instantánea en dos bases de datos locales independientes dentro de tu navegador. Aunque pierdas la conexión a internet o cierres la pestaña, tu guion permanece intacto.
          </p>
          <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-neutral-800">
            Guiones activos en este equipo: <strong>{activeProjects.length}</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">
            <HardDriveDownload className="w-4 h-4" />
            <span>Copia de Seguridad en Archivo (.JSON)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Puedes descargar todos tus proyectos en un único archivo portátil o restaurarlos en cualquier otro ordenador cuando quieras.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>Descargar copia (.json)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar archivo (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Drive Sync */}
      <AnimatePresence>
        {showConfirmBulkSync && (
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirmar sincronización con Google Drive
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                Se guardarán y actualizarán <strong>{activeProjects.length} guiones</strong> dentro de tu carpeta{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 font-mono">
                  Gerstep/Guiones/[Categoría]
                </code>{' '}
                en Google Drive. ¿Deseas continuar?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmBulkSync(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSyncAllToDrive}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  Confirmar y Sincronizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
