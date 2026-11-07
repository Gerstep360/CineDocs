import React, { useState } from 'react';
import { Film, Search, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { ScriptBlock } from '../../types/script';
import { ScreenplayEngine } from '../../lib/screenplay-engine';

interface SceneNavigatorProps {
  blocks: ScriptBlock[];
  onJumpToScene: (blockIndex: number) => void;
  onMoveScene: (fromIndex: number, direction: 'up' | 'down') => void;
  onUpdateSceneNote?: (blockIndex: number, note: string) => void;
  selectedBlockIndex: number | null;
}

export const SceneNavigator: React.FC<SceneNavigatorProps> = ({
  blocks,
  onJumpToScene,
  onMoveScene,
  onUpdateSceneNote,
  selectedBlockIndex,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const scenes = ScreenplayEngine.extractScenes(blocks);

  const filteredScenes = scenes.filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.block.notes?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 text-xs transition-colors duration-200">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-neutral-200 text-xs">
            <Film className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Índice de Escenas</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-400">
            {scenes.length} {scenes.length === 1 ? 'escena' : 'escenas'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar escena o lugar..."
            className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-neutral-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60">
        {filteredScenes.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-neutral-500 text-xs leading-relaxed">
            {scenes.length === 0
              ? 'Cuando agregues un lugar o encabezado de escena (por ejemplo: INT. CASA - DÍA), aparecerá aquí para saltar rápido como en un índice.'
              : 'Ninguna escena coincide con tu búsqueda.'}
          </div>
        ) : (
          filteredScenes.map((scene, idx) => {
            const isSelected = selectedBlockIndex === scene.index;

            return (
              <div
                key={scene.block.id}
                className={`p-3 group transition-colors ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <button
                    onClick={() => onJumpToScene(scene.index)}
                    className="flex-1 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                      <span>ESCENA {scene.sceneNumber}</span>
                    </div>

                    <h4 className="mt-0.5 font-mono text-xs font-bold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-white leading-tight line-clamp-2">
                      {scene.title}
                    </h4>
                  </button>

                  {/* Scene Reordering buttons */}
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onMoveScene(scene.index, 'up')}
                      disabled={idx === 0}
                      title="Subir escena"
                      className="p-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveScene(scene.index, 'down')}
                      disabled={idx === filteredScenes.length - 1}
                      title="Bajar escena"
                      className="p-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes if present */}
                {scene.block.notes && (
                  <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/20 line-clamp-2">
                    {scene.block.notes}
                  </p>
                )}

                {/* Note Editor */}
                {editingNoteIndex === scene.index ? (
                  <div className="mt-2 space-y-1.5">
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escribe una nota o recordatorio para esta escena..."
                      className="w-full p-2 text-xs bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-neutral-200 resize-none focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNoteIndex(null)}
                        className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 dark:text-neutral-400"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateSceneNote) {
                            onUpdateSceneNote(scene.index, noteText);
                          }
                          setEditingNoteIndex(null);
                        }}
                        className="px-2.5 py-0.5 text-[11px] bg-blue-600 text-white rounded font-medium"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                    <button
                      onClick={() => {
                        setEditingNoteIndex(scene.index);
                        setNoteText(scene.block.notes || '');
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-neutral-300 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{scene.block.notes ? 'Editar nota' : 'Añadir nota'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
