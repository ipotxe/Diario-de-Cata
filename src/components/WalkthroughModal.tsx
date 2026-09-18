import React, { useState, useEffect } from 'react';
import { srmToHex } from '../data/initialData';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFirstCata: () => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onStartFirstCata,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Interactive mini-states for hands-on learning in each step
  const [interactiveSrm, setInteractiveSrm] = useState(8);
  const [selectedDescriptors, setSelectedDescriptors] = useState<string[]>(['Cítrico', 'Lúpulo Fresco']);
  const [interactiveRating, setInteractiveRating] = useState(4.5);
  const [demoScanned, setDemoScanned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('diario_cervecero_walkthrough_completed', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  const handleStartNow = () => {
    try {
      localStorage.setItem('diario_cervecero_walkthrough_completed', 'true');
    } catch {
      // ignore
    }
    onClose();
    onStartFirstCata();
  };

  const toggleDescriptor = (desc: string) => {
    setSelectedDescriptors((prev) =>
      prev.includes(desc) ? prev.filter((d) => d !== desc) : [...prev, desc]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#1a1c1c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header with Progress and Skip button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 shrink-0 bg-[#121414]/60">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#fbad18]/20 border border-[#fbad18]/40 text-[#ffd18f] font-mono text-[11px] font-bold uppercase tracking-wider">
              Paso {currentStep + 1} de {totalSteps}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === idx
                      ? 'w-6 bg-[#fbad18]'
                      : idx < currentStep
                      ? 'w-2 bg-[#ffd18f]/50'
                      : 'w-2 bg-white/20'
                  }`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="text-xs font-semibold text-[#9f8e79] hover:text-[#ffd18f] py-1 px-2.5 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
          >
            Saltar
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* STEP 0: Welcome */}
          {currentStep === 0 && (
            <div className="space-y-4 text-center sm:text-left">
              <div className="w-16 h-16 mx-auto sm:mx-0 rounded-2xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shadow-lg">
                <span className="material-symbols-outlined text-3xl">sports_bar</span>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-white leading-snug">
                  ¡Bienvenido a tu Diario del Cervecero!
                </h2>
                <p className="text-sm text-[#d7c4ad] mt-1.5 leading-relaxed">
                  Tu cuaderno digital profesional para registrar, catar y redescubrir cada cerveza como un auténtico <strong className="text-[#ffd18f]">Sommelier Cervecero</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                <div className="p-3 bg-[#121414] rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#7ef24a] text-xl shrink-0 mt-0.5">
                    database
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#e2e2e2]">IndexedDB Ilimitado</h4>
                    <p className="text-[11px] text-[#9f8e79] mt-0.5">
                      Tus catas y fotos de alta resolución guardadas de forma 100% local y segura.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#121414] rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#ffd18f] text-xl shrink-0 mt-0.5">
                    qr_code_scanner
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#e2e2e2]">Escáner de Código</h4>
                    <p className="text-[11px] text-[#9f8e79] mt-0.5">
                      Relleno instantáneo de datos y estilo con la cámara de tu teléfono.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#121414] rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#fbad18] text-xl shrink-0 mt-0.5">
                    radar
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#e2e2e2]">Gráficos Pentaxiales</h4>
                    <p className="text-[11px] text-[#9f8e79] mt-0.5">
                      Evaluación precisa de aroma y sabor en radares sensoriales especializados.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#121414] rounded-xl border border-white/5 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#ffd18f] text-xl shrink-0 mt-0.5">
                    military_tech
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#e2e2e2]">Insignias Cerveceras</h4>
                    <p className="text-[11px] text-[#9f8e79] mt-0.5">
                      Desbloquea logros por explorar estilos, países y lúpulos de todo el mundo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Identification & Barcode Scanner */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shrink-0">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    1. Identificación y Escáner
                  </h3>
                  <p className="text-xs text-[#9f8e79]">
                    Nombre, fábrica, procedencia y catálogo BJCP
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#d7c4ad] leading-relaxed">
                Al pulsar en <strong>"Nueva Cata"</strong>, puedes escribir manualmente los datos o usar el botón de escáner para apuntar al código de barras de la botella o lata.
              </p>

              {/* Interactive Demo Area */}
              <div className="p-4 bg-[#121414] rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#ffd18f] uppercase tracking-wider text-[11px]">
                    Simulador Interactivo:
                  </span>
                  <button
                    type="button"
                    onClick={() => setDemoScanned(!demoScanned)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold rounded-lg text-xs active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {demoScanned ? 'refresh' : 'barcode_scanner'}
                    </span>
                    {demoScanned ? 'Restablecer' : 'Probar Escaneo Rápido'}
                  </button>
                </div>

                <div className="bg-[#1e2020] p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9f8e79]">Cerveza:</span>
                    <span className="font-semibold text-white">
                      {demoScanned ? 'Duvel Belgian Strong Blond' : 'Pendiente de escanear...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9f8e79]">Cervecería / País:</span>
                    <span className="text-[#d7c4ad]">
                      {demoScanned ? 'Duvel Moortgat • Bélgica 🇧🇪' : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9f8e79]">Estilo Sugerido:</span>
                    <span className="px-2 py-0.5 bg-[#fbad18]/20 text-[#ffd18f] rounded font-mono text-[10px] font-bold">
                      {demoScanned ? 'Belgian Golden Strong Ale' : 'Elegir estilo'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#9f8e79] italic">
                  💡 Tip: Puedes buscar entre decenas de estilos BJCP oficiales con autocompletado inteligente.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Technical Parameters: SRM, ABV, IBU */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shrink-0">
                  <span className="material-symbols-outlined text-2xl">palette</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    2. Color SRM, Graduación e IBU
                  </h3>
                  <p className="text-xs text-[#9f8e79]">
                    Medición técnica de apariencia, amargor y alcohol
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#d7c4ad] leading-relaxed">
                El valor <strong>SRM</strong> representa la tonalidad de la cerveza en copa. Mueve el control deslizante interactivo inferior para ver cómo reacciona el simulador en tiempo real:
              </p>

              {/* Interactive SRM Slider */}
              <div className="p-4 bg-[#121414] rounded-2xl border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-white/30 shadow-md transition-colors duration-200"
                      style={{ backgroundColor: srmToHex(interactiveSrm) }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        SRM {interactiveSrm}
                      </span>
                      <span className="text-[10px] text-[#ffd18f] font-medium">
                        {interactiveSrm <= 4
                          ? 'Pajizo claro / Dorado brillante'
                          : interactiveSrm <= 9
                          ? 'Dorado ámbar / Miel'
                          : interactiveSrm <= 17
                          ? 'Cobrizo intenso / Ámbar rojizo'
                          : interactiveSrm <= 25
                          ? 'Marrón tostado / Castaño'
                          : 'Negro opaco / Stout'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#9f8e79]">
                    Hex: {srmToHex(interactiveSrm)}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="40"
                  value={interactiveSrm}
                  onChange={(e) => setInteractiveSrm(Number(e.target.value))}
                  className="w-full h-2 bg-[#282a2b] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-[#1e2020] rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-[#9f8e79] block">ABV (Alcohol)</span>
                    <span className="text-xs font-bold text-[#ffd18f]">4.5% – 12.0%</span>
                  </div>
                  <div className="p-2 bg-[#1e2020] rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-[#9f8e79] block">IBU (Amargor)</span>
                    <span className="text-xs font-bold text-[#ffd18f]">10 – 100+ IBUs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Sensory Evaluation & Radar Charts */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shrink-0">
                  <span className="material-symbols-outlined text-2xl">radar</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    3. Descriptores y Radares
                  </h3>
                  <p className="text-xs text-[#9f8e79]">
                    Fase olfativa y gustativa con rueda de descriptores
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#d7c4ad] leading-relaxed">
                Selecciona las notas aromáticas y de sabor que percibes en cada trago. Puedes activar o desactivar descriptores con un solo toque:
              </p>

              {/* Interactive Descriptors Selector */}
              <div className="p-4 bg-[#121414] rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider block text-[11px]">
                  Toca para seleccionar descriptores de prueba:
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Cítrico 🍋',
                    'Lúpulo Fresco 🌿',
                    'Caramelo 🍯',
                    'Frutas Tropicales 🥭',
                    'Pan Tostado 🍞',
                    'Café / Cacao ☕',
                    'Resinoso 🌲',
                    'Especiado 🌶️',
                  ].map((desc) => {
                    const isSelected = selectedDescriptors.includes(desc);
                    return (
                      <button
                        key={desc}
                        type="button"
                        onClick={() => toggleDescriptor(desc)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-[#fbad18] text-[#684500] border-[#fbad18] font-bold shadow-md scale-105'
                            : 'bg-[#1e2020] text-[#d7c4ad] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {desc}
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#1e2020] rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[#9f8e79]">Descriptores Activos:</span>
                  <span className="font-bold text-[#ffd18f]">
                    {selectedDescriptors.length} seleccionados
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Photos, Stars, Badges & Save */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] shrink-0">
                  <span className="material-symbols-outlined text-2xl">grade</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    4. Fotos, Puntuación e Insignias
                  </h3>
                  <p className="text-xs text-[#9f8e79]">
                    Galería HD, valoración final y gamificación
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#d7c4ad] leading-relaxed">
                Toma fotos de la botella, copa o chapa (que luego podrás ampliar a <strong>tamaño completo con la lupa</strong>). Por último, asigna tu puntuación:
              </p>

              {/* Interactive Star Rating Simulator */}
              <div className="p-4 bg-[#121414] rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider text-[11px]">
                    Tu valoración en estrellas:
                  </span>
                  <span className="font-serif text-base font-bold text-[#ffd18f]">
                    {interactiveRating.toFixed(1)} / 5.0
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setInteractiveRating(star)}
                      className="p-1 text-3xl transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                      title={`${star} estrellas`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${
                          interactiveRating >= star
                            ? 'text-[#fbad18] fill-current font-bold'
                            : interactiveRating >= star - 0.5
                            ? 'text-[#fbad18]'
                            : 'text-white/20'
                        }`}
                      >
                        {interactiveRating >= star ? 'star' : 'star'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-[#7ef24a]/10 border border-[#7ef24a]/25 rounded-xl flex items-center gap-2.5 text-xs text-[#7ef24a]">
                  <span className="material-symbols-outlined text-lg shrink-0">military_tech</span>
                  <span>
                    ¡Al guardar tu primera cata desbloquearás tu primera <strong>Insignia de Iniciado Cervecero</strong>!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#121414]/80 flex items-center justify-between gap-3 shrink-0">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="px-4 py-2.5 text-[#9f8e79] hover:text-[#d7c4ad] text-xs font-semibold"
            >
              Cerrar
            </button>
          )}

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ml-auto"
            >
              Siguiente
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartNow}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#fbad18] to-[#ffd18f] text-[#684500] text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all ml-auto"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              ¡Registrar Primera Cata!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
