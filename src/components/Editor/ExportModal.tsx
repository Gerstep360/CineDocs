import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Upload,
  BookOpen,
  Sparkles,
  FileDown,
  X,
} from 'lucide-react';
import { ScriptBlock } from '../../types/script';
import { Exporters } from '../../lib/exporters';

interface ExportModalProps {
  blocks: ScriptBlock[];
  projectTitle: string;
  projectAuthor?: string;
  onImportBlocks: (blocks: ScriptBlock[], replace: boolean) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  blocks,
  projectTitle,
  projectAuthor,
  onImportBlocks,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'fountain' | 'txt' | 'import'>('pdf');
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [customTitle, setCustomTitle] = useState(projectTitle);
  const [customAuthor, setCustomAuthor] = useState(projectAuthor || 'Guionista');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Import State
  const [importedBlocks, setImportedBlocks] = useState<ScriptBlock[] | null>(null);
  const [importFileName, setImportFileName] = useState('');

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await Exporters.exportToPDF(blocks, {
        title: customTitle,
        author: customAuthor,
        includeTitlePage,
      });
      onClose();
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFountain = () => {
    const text = Exporters.exportToFountain(blocks, customTitle, customAuthor);
    const safeTitle = customTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
    Exporters.downloadBlob(text, `${safeTitle}.fountain`, 'text/plain;charset=utf-8');
  };

  const handleCopyFountain = () => {
    const text = Exporters.exportToFountain(blocks, customTitle, customAuthor);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTXT = () => {
    const text = Exporters.exportToPlainText(blocks, customTitle);
    const safeTitle = customTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
    Exporters.downloadBlob(text, `${safeTitle}.txt`, 'text/plain;charset=utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = Exporters.importFromFountain(content);
        setImportedBlocks(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = (replace: boolean) => {
    if (importedBlocks && importedBlocks.length > 0) {
      onImportBlocks(importedBlocks, replace);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <FileDown className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Exportar e Importar Guion
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          {[
            { id: 'pdf', label: 'PDF Profesional', icon: FileText },
            { id: 'fountain', label: 'Fountain (.fountain)', icon: BookOpen },
            { id: 'txt', label: 'Texto (.txt)', icon: FileText },
            { id: 'import', label: 'Importar Guion', icon: Upload },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Exporta un PDF real en formato estándar US Letter (8.5 × 11 pulgadas), con tipografía Courier, margen izquierdo para encuadernación (1.5 in), numeración de páginas correlativa y protección contra saltos huérfanos de personaje.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Título del Guion
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Autor / Crédito
                  </label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTitlePage}
                    onChange={(e) => setIncludeTitlePage(e.target.checked)}
                    className="rounded bg-neutral-800 text-blue-600 focus:ring-0"
                  />
                  <span>Incluir Portada Oficial de Guion (Title Page)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF Listo'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'fountain' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                El formato <strong>Fountain</strong> es el estándar abierto de la industria audiovisual para texto plano. Es 100% compatible con Final Draft, Highland, WriterDuet, Scrivener y fadein.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleExportFountain}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar archivo .fountain</span>
                </button>

                <button
                  onClick={handleCopyFountain}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar texto al portapapeles'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'txt' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Exporta el guion en texto sin formato con las sangrías y espacios estándar calculados para leer en cualquier editor de texto o imprimir directamente.
              </p>

              <div className="pt-2">
                <button
                  onClick={handleExportTXT}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar archivo .txt</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Importa un archivo en formato <strong>.fountain</strong> o <strong>.txt</strong>. El motor clasificará automáticamente encabezados de escena, personajes y diálogos.
              </p>

              <div className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center bg-neutral-50 dark:bg-neutral-800/40">
                <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <label className="inline-block px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-700 hover:bg-neutral-800 rounded-lg cursor-pointer">
                  <span>Seleccionar archivo .fountain o .txt</span>
                  <input
                    type="file"
                    accept=".fountain,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {importFileName && (
                  <p className="mt-2 text-xs text-blue-500 font-mono font-medium">
                    {importFileName}
                  </p>
                )}
              </div>

              {importedBlocks && (
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-medium">
                    <span>Bloques detectados:</span>
                    <span className="font-mono">{importedBlocks.length} elementos</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleConfirmImport(false)}
                      className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 rounded hover:bg-neutral-300"
                    >
                      Añadir al final del guion
                    </button>
                    <button
                      onClick={() => handleConfirmImport(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded"
                    >
                      Reemplazar guion actual
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
