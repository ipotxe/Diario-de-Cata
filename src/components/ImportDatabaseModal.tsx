import React, { useState, useRef, useMemo } from 'react';
import { BeerTasting } from '../types';
import {
  processImportFile,
  ParsedDatabaseResult,
  FieldMapping,
  convertRowsToTastings,
} from '../utils/importDatabase';

interface ImportDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (tastings: BeerTasting[], mode: 'merge' | 'replace') => void;
  existingCount: number;
}

const TARGET_FIELD_OPTIONS: { key: FieldMapping['targetField']; label: string }[] = [
  { key: 'ignore', label: '— Ignorar columna —' },
  { key: 'name', label: '🍺 Nombre de la Cerveza (Obligatorio)' },
  { key: 'brewery', label: '🏭 Cervecería / Productor' },
  { key: 'style', label: '🏷️ Estilo BJCP' },
  { key: 'abv', label: '🍷 Graduación Alcohólica ABV (%)' },
  { key: 'ibu', label: '🌿 Amargor IBU' },
  { key: 'rating', label: '⭐ Puntuación (1 a 5)' },
  { key: 'country', label: '🌍 País de Origen' },
  { key: 'srm', label: '🎨 Color SRM / EBC' },
  { key: 'notes', label: '📝 Notas de Cata / Comentario' },
  { key: 'pairing', label: '🍽️ Maridaje Recomendado' },
  { key: 'aromaDescriptors', label: '👃 Descriptores de Aroma' },
  { key: 'saborDescriptors', label: '👅 Descriptores de Sabor' },
  { key: 'otherDescriptors', label: '🏷️ Otros Descriptores / Tags' },
  { key: 'clarity', label: '👁️ Claridad (Cristalina, Velada, Opaco, Turbia, Transparente)' },
  { key: 'brillante', label: '✨ Brillante (Brillante / No Brillante)' },
  { key: 'foamType', label: '🫧 Tipo de Espuma (Cremosa, Jabonosa)' },
  { key: 'foamColor', label: '🎨 Color Espuma (Blanca, Hueso, Beige...)' },
  { key: 'foamAdherence', label: '🧲 Adherencia Espuma' },
  { key: 'foamPersistence', label: '⏳ Persistencia Espuma' },
  { key: 'carbonation', label: '💨 Carbonatación' },
  { key: 'imageUrl', label: '📷 URL de Fotografía' },
  { key: 'createdAt', label: '📅 Fecha de la Cata' },
  { key: 'aromaRadarDulce', label: '📊 Aroma: Dulce (0-5)' },
  { key: 'aromaRadarAmargo', label: '📊 Aroma: Amargo (0-5)' },
  { key: 'aromaRadarAcido', label: '📊 Aroma: Ácido (0-5)' },
  { key: 'aromaRadarLupulo', label: '📊 Aroma: Lúpulo (0-5)' },
  { key: 'aromaRadarMalta', label: '📊 Aroma: Malta (0-5)' },
  { key: 'saborRadarDulce', label: '📊 Sabor: Dulce (0-5)' },
  { key: 'saborRadarAmargo', label: '📊 Sabor: Amargo (0-5)' },
  { key: 'saborRadarSeco', label: '📊 Sabor: Seco (0-5)' },
  { key: 'saborRadarAcido', label: '📊 Sabor: Ácido (0-5)' },
  { key: 'saborRadarFusel', label: '📊 Sabor: Fusel (0-5)' },
];

export const ImportDatabaseModal: React.FC<ImportDatabaseModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingCount,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDatabaseResult | null>(null);
  const [activeMappings, setActiveMappings] = useState<FieldMapping[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [showMappingDetails, setShowMappingDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await processImportFile(file);
      setParsedData(result);
      setActiveMappings(result.suggestedMappings);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error procesando el archivo. Comprueba que sea un .csv o .json válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleMappingChange = (sourceColumn: string, targetField: FieldMapping['targetField']) => {
    setActiveMappings((prev) =>
      prev.map((m) => (m.sourceColumn === sourceColumn ? { ...m, targetField } : m))
    );
  };

  // Preview dinámico recalculado en tiempo real según los mapeos activos
  const currentPreviewTastings = useMemo(() => {
    if (!parsedData) return [];
    return convertRowsToTastings(parsedData.rawRows.slice(0, 3), activeMappings);
  }, [parsedData, activeMappings]);

  // Total de catas efectivas que se generarán
  const mappedCount = useMemo(() => {
    if (!parsedData) return 0;
    return convertRowsToTastings(parsedData.rawRows, activeMappings).length;
  }, [parsedData, activeMappings]);

  const handleConfirmImport = () => {
    if (!parsedData) return;
    const finalTastings = convertRowsToTastings(parsedData.rawRows, activeMappings);
    if (finalTastings.length === 0) {
      setErrorMessage('No se han podido generar catas válidas. Asegúrate de mapear al menos el "Nombre de la Cerveza".');
      return;
    }
    onImportComplete(finalTastings, importMode);
    onClose();
  };

  const mappedFieldCount = activeMappings.filter((m) => m.targetField !== 'ignore').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1e2020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#121414]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fbad18]/20 border border-[#fbad18]/40 flex items-center justify-center text-[#ffd18f]">
              <span className="material-symbols-outlined text-2xl">drive_folder_upload</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Importar Base de Datos
                <span className="px-2 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/30 text-[#ffd18f] text-[10px] font-mono font-bold rounded">
                  .CSV / .JSON
                </span>
              </h2>
              <p className="text-xs text-[#9f8e79]">
                Importa catas desde Notion, Untappd, Excel o copias de seguridad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#9f8e79] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {!parsedData ? (
            /* Upload Screen */
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-[#fbad18] bg-[#fbad18]/10 scale-[0.99]'
                    : 'border-white/15 hover:border-[#fbad18]/50 bg-[#121414]/50 hover:bg-[#121414]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-14 h-14 rounded-full bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#fbad18] mb-3">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">
                  Arrastra tu archivo aquí o haz clic para explorar
                </p>
                <p className="text-xs text-[#9f8e79] max-w-sm">
                  Formatos soportados: <strong>.CSV</strong> (delimitado por comas, punto y coma o tabulaciones) y <strong>.JSON</strong> (Notion, Untappd o copias de seguridad).
                </p>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#121414] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#ffd18f]">
                    <span className="material-symbols-outlined text-sm text-[#fbad18]">auto_awesome</span>
                    Detección Inteligente
                  </div>
                  <p className="text-[11px] text-[#9f8e79] leading-relaxed">
                    El sistema analiza automáticamente las cabeceras de tu archivo (nombre, cervecera, ABV, IBU, notas, etc.) y las asigna a los campos de la app.
                  </p>
                </div>
                <div className="p-3 bg-[#121414] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#ffd18f]">
                    <span className="material-symbols-outlined text-sm text-[#fbad18]">verified</span>
                    Estandarización BJCP
                  </div>
                  <p className="text-[11px] text-[#9f8e79] leading-relaxed">
                    Los estilos de cerveza importados se normalizan de forma automática con la Guía de Estilos BJCP oficial.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Analysis & Field Mapping Screen */
            <div className="space-y-4">
              {/* File Summary Badge */}
              <div className="p-3.5 bg-[#121414] border border-white/10 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#fbad18]/20 border border-[#fbad18]/40 flex items-center justify-center text-[#ffd18f]">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                      {parsedData.fileName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#9f8e79]">
                      <span className="uppercase font-mono font-bold text-[#ffd18f]">
                        {parsedData.fileType}
                      </span>
                      <span>•</span>
                      <span>{parsedData.totalRows} registros encontrados</span>
                      <span>•</span>
                      <span className="text-[#7ef24a] font-medium">
                        {mappedFieldCount} campos asignados
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-[#9f8e79] hover:text-[#ffd18f] underline px-2 py-1"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Analysis & Mapping Header Accordion */}
              <div className="border border-white/10 rounded-xl bg-[#121414] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMappingDetails(!showMappingDetails)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#fbad18]">tune</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Mapeo de Campos de la Base de Datos ({mappedFieldCount} activos)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#ffd18f]">
                      {showMappingDetails ? 'Ocultar ajustes' : 'Revisar / Modificar'}
                    </span>
                    <span className="material-symbols-outlined text-base text-[#9f8e79]">
                      {showMappingDetails ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {showMappingDetails && (
                  <div className="p-3.5 border-t border-white/10 space-y-2.5 max-h-60 overflow-y-auto">
                    <p className="text-[11px] text-[#9f8e79]">
                      Comprueba cómo se asignan las columnas de tu archivo a los campos de la cata. Puedes reasignar cualquier campo:
                    </p>
                    <div className="space-y-2">
                      {activeMappings.map((mapping) => (
                        <div
                          key={mapping.sourceColumn}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-[#1e2020] border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 font-mono text-[#ffd18f] truncate max-w-xs">
                            <span className="material-symbols-outlined text-sm text-[#9f8e79]">table_chart</span>
                            <span className="truncate">{mapping.sourceColumn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#9f8e79] text-xs">➔</span>
                            <select
                              value={mapping.targetField}
                              onChange={(e) =>
                                handleMappingChange(
                                  mapping.sourceColumn,
                                  e.target.value as FieldMapping['targetField']
                                )
                              }
                              className="bg-[#121414] border border-white/15 text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-[#fbad18] focus:outline-none"
                            >
                              {TARGET_FIELD_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#7ef24a]">visibility</span>
                    Vista previa de las catas que se generarán:
                  </h4>
                  <span className="text-[11px] text-[#9f8e79]">
                    Mostrando primeras {currentPreviewTastings.length} de {mappedCount}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {currentPreviewTastings.map((beer, idx) => (
                    <div
                      key={beer.id || idx}
                      className="p-3 bg-[#121414] border border-white/10 rounded-xl flex items-center gap-3"
                    >
                      <img
                        src={beer.imageUrl}
                        alt={beer.name}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{beer.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fbad18]/20 text-[#ffd18f] font-mono">
                            {beer.style}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#d7c4ad] mt-0.5">
                          <span className="truncate">{beer.brewery}</span>
                          <span>•</span>
                          <span>{beer.abv}% ABV</span>
                          <span>•</span>
                          <span>{beer.ibu} IBU</span>
                          <span>•</span>
                          <span className="text-[#ffd18f] font-bold">★ {beer.rating}</span>
                        </div>
                        {beer.notes && (
                          <p className="text-[10px] text-[#9f8e79] italic truncate mt-0.5">
                            "{beer.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="p-3.5 bg-[#121414] border border-white/10 rounded-xl space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Modo de Importación:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      importMode === 'merge'
                        ? 'border-[#7ef24a] bg-[#7ef24a]/10 text-white'
                        : 'border-white/10 hover:border-white/20 bg-[#1e2020] text-[#9f8e79]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                        importMode === 'merge' ? 'text-[#7ef24a]' : 'text-[#9f8e79]'
                      }`}
                    >
                      {importMode === 'merge' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Añadir a las existentes</div>
                      <div className="text-[11px] text-[#9f8e79]">
                        Conserva tus {existingCount} catas actuales y suma las {mappedCount} importadas.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      importMode === 'replace'
                        ? 'border-red-400 bg-red-500/10 text-white'
                        : 'border-white/10 hover:border-white/20 bg-[#1e2020] text-[#9f8e79]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                        importMode === 'replace' ? 'text-red-400' : 'text-[#9f8e79]'
                      }`}
                    >
                      {importMode === 'replace' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Reemplazar todo</div>
                      <div className="text-[11px] text-[#9f8e79]">
                        Sustituye tus catas actuales por las {mappedCount} del archivo.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#121414]/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-[#d7c4ad] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>

          {parsedData && (
            <button
              type="button"
              disabled={isProcessing || mappedCount === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">download_done</span>
              Importar {mappedCount} {mappedCount === 1 ? 'Cata' : 'Catas'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
