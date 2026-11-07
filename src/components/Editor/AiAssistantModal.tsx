import React, { useState } from 'react';
import { Sparkles, MessageSquare, Check, X, Wand2, ShieldCheck, RefreshCw } from 'lucide-react';
import { ScriptBlock, Character } from '../../types/script';

interface AiAssistantModalProps {
  characters: Character[];
  currentBlocks: ScriptBlock[];
  onApplySceneBlocks: (blocks: ScriptBlock[]) => void;
  onReplaceDialogue: (blockId: string, newText: string) => void;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  characters,
  currentBlocks,
  onApplySceneBlocks,
  onReplaceDialogue,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'dialogue' | 'review'>('draft');

  // Draft Scene State
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftLocation, setDraftLocation] = useState('HABITACIÓN DE HOTEL');
  const [draftTime, setDraftTime] = useState('NOCHE');
  const [proposedBlocks, setProposedBlocks] = useState<ScriptBlock[] | null>(null);

  // Dialogue suggestions state
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]?.name || 'PROTAGONISTA');
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [dialogueMood, setDialogueMood] = useState('Tenso y contenido');
  const [dialogueSuggestions, setDialogueSuggestions] = useState<string[]>([]);

  // Script doctor review state
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    if (!draftPrompt.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setProposedBlocks(null);

    try {
      const res = await fetch('/api/ai/draft-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: draftPrompt,
          location: draftLocation,
          timeOfDay: draftTime,
          characters: characters.map((c) => c.name),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la escena');

      if (data.blocks && data.blocks.length > 0) {
        const formatted = data.blocks.map((b: any) => ({
          ...b,
          id: `ai-blk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        }));
        setProposedBlocks(formatted);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al conectar con el asistente de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDialogues = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setDialogueSuggestions([]);

    try {
      const res = await fetch('/api/ai/suggest-dialogues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedCharacter,
          currentDialogue,
          mood: dialogueMood,
          context: 'Conversación relevante de la escena en desarrollo.',
        }),
      });

      const data = await res.json();
      if (data.suggestions) {
        setDialogueSuggestions(data.suggestions);
      }
    } catch (e: any) {
      setErrorMsg('No se pudieron obtener alternativas de diálogo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunReview = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setReviewFeedback(null);

    try {
      const scriptExtract = currentBlocks
        .slice(0, 40)
        .map((b) => `${b.type.toUpperCase()}: ${b.text}`)
        .join('\n');

      const res = await fetch('/api/ai/analyze-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: scriptExtract }),
      });

      const data = await res.json();
      setReviewFeedback(data.feedback || 'Revisión completada.');
    } catch (e: any) {
      setErrorMsg('No se pudo completar el análisis del guion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Asistente Creativo de Guion (Gemini)
              </h3>
              <p className="text-xs text-neutral-500">
                Herramientas opcionales. El guion nunca se modifica sin tu confirmación previa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          {[
            { id: 'draft', label: 'Borrador de Escena', icon: Wand2 },
            { id: 'dialogue', label: 'Alternativas de Diálogo', icon: MessageSquare },
            { id: 'review', label: 'Script Doctor (Revisión)', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {errorMsg && (
            <p className="mb-4 text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          {activeTab === 'draft' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Locación
                  </label>
                  <input
                    type="text"
                    value={draftLocation}
                    onChange={(e) => setDraftLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Momento
                  </label>
                  <input
                    type="text"
                    value={draftTime}
                    onChange={(e) => setDraftTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Describe qué ocurre en lenguaje natural
                </label>
                <textarea
                  rows={3}
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  placeholder="Ej: Un detective encuentra una carta abierta sobre la mesa de la víctima. Al leerla descubre que su compañero de patrulla estuvo aquí hace dos horas..."
                  className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateDraft}
                  disabled={isLoading || !draftPrompt.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Estructurando escena...' : 'Generar propuesta estructurada'}</span>
                </button>
              </div>

              {proposedBlocks && (
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Propuesta generada (Previsualización):
                    </span>
                    <button
                      onClick={() => {
                        onApplySceneBlocks(proposedBlocks);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aceptar e Insertar en el Guion</span>
                    </button>
                  </div>

                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-script space-y-2 max-h-56 overflow-y-auto">
                    {proposedBlocks.map((b) => (
                      <div key={b.id}>
                        {b.type === 'scene_heading' && (
                          <p className="font-bold text-white uppercase">{b.text}</p>
                        )}
                        {b.type === 'action' && (
                          <p className="text-neutral-300">{b.text}</p>
                        )}
                        {b.type === 'character' && (
                          <p className="text-center font-bold text-white mt-2">{b.text}</p>
                        )}
                        {b.type === 'parenthetical' && (
                          <p className="text-center text-neutral-400 italic text-[11px]">{b.text}</p>
                        )}
                        {b.type === 'dialogue' && (
                          <p className="text-center text-neutral-200 max-w-sm mx-auto">{b.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dialogue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Personaje
                  </label>
                  <select
                    value={selectedCharacter}
                    onChange={(e) => setSelectedCharacter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Tono emocional deseado
                  </label>
                  <input
                    type="text"
                    value={dialogueMood}
                    onChange={(e) => setDialogueMood(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Diálogo actual o idea de lo que dice
                </label>
                <input
                  type="text"
                  value={currentDialogue}
                  onChange={(e) => setCurrentDialogue(e.target.value)}
                  placeholder="Ej: Ya no podemos seguir ocultando lo que pasó anoche..."
                  className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateDialogues}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Generando opciones...' : 'Generar 3 Alternativas de Diálogo'}</span>
                </button>
              </div>

              {dialogueSuggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Opciones propuestas:
                  </span>
                  <div className="space-y-2">
                    {dialogueSuggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between gap-3"
                      >
                        <p className="font-script text-xs text-neutral-800 dark:text-neutral-200 italic">
                          "{sug}"
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sug);
                            alert('Diálogo copiado al portapapeles');
                          }}
                          className="px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded font-medium hover:bg-blue-100 shrink-0"
                        >
                          Copiar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                El supervisor de guion analiza el ritmo de las escenas actuales, la naturalidad de los diálogos y el apego a la norma estándar de la industria.
              </p>

              <button
                onClick={handleRunReview}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'Analizando guion...' : 'Iniciar Análisis Script Doctor'}</span>
              </button>

              {reviewFeedback && (
                <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line">
                  {reviewFeedback}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
