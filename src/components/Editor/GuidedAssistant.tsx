import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check, X } from 'lucide-react';
import { ScriptBlock, Character, LocationItem } from '../../types/script';

interface GuidedAssistantProps {
  existingCharacters: Character[];
  existingLocations: LocationItem[];
  onInsertBlocks: (blocks: ScriptBlock[]) => void;
  onClose: () => void;
}

export const GuidedAssistant: React.FC<GuidedAssistantProps> = ({
  existingCharacters,
  existingLocations,
  onInsertBlocks,
  onClose,
}) => {
  const [sceneType, setSceneType] = useState<'INT.' | 'EXT.' | 'INT/EXT.'>('INT.');
  const [locationName, setLocationName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('DÍA');
  const [actionDescription, setActionDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [parentheticalNote, setParentheticalNote] = useState('');
  const [dialogueText, setDialogueText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const previewBlocks: ScriptBlock[] = React.useMemo(() => {
    const list: ScriptBlock[] = [];

    if (locationName.trim()) {
      list.push({
        id: 'preview-head',
        type: 'scene_heading',
        text: `${sceneType} ${locationName.trim().toUpperCase()} - ${timeOfDay.toUpperCase()}`,
      });
    }

    if (actionDescription.trim()) {
      list.push({
        id: 'preview-act',
        type: 'action',
        text: actionDescription.trim(),
      });
    }

    if (speakerName.trim()) {
      list.push({
        id: 'preview-char',
        type: 'character',
        text: speakerName.trim().toUpperCase(),
      });

      if (parentheticalNote.trim()) {
        const cleanParenthetical =
          parentheticalNote.startsWith('(') && parentheticalNote.endsWith(')')
            ? parentheticalNote.trim()
            : `(${parentheticalNote.trim()})`;
        list.push({
          id: 'preview-paren',
          type: 'parenthetical',
          text: cleanParenthetical,
        });
      }

      if (dialogueText.trim()) {
        list.push({
          id: 'preview-diag',
          type: 'dialogue',
          text: dialogueText.trim(),
        });
      }
    }

    return list;
  }, [sceneType, locationName, timeOfDay, actionDescription, speakerName, parentheticalNote, dialogueText]);

  const handleApply = () => {
    if (previewBlocks.length === 0) return;

    const realBlocks: ScriptBlock[] = previewBlocks.map((b) => ({
      ...b,
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    }));

    onInsertBlocks(realBlocks);
    onClose();
  };

  const handleAiAssistance = async () => {
    if (!actionDescription.trim() && !locationName.trim()) {
      setAiError('Cuéntanos primero en "Qué pasa en la escena" tu idea para darle formato.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/draft-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: actionDescription || `Escena en ${locationName}`,
          location: locationName || 'SALA',
          timeOfDay: timeOfDay || 'DÍA',
          characters: speakerName ? [speakerName] : existingCharacters.map((c) => c.name),
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con el asistente.');
      const data = await res.json();

      if (data.blocks && data.blocks.length > 0) {
        data.blocks.forEach((blk: any) => {
          if (blk.type === 'scene_heading') {
            const parts = blk.text.split('-');
            if (parts[0]) setLocationName(parts[0].replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/, '').trim());
            if (parts[1]) setTimeOfDay(parts[1].trim());
          } else if (blk.type === 'action') {
            setActionDescription(blk.text);
          } else if (blk.type === 'character') {
            setSpeakerName(blk.text);
          } else if (blk.type === 'parenthetical') {
            setParentheticalNote(blk.text);
          } else if (blk.type === 'dialogue') {
            setDialogueText(blk.text);
          }
        });
      }
    } catch (e: any) {
      setAiError(e.message || 'No se pudo obtener la sugerencia.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Escribir escena paso a paso (Sin reglas técnicas)
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Responde lo que necesites y nosotros acomodamos los márgenes y mayúsculas automáticamente.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Natural questions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              1. ¿Dónde ocurre? (Opcional si sigues en el mismo lugar)
            </label>
            <div className="flex gap-2">
              <select
                value={sceneType}
                onChange={(e) => setSceneType(e.target.value as any)}
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="INT.">Adentro (INT.)</option>
                <option value="EXT.">Afuera (EXT.)</option>
                <option value="INT/EXT.">Ambos</option>
              </select>

              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ej: Cafetería, Sala de estar, Calle..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {existingLocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] text-slate-400">Lugares recientes:</span>
                {existingLocations.slice(0, 3).map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setLocationName(loc.name)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              2. ¿De día o de noche?
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['DÍA', 'NOCHE', 'ATARDECER', 'CONTINUO'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeOfDay(t)}
                  className={`py-1.5 text-xs rounded-lg border transition-colors ${
                    timeOfDay === t
                      ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              3. ¿Qué pasa en la escena?
            </label>
            <textarea
              rows={3}
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="Describe con tus palabras qué vemos o qué hacen los personajes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Dialogue & Character */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              4. ¿Alguien habla? (Nombre del personaje)
            </label>
            <input
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Ej: Ana, Carlos, Presentador..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {existingCharacters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] text-slate-400">Tus personajes:</span>
                {existingCharacters.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSpeakerName(c.name)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              5. ¿Con qué tono o gesto lo dice? (Opcional)
            </label>
            <input
              type="text"
              value={parentheticalNote}
              onChange={(e) => setParentheticalNote(e.target.value)}
              placeholder="Ej: sonriendo, en voz baja, sorprendido..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              6. ¿Qué dice exactamente?
            </label>
            <textarea
              rows={2}
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              placeholder="Escribe aquí sus palabras..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {aiError && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20">
          {aiError}
        </p>
      )}

      {/* Live Preview */}
      <div className="pt-3 border-t border-slate-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
            Así se verá en tu hoja de guion:
          </span>
          <button
            type="button"
            onClick={handleAiAssistance}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiLoading ? 'Dando formato...' : 'Autocompletar idea con IA'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl font-script text-xs text-slate-800 dark:text-neutral-200 space-y-2 min-h-[84px]">
          {previewBlocks.length === 0 ? (
            <p className="text-slate-400 dark:text-neutral-500 italic text-center py-3">
              Escribe en cualquiera de los campos de arriba para ver la vista previa en vivo.
            </p>
          ) : (
            previewBlocks.map((b) => (
              <div key={b.id}>
                {b.type === 'scene_heading' && (
                  <p className="font-bold text-slate-900 dark:text-white uppercase">{b.text}</p>
                )}
                {b.type === 'action' && (
                  <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">{b.text}</p>
                )}
                {b.type === 'character' && (
                  <p className="text-center font-bold text-slate-900 dark:text-white mt-2">{b.text}</p>
                )}
                {b.type === 'parenthetical' && (
                  <p className="text-center text-slate-500 dark:text-neutral-400 italic text-[11px]">{b.text}</p>
                )}
                {b.type === 'dialogue' && (
                  <p className="mx-auto max-w-sm text-center text-slate-800 dark:text-neutral-200">{b.text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
        >
          Cerrar
        </button>

        <button
          type="button"
          disabled={previewBlocks.length === 0}
          onClick={handleApply}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>Añadir a mi hoja</span>
        </button>
      </div>
    </motion.div>
  );
};
