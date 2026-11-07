import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Edit2, Trash2, MessageSquare, Check, X } from 'lucide-react';
import { Character, ScriptBlock } from '../../types/script';

interface CharactersPanelProps {
  characters: Character[];
  currentBlocks: ScriptBlock[];
  onAddCharacter: (char: Omit<Character, 'id'>) => void;
  onUpdateCharacter: (char: Character, updateInScript?: boolean, oldName?: string) => void;
  onDeleteCharacter: (id: string) => void;
  onSelectCharacterToInsert?: (name: string) => void;
}

export const CharactersPanel: React.FC<CharactersPanelProps> = ({
  characters,
  currentBlocks,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onSelectCharacterToInsert,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [age, setAge] = useState('');
  const [personality, setPersonality] = useState('');
  const [goals, setGoals] = useState('');
  const [relationships, setRelationships] = useState('');
  const [syncRenameInScript, setSyncRenameInScript] = useState(true);

  const getDialogueCount = (charName: string) => {
    return currentBlocks.filter(
      (b) => b.type === 'character' && b.text.trim().toUpperCase() === charName.trim().toUpperCase()
    ).length;
  };

  const handleStartCreate = () => {
    setName('');
    setDescription('');
    setAge('');
    setPersonality('');
    setGoals('');
    setRelationships('');
    setIsCreating(true);
    setEditingId(null);
  };

  const handleStartEdit = (char: Character) => {
    setEditingId(char.id);
    setName(char.name);
    setDescription(char.description || '');
    setAge(char.age || '');
    setPersonality(char.personality || '');
    setGoals(char.goals || '');
    setRelationships(char.relationships || '');
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (isCreating) {
      onAddCharacter({
        name: name.trim().toUpperCase(),
        description: description.trim(),
        age: age.trim(),
        personality: personality.trim(),
        goals: goals.trim(),
        relationships: relationships.trim(),
      });
      setIsCreating(false);
    } else if (editingId) {
      const original = characters.find((c) => c.id === editingId);
      onUpdateCharacter(
        {
          id: editingId,
          name: name.trim().toUpperCase(),
          description: description.trim(),
          age: age.trim(),
          personality: personality.trim(),
          goals: goals.trim(),
          relationships: relationships.trim(),
        },
        syncRenameInScript,
        original?.name
      );
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 text-xs rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden transition-colors duration-200">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-800 dark:text-neutral-200 text-xs">
            Personajes de la Historia
          </h3>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Personaje</span>
        </button>
      </div>

      {/* Inline Editor Form */}
      <AnimatePresence>
        {(isCreating || editingId) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 bg-slate-50 dark:bg-neutral-950/80 border-b border-slate-200 dark:border-neutral-800 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
                {isCreating ? 'Crear Personaje' : 'Editar Personaje'}
              </h4>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  Nombre del personaje
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: JUAN, SOFÍA, NARRADOR..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Edad (opcional)
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej: 30 años"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Rasgo o personalidad
                  </label>
                  <input
                    type="text"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Ej: Optimista, curioso..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  ¿Quién es y cómo se ve?
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del personaje..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-400 mb-1">
                  ¿Qué busca lograr en la historia?
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Su meta o propósito..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!isCreating && (
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncRenameInScript}
                    onChange={(e) => setSyncRenameInScript(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Actualizar nombre automáticamente en todos sus diálogos</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {characters.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-neutral-500 text-xs leading-relaxed">
            Todavía no has registrado personajes. Añade a quienes participan en tu historia para autocompletar sus nombres mientras escribes.
          </div>
        ) : (
          characters.map((char) => {
            const count = getDialogueCount(char.name);

            return (
              <div
                key={char.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {char.name}
                      </span>
                      {char.age && (
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                          · {char.age}
                        </span>
                      )}
                    </div>
                    {char.personality && (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {char.personality}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(char)}
                      aria-label="Editar personaje"
                      className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCharacter(char.id)}
                      aria-label="Eliminar personaje"
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {char.description && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {char.description}
                  </p>
                )}

                {char.goals && (
                  <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
                    Propósito: {char.goals}
                  </p>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-neutral-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                  <span className="font-mono flex items-center gap-1 tabular-nums">
                    <MessageSquare className="w-3 h-3" />
                    {count} {count === 1 ? 'diálogo' : 'diálogos'}
                  </span>

                  {onSelectCharacterToInsert && (
                    <button
                      onClick={() => onSelectCharacterToInsert(char.name)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      + Hacer que hable ahora
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
