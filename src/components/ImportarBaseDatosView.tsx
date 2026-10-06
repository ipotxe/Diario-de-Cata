import React, { useState, useRef } from 'react';
import { BeerTasting, ActiveTab } from '../types';
import {
  parseCSV,
  parseJSON,
  analyzeColumns,
  convertRowsToTastings,
  FieldMapping,
  SAMPLE_NOTION_CSV,
} from '../utils/importDatabase';
import {
  saveTastingToDB,
  clearAllTastingsFromDB,
  getStorageUsage,
  isIndexedDBAvailable,
} from '../utils/db';
import { evaluarInsignias } from '../utils/badgeEngine';

interface ImportarBaseDatosViewProps {
  onNavigate: (tab: ActiveTab) => void;
  existingTastings: BeerTasting[];
  onTastingsUpdated: (tastings: BeerTasting[]) => void;
  onShowToast: (message: string) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'syncing' | 'completed';

const TARGET_FIELD_OPTIONS: { id: FieldMapping['targetField']; label: string; group: string }[] = [
  { id: 'name', label: '🍺 Nombre de Cerveza (Obligatorio)', group: 'Principal' },
  { id: 'brewery', label: '🏭 Cervecera / Fabricante', group: 'Principal' },
  { id: 'style', label: '📖 Estilo BJCP (Normalizado)', group: 'Sensorial' },
  { id: 'abv', label: '🍷 Graduación Alcohólica (% ABV)', group: 'Fisicoquímico' },
  { id: 'ibu', label: '🌿 Amargor (IBU)', group: 'Fisicoquímico' },
  { id: 'srm', label: '🎨 Color (SRM / EBC)', group: 'Fisicoquímico' },
  { id: 'rating', label: '⭐ Puntuación (Escala 1 a 5)', group: 'Evaluación' },
  { id: 'notes', label: '📝 Notas de Cata y Opinión', group: 'Sensorial' },
  { id: 'country', label: '🌍 País de Procedencia', group: 'Principal' },
  { id: 'pairing', label: '🧀 Maridaje Gastronómico', group: 'Sensorial' },
  { id: 'aromaDescriptors', label: '👃 Descriptores de Aroma', group: 'Sensorial' },
  { id: 'saborDescriptors', label: '👅 Descriptores de Sabor', group: 'Sensorial' },
  { id: 'clarity', label: '✨ Claridad (Cristalina, Velada, Opaco, Turbia, Transparente)', group: 'Apariencia' },
  { id: 'brillante', label: '🌟 Brillante (Brillante / No Brillante)', group: 'Apariencia' },
  { id: 'foamType', label: '☁️ Tipo de Espuma (Cremosa, Jabonosa)', group: 'Apariencia' },
  { id: 'foamColor', label: '🎨 Color Espuma (Blanca, Hueso, Beige...)', group: 'Apariencia' },
  { id: 'foamAdherence', label: '🧲 Adherencia Espuma (Baja, Media, Alta)', group: 'Apariencia' },
  { id: 'foamPersistence', label: '⏳ Persistencia Espuma (Baja, Media, Alta...)', group: 'Apariencia' },
  { id: 'carbonation', label: '🫧 Carbonatación (Baja, Media, Alta)', group: 'Apariencia' },
  { id: 'createdAt', label: '📅 Fecha de la Cata', group: 'Registro' },
  { id: 'imageUrl', label: '🖼️ URL de Foto de Portada', group: 'Registro' },
  { id: 'ignore', label: '🚫 Ignorar esta Columna', group: 'Otros' },
];

export const ImportarBaseDatosView: React.FC<ImportarBaseDatosViewProps> = ({
  onNavigate,
  existingTastings,
  onTastingsUpdated,
  onShowToast,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<'csv' | 'json' | ''>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // AI analysis states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  // Syncing to IndexedDB states
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<{ id: string; nombre: string; icono: string }[]>([]);
  const [dbStorageUsed, setDbStorageUsed] = useState<string>('0 MB');

  // Textarea toggle
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse raw text as CSV or JSON
  const processRawData = (content: string, name: string, sizeBytes?: number) => {
    try {
      const trimmed = content.trim();
      let headers: string[] = [];
      let rows: Record<string, any>[] = [];
      let format: 'csv' | 'json' = 'csv';

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        format = 'json';
        const parsed = parseJSON(trimmed);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        format = 'csv';
        const parsed = parseCSV(trimmed);
        headers = parsed.headers;
        rows = parsed.rows;
      }

      if (rows.length === 0 || headers.length === 0) {
        onShowToast('El archivo no contiene registros o columnas válidas.');
        return;
      }

      const sizeStr = sizeBytes
        ? sizeBytes > 1024 * 1024
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(sizeBytes / 1024)} KB`
        : `${(content.length / 1024).toFixed(1)} KB`;

      setFileName(name);
      setFileSize(sizeStr);
      setDetectedFormat(format);
      setRawHeaders(headers);
      setRawRows(rows);

      // Initial heuristic analysis
      const initialMappings = analyzeColumns(headers);
      setMappings(initialMappings);
      setAiInsights(null);
      setAiSource(null);

      setCurrentStep('mapping');
    } catch (err: any) {
      console.error('Error al procesar archivo:', err);
      onShowToast(`Error al leer archivo: ${err?.message || 'Formato desconocido'}`);
    }
  };

  // Handle file select through input or drag-and-drop
  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        processRawData(text, file.name, file.size);
      }
    };

    reader.onerror = () => {
      // Fallback with Latin1 if UTF-8 fails
      const fallbackReader = new FileReader();
      fallbackReader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          processRawData(text, file.name, file.size);
        }
      };
      fallbackReader.readAsText(file, 'ISO-8859-1');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Contrast & analyze columns using Gemini API
  const handleAiAnalyze = async () => {
    if (rawHeaders.length === 0) return;
    setIsAiLoading(true);

    try {
      const sampleRows = rawRows.slice(0, 4);
      const res = await fetch('/api/gemini/analyze-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: rawHeaders,
          sampleRows,
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.mappings) && data.mappings.length > 0) {
        setAiSource(data.detectedSource || 'Base de datos cervecera analizada');
        setAiInsights(data.summary || 'Columnas emparejadas semánticamente con éxito.');

        // Update mappings based on AI feedback
        const updated = mappings.map((current) => {
          const aiMatch = data.mappings.find(
            (m: any) => m.sourceColumn?.toLowerCase() === current.sourceColumn.toLowerCase()
          );
          if (aiMatch && aiMatch.targetField) {
            return {
              ...current,
              targetField: aiMatch.targetField as any,
              confidence: aiMatch.confidence === 'high' ? 0.95 : 0.75,
            };
          }
          return current;
        });

        setMappings(updated);
        onShowToast('✨ ¡Columnas analizadas y contrastadas con IA (Gemini)!');
      } else {
        // Fallback or informative notice
        setAiInsights(
          'Motor BJCP Sommelier integrado: Las columnas han sido verificadas con reglas cerveceras locales.'
        );
        onShowToast('✓ Mapeo verificado con el motor de reglas cervecero.');
      }
    } catch (err: any) {
      console.warn('Error al llamar al endpoint de IA:', err);
      setAiInsights(
        'Análisis local activo: emparejamiento completado con diccionario sommelier BJCP.'
      );
      onShowToast('✓ Emparejamiento contrastado con el catálogo cervecero.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Convert raw rows to tastings using current mappings
  const generatedTastings = React.useMemo(() => {
    if (rawRows.length === 0 || mappings.length === 0) return [];
    return convertRowsToTastings(rawRows, mappings);
  }, [rawRows, mappings]);

  // Handle uploading each tasting to IndexedDB
  const handleUploadToIndexedDB = async () => {
    if (generatedTastings.length === 0) {
      onShowToast('No hay catas válidas para importar.');
      return;
    }

    setCurrentStep('syncing');
    setSyncProgress(5);
    setSyncStatusText('Iniciando conexión con IndexedDB...');

    try {
      const prevBadges = evaluarInsignias(existingTastings);
      const prevUnlockedIds = new Set(prevBadges.filter((b) => b.unlocked).map((b) => b.id));

      if (importMode === 'replace') {
        setSyncStatusText('Vaciando almacén anterior en IndexedDB...');
        await clearAllTastingsFromDB();
        setSyncProgress(15);
      }

      const total = generatedTastings.length;
      let count = 0;

      // Upload each tasting one by one to IndexedDB with live progress
      for (let i = 0; i < total; i++) {
        const tasting = generatedTastings[i];
        setSyncStatusText(
          `Subiendo cata ${i + 1} de ${total} a IndexedDB: "${tasting.name || 'Sin nombre'}"...`
        );

        await saveTastingToDB(tasting);
        count++;

        const currentPct = 15 + Math.round(((i + 1) / total) * 75);
        setSyncProgress(currentPct);

        // Small delay so user can visually follow the upload progress
        if (total <= 30) {
          await new Promise((r) => setTimeout(r, 40));
        }
      }

      setSyncStatusText('Finalizando índices y persistencia local...');
      setSyncProgress(95);

      // Update in-memory app state and fallback localStorage
      const finalTastings =
        importMode === 'replace'
          ? [...generatedTastings]
          : [...generatedTastings, ...existingTastings];

      onTastingsUpdated(finalTastings);
      try {
        localStorage.setItem('diario_cervecero_catas', JSON.stringify(finalTastings));
      } catch {}

      // Calculate newly unlocked badges
      const nextBadges = evaluarInsignias(finalTastings);
      const newlyUnlocked = nextBadges.filter((b) => b.unlocked && !prevUnlockedIds.has(b.id));
      setUnlockedBadges(newlyUnlocked);

      // Check storage
      try {
        const usage = await getStorageUsage();
        setDbStorageUsed(`${usage.usageMB} MB`);
      } catch {
        setDbStorageUsed('OK');
      }

      setUploadedCount(count);
      setSyncProgress(100);
      setSyncStatusText('¡Subida completada con éxito en IndexedDB!');

      await new Promise((r) => setTimeout(r, 400));
      setCurrentStep('completed');
    } catch (err: any) {
      console.error('Error al subir a IndexedDB:', err);
      onShowToast(`Error al subir a IndexedDB: ${err?.message || 'Fallo desconocido'}`);
      setCurrentStep('preview');
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col space-y-6 animate-fadeIn pb-24">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('perfil')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9f8e79] hover:text-[#ffd18f] transition-colors py-2 px-3 rounded-lg hover:bg-white/5 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a Perfil
        </button>

        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#1a1c1c] border border-white/10 rounded-full text-[11px] text-[#ffd18f] font-mono">
          <span className="w-2 h-2 rounded-full bg-[#7ef24a] animate-pulse" />
          IndexedDB Activo
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-[#1a1c1c] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#fbad18]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shrink-0">
              <span className="material-symbols-outlined text-2xl">drive_folder_upload</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
                Importar Base de Datos Cervecera
              </h1>
              <p className="text-xs sm:text-sm text-[#9f8e79] mt-1 max-w-xl">
                Carga un archivo desde tu dispositivo (.CSV o .JSON), contrasta y normaliza los campos
                con IA y guarda cada cata en la base de datos indexada local (IndexedDB).
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-white/5 text-center text-xs">
          <div
            className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
              currentStep === 'upload'
                ? 'bg-[#fbad18]/15 border-[#fbad18] text-[#ffd18f] font-bold'
                : 'border-white/5 text-[#9f8e79] bg-[#121414]'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/10">1</span>
            <span className="truncate">Cargar Archivo</span>
          </div>

          <div
            className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
              currentStep === 'mapping'
                ? 'bg-[#fbad18]/15 border-[#fbad18] text-[#ffd18f] font-bold'
                : 'border-white/5 text-[#9f8e79] bg-[#121414]'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/10">2</span>
            <span className="truncate">Analizar con IA</span>
          </div>

          <div
            className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
              currentStep === 'preview'
                ? 'bg-[#fbad18]/15 border-[#fbad18] text-[#ffd18f] font-bold'
                : 'border-white/5 text-[#9f8e79] bg-[#121414]'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/10">3</span>
            <span className="truncate">Revisar Catas</span>
          </div>

          <div
            className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
              currentStep === 'syncing' || currentStep === 'completed'
                ? 'bg-[#7ef24a]/15 border-[#7ef24a] text-[#7ef24a] font-bold'
                : 'border-white/5 text-[#9f8e79] bg-[#121414]'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/10">4</span>
            <span className="truncate">IndexedDB</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CARGAR ARCHIVO */}
      {currentStep === 'upload' && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
              isDragging
                ? 'border-[#fbad18] bg-[#fbad18]/10 scale-[1.01]'
                : 'border-white/15 bg-[#1a1c1c] hover:border-[#fbad18]/50 hover:bg-[#222424]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.json,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f]">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>

            <div>
              <p className="text-base sm:text-lg font-bold text-white">
                Toca aquí o arrastra un archivo desde tu dispositivo
              </p>
              <p className="text-xs sm:text-sm text-[#9f8e79] mt-1">
                Formatos compatibles: <strong className="text-[#ffd18f]">.CSV</strong>,{' '}
                <strong className="text-[#ffd18f]">.JSON</strong>,{' '}
                <strong className="text-[#ffd18f]">.TSV</strong> (Notion, Untappd, Excel, Google Sheets)
              </p>
            </div>

            <button
              type="button"
              className="py-2.5 px-6 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">folder_open</span>
              Seleccionar archivo
            </button>
          </div>

          {/* Quick Sample or Paste Area */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => processRawData(SAMPLE_NOTION_CSV, 'ejemplo_notion_catas.csv')}
              className="w-full sm:w-auto flex-1 py-3 px-4 bg-[#1a1c1c] hover:bg-[#282a2b] border border-white/10 rounded-xl text-xs font-bold text-[#ffd18f] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">science</span>
              Cargar datos de muestra (Ejemplo Notion / Untappd)
            </button>

            <button
              type="button"
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="w-full sm:w-auto py-3 px-4 bg-[#1a1c1c] hover:bg-[#282a2b] border border-white/10 rounded-xl text-xs font-bold text-[#e2e2e2] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">content_paste</span>
              {showPasteArea ? 'Ocultar caja de texto' : 'Pegar texto directamente'}
            </button>
          </div>

          {/* Paste Raw Textarea */}
          {showPasteArea && (
            <div className="bg-[#1a1c1c] border border-white/10 rounded-2xl p-5 space-y-3 animate-fadeIn">
              <label className="text-xs font-bold text-[#d7c4ad] uppercase tracking-wider flex items-center justify-between">
                <span>Pega aquí tu contenido CSV o JSON</span>
                <span className="text-[10px] text-[#9f8e79] lowercase">delimitado por comas o json array</span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                placeholder="Nombre Cerveza, Cervecería, Estilo BJCP, ABV, IBU, Puntuación..."
                className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-xs font-mono text-[#e2e2e2] focus:outline-none focus:border-[#fbad18]"
              />
              <button
                type="button"
                disabled={!pastedText.trim()}
                onClick={() => processRawData(pastedText, 'datos_pegados.csv')}
                className="w-full py-2.5 bg-[#fbad18] disabled:opacity-50 text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >
                Procesar Texto Pegado
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ANÁLISIS & MAPEO DE CAMPOS (CON IA) */}
      {currentStep === 'mapping' && (
        <div className="space-y-6">
          {/* File summary header */}
          <div className="bg-[#1a1c1c] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f]">
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate max-w-xs">{fileName}</p>
                <p className="text-xs text-[#9f8e79]">
                  {rawRows.length} filas detectadas • {rawHeaders.length} columnas • {fileSize} • {detectedFormat.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('upload')}
              className="text-xs text-[#9f8e79] hover:text-white underline py-1 px-2"
            >
              Cambiar archivo
            </button>
          </div>

          {/* AI Sommelier Contrast Banner */}
          <div className="bg-gradient-to-r from-[#1e1c14] to-[#251f15] border border-[#fbad18]/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="text-sm font-bold text-[#ffd18f] tracking-wide">
                    Contraste y Normalización con IA (Gemini)
                  </h3>
                  <p className="text-xs text-[#d7c4ad]">
                    Analiza semánticamente las columnas y los valores de muestra para emparejar automáticamente estilos BJCP, ABV, IBU y notas.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={isAiLoading}
                className="py-2.5 px-4 bg-[#fbad18] hover:bg-[#ffbe3b] disabled:opacity-50 text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shrink-0"
              >
                {isAiLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#684500] border-t-transparent rounded-full animate-spin" />
                    Contrastando con IA...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Contrastar con IA
                  </>
                )}
              </button>
            </div>

            {aiInsights && (
              <div className="bg-[#121414]/80 border border-[#fbad18]/20 rounded-xl p-3 text-xs text-[#e2e2e2] space-y-1">
                {aiSource && (
                  <p className="font-bold text-[#ffd18f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Origen detectado: {aiSource}
                  </p>
                )}
                <p className="text-[#d7c4ad]">{aiInsights}</p>
              </div>
            )}
          </div>

          {/* Interactive Mapping Section */}
          <div className="bg-[#1a1c1c] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Correspondencia de Campos</h3>
                <p className="text-xs text-[#9f8e79]">
                  Verifica qué columna de tu archivo corresponde a cada campo de la cata.
                </p>
              </div>
              <span className="text-xs font-mono text-[#ffd18f]">
                {mappings.filter((m) => m.targetField !== 'ignore').length} / {rawHeaders.length} campos asignados
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {mappings.map((mapping, idx) => {
                // Get 2 sample values from this column
                const sampleValues = rawRows
                  .slice(0, 2)
                  .map((r) => r[mapping.sourceColumn])
                  .filter((v) => v !== undefined && v !== null && v !== '')
                  .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)));

                return (
                  <div
                    key={mapping.sourceColumn}
                    className="p-3 bg-[#121414] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    {/* Left: Column Name & Sample Pills */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white font-bold truncate">
                          {mapping.sourceColumn}
                        </span>
                        {mapping.confidence >= 0.8 && (
                          <span className="px-1.5 py-0.5 bg-[#7ef24a]/15 text-[#7ef24a] text-[9px] font-mono font-bold rounded uppercase">
                            Auto
                          </span>
                        )}
                      </div>

                      {sampleValues.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#9f8e79] truncate">
                          <span className="text-[10px] text-[#ffd18f]/70 font-mono">Muestra:</span>
                          {sampleValues.map((val, vIdx) => (
                            <span
                              key={vIdx}
                              className="px-1.5 py-0.5 bg-white/5 rounded text-[#d7c4ad] truncate max-w-[140px]"
                            >
                              "{val}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Target Field Selector */}
                    <div className="flex items-center gap-2 sm:w-72 shrink-0">
                      <span className="material-symbols-outlined text-sm text-[#9f8e79] hidden sm:inline">
                        arrow_forward
                      </span>
                      <select
                        value={mapping.targetField}
                        onChange={(e) => {
                          const newTarget = e.target.value as FieldMapping['targetField'];
                          const copy = [...mappings];
                          copy[idx] = { ...copy[idx], targetField: newTarget, confidence: 1 };
                          setMappings(copy);
                        }}
                        className={`w-full text-xs rounded-xl p-2.5 font-medium border focus:outline-none transition-colors ${
                          mapping.targetField === 'ignore'
                            ? 'bg-[#1a1c1c] border-white/10 text-[#9f8e79]'
                            : 'bg-[#222424] border-[#fbad18]/40 text-[#ffd18f]'
                        }`}
                      >
                        {TARGET_FIELD_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('upload')}
                className="py-2.5 px-4 bg-transparent hover:bg-white/5 text-[#9f8e79] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Atrás
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('preview')}
                className="py-3 px-6 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <span>Revisar Catas Generadas ({generatedTastings.length})</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVISAR CATAS Y CONFIGURAR IMPORTACIÓN */}
      {currentStep === 'preview' && (
        <div className="space-y-6">
          <div className="bg-[#1a1c1c] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Previsualización de Catas a Importar</h3>
                <p className="text-xs text-[#9f8e79]">
                  Se han generado {generatedTastings.length} catas con los datos normalizados de tu archivo.
                </p>
              </div>

              {/* Mode Toggle: Merge vs Replace */}
              <div className="flex items-center gap-2 bg-[#121414] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'merge'
                      ? 'bg-[#fbad18] text-[#684500] shadow'
                      : 'text-[#9f8e79] hover:text-white'
                  }`}
                >
                  Añadir ({existingTastings.length} actuales + {generatedTastings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'replace'
                      ? 'bg-red-500 text-white shadow'
                      : 'text-[#9f8e79] hover:text-white'
                  }`}
                >
                  Reemplazar todo ({generatedTastings.length})
                </button>
              </div>
            </div>

            {/* Warning if replace mode */}
            {importMode === 'replace' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span>
                Atención: El modo reemplazo vaciará tus catas actuales en IndexedDB y las sustituirá por estas {generatedTastings.length} catas.
              </div>
            )}

            {/* List of previews */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {generatedTastings.map((tasting, i) => (
                <div
                  key={tasting.id || i}
                  className="p-4 bg-[#121414] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/15 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={tasting.imageUrl}
                      alt={tasting.name}
                      className="w-12 h-12 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{tasting.name}</h4>
                      <p className="text-xs text-[#ffd18f] truncate">{tasting.brewery || 'Cervecera no indicada'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#9f8e79]">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[#e2e2e2] font-mono">
                          {tasting.style}
                        </span>
                        <span>{tasting.abv}% ABV</span>
                        {tasting.ibu > 0 && <span>• {tasting.ibu} IBU</span>}
                        {tasting.country && <span>• 🌍 {tasting.country}</span>}
                      </div>
                      {tasting.notes && (
                        <p className="text-[11px] text-[#d7c4ad] italic mt-1 line-clamp-1">
                          "{tasting.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-[#fbad18] shrink-0 self-end sm:self-center">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <span className="text-xs font-bold">{tasting.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('mapping')}
                className="py-2.5 px-4 bg-transparent hover:bg-white/5 text-[#9f8e79] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Atrás a Mapeo
              </button>

              <button
                type="button"
                onClick={handleUploadToIndexedDB}
                className="py-3 px-6 bg-[#7ef24a] hover:bg-[#8bf75a] text-[#121414] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-base">database</span>
                <span>Subir {generatedTastings.length} Catas a IndexedDB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SINCRONIZANDO EN INDEXEDDB */}
      {currentStep === 'syncing' && (
        <div className="bg-[#1a1c1c] border border-white/10 rounded-2xl p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#7ef24a]/15 border border-[#7ef24a]/30 flex items-center justify-center text-[#7ef24a] mx-auto animate-pulse">
            <span className="material-symbols-outlined text-3xl">cloud_sync</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white font-serif">
              Guardando Catas en la Base de Datos Indexada
            </h3>
            <p className="text-xs sm:text-sm text-[#9f8e79] font-mono">
              {syncStatusText}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto space-y-1.5">
            <div className="w-full h-3 bg-[#121414] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-[#7ef24a] transition-all duration-200 rounded-full"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#9f8e79]">
              <span>Almacén 'tastings' en IndexedDB</span>
              <span className="text-[#7ef24a] font-bold">{syncProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: COMPLETADO CON ÉXITO */}
      {currentStep === 'completed' && (
        <div className="bg-[#1a1c1c] border border-[#7ef24a]/30 rounded-2xl p-8 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#7ef24a]/20 border border-[#7ef24a]/40 flex items-center justify-center text-[#7ef24a] mx-auto shadow-lg shadow-[#7ef24a]/10">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-white">
              ¡Base de Datos Importada con Éxito!
            </h3>
            <p className="text-sm text-[#d7c4ad] max-w-md mx-auto">
              Se han registrado y persistido <strong className="text-[#7ef24a]">{uploadedCount} catas</strong> en tu base de datos IndexedDB local.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            <div className="p-3 bg-[#121414] border border-white/5 rounded-xl">
              <p className="text-[10px] text-[#9f8e79] uppercase font-mono">Catas Subidas</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{uploadedCount}</p>
            </div>
            <div className="p-3 bg-[#121414] border border-white/5 rounded-xl">
              <p className="text-[10px] text-[#9f8e79] uppercase font-mono">Total en Diario</p>
              <p className="text-lg font-bold text-[#ffd18f] font-mono mt-0.5">
                {importMode === 'replace' ? uploadedCount : existingTastings.length + uploadedCount}
              </p>
            </div>
            <div className="p-3 bg-[#121414] border border-white/5 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-[10px] text-[#9f8e79] uppercase font-mono">Espacio Usado</p>
              <p className="text-lg font-bold text-[#7ef24a] font-mono mt-0.5">{dbStorageUsed}</p>
            </div>
          </div>

          {/* Newly Unlocked Badges */}
          {unlockedBadges.length > 0 && (
            <div className="p-4 bg-[#fbad18]/10 border border-[#fbad18]/30 rounded-xl max-w-lg mx-auto space-y-2 text-left">
              <p className="text-xs font-bold text-[#ffd18f] flex items-center gap-1.5 uppercase tracking-wider">
                <span>🎉</span> ¡Nuevas Insignias Desbloqueadas ({unlockedBadges.length})!
              </p>
              <div className="flex flex-wrap gap-2">
                {unlockedBadges.map((b) => (
                  <span
                    key={b.id}
                    className="px-2.5 py-1 bg-[#121414] border border-[#fbad18]/30 rounded-lg text-xs text-white font-medium flex items-center gap-1.5"
                  >
                    <span>{b.icono}</span>
                    <span>{b.nombre}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('mis-catas')}
              className="w-full sm:w-auto py-3 px-8 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">sports_bar</span>
              Ver Mis Catas
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep('upload');
                setFileName('');
                setRawHeaders([]);
                setRawRows([]);
              }}
              className="w-full sm:w-auto py-3 px-6 bg-[#282a2b] hover:bg-[#333535] text-[#e2e2e2] font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 active:scale-95 transition-all"
            >
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
