import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, FileText, Plus, Trash2, Clock } from 'lucide-react';
import { SupplementaryDoc, SupplementaryType } from '../../types/script';

interface SupplementaryDocsProps {
  documents: SupplementaryDoc[];
  onSaveDocument: (doc: SupplementaryDoc) => void;
  onDeleteDocument: (docId: string) => void;
  onAddDocument: (type: SupplementaryType, title: string) => void;
}

export const SupplementaryDocs: React.FC<SupplementaryDocsProps> = ({
  documents,
  onSaveDocument,
  onDeleteDocument,
  onAddDocument,
}) => {
  const [activeDocId, setActiveDocId] = useState<string>(documents[0]?.id || '');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<SupplementaryType>('notes');
  const [isAdding, setIsAdding] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const handleContentChange = (content: string) => {
    if (!activeDoc) return;
    onSaveDocument({
      ...activeDoc,
      content,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTitleChange = (title: string) => {
    if (!activeDoc) return;
    onSaveDocument({
      ...activeDoc,
      title,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateSubmit = () => {
    if (!newDocTitle.trim()) return;
    onAddDocument(newDocType, newDocTitle.trim());
    setNewDocTitle('');
    setIsAdding(false);
  };

  return (
    <div className="flex h-[calc(100vh-57px)] bg-slate-100 dark:bg-neutral-950 text-slate-800 dark:text-neutral-200 transition-colors duration-200">
      {/* Sidebar of Supplementary Docs */}
      <div className="w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Ideas, Resumen y Notas</span>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-2.5"
            >
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Título (ej: Ideas de final)..."
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="synopsis">Resumen de la historia (Sinopsis)</option>
                <option value="logline">Idea en una frase (Logline)</option>
                <option value="beat_sheet">Lista de momentos clave (Escaleta)</option>
                <option value="series_bible">Reglas del mundo / Serie</option>
                <option value="notes">Notas libres</option>
                <option value="research">Investigación y enlaces</option>
              </select>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 dark:text-neutral-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={!newDocTitle.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-3 space-y-1">
            {documents.map((doc) => {
              const isActive = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-neutral-800 text-blue-700 dark:text-white font-semibold border border-blue-200 dark:border-neutral-700'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-neutral-500'
                      }`}
                    />
                    <span className="truncate">{doc.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeDoc && documents.length > 1 && (
          <button
            onClick={() => onDeleteDocument(activeDoc.id)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 p-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar esta nota</span>
          </button>
        )}
      </div>

      {/* Main Prose Document Sheet */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-8">
          {activeDoc ? (
            <div className="space-y-4">
              <input
                type="text"
                value={activeDoc.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-blue-500 focus:outline-none pb-2 transition-colors"
              />

              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-neutral-500 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Guardado automáticamente a las{' '}
                  {new Date(activeDoc.updatedAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <textarea
                value={activeDoc.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Anota aquí tus ideas libres, resumen de la historia, lluvia de ideas o enlaces de referencia..."
                rows={20}
                className="w-full p-2 bg-transparent text-slate-800 dark:text-neutral-200 text-sm leading-relaxed placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none resize-none font-sans"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 text-xs">
              <Bookmark className="w-8 h-8 mb-2 opacity-50" />
              <p>Selecciona o crea un documento de notas en la columna izquierda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
