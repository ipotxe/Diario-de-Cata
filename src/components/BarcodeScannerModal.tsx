import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { fetchBeerFromOpenFoodFacts, ScannedBeerData } from '../utils/openFoodFacts';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBeerData: (data: ScannedBeerData) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyBeerData,
}) => {
  const [scannerState, setScannerState] = useState<'scanning' | 'searching' | 'found' | 'not_found' | 'camera_error'>('scanning');
  const [scannedResult, setScannedResult] = useState<ScannedBeerData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'beer-barcode-reader';
  const isProcessingBarcodeRef = useRef(false);

  // Quick preset barcodes of popular beers for testing or quick access
  const DEMO_BEERS = [
    { name: 'Estrella Galicia Especial', code: '8410793132049', style: 'Lager' },
    { name: 'Duvel Belgian Strong Blonde', code: '5411681014030', style: 'Belgian Ale' },
    { name: 'Guinness Draught', code: '5000213009000', style: 'Irish Stout' },
    { name: 'Heineken Original', code: '8712000025700', style: 'Pilsner' },
    { name: 'Paulaner Hefe-Weißbier', code: '4066600000000', style: 'Weissbier' },
  ];

  const handleBarcodeDetected = async (barcode: string) => {
    if (isProcessingBarcodeRef.current) return;
    isProcessingBarcodeRef.current = true;

    // Pause / stop camera while searching
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.pause(true);
      }
    } catch (e) {
      // ignore pause error
    }

    setScannerState('searching');
    setErrorMessage(null);

    const result = await fetchBeerFromOpenFoodFacts(barcode);
    setScannedResult(result);

    if (result.found) {
      setScannerState('found');
    } else {
      setScannerState('not_found');
      setErrorMessage(result.errorMessage || 'Cerveza no encontrada en la base de datos de Open Food Facts.');
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeDetected(manualBarcode.trim());
  };

  const startScanner = async () => {
    try {
      setCameraPermissionDenied(false);
      setScannerState('scanning');
      setScannedResult(null);
      setErrorMessage(null);
      isProcessingBarcodeRef.current = false;

      // Small delay to ensure container element is in DOM
      await new Promise((r) => setTimeout(r, 100));

      const element = document.getElementById(readerElementId);
      if (!element) return;

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (err) {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.min(Math.round(minEdge * 0.85), 320);
          const height = Math.round(width * 0.65);
          return { width, height };
        },
        aspectRatio: 1.333,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (!isProcessingBarcodeRef.current) {
            handleBarcodeDetected(decodedText);
          }
        },
        () => {
          // frame scan progress without barcode - no action needed
        }
      );

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera scanner initialization failed:', err);
      setCameraPermissionDenied(true);
      setScannerState('camera_error');
      setErrorMessage(
        'No se pudo acceder a la cámara. Asegúrate de haber concedido los permisos de cámara en tu navegador o introduce el código manualmente.'
      );
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error('Torch toggle failed:', e);
    }
  };

  const handleRetryScan = async () => {
    isProcessingBarcodeRef.current = false;
    setScannedResult(null);
    setErrorMessage(null);
    setScannerState('scanning');
    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.resume();
        } else {
          startScanner();
        }
      } else {
        startScanner();
      }
    } catch (e) {
      startScanner();
    }
  };

  const handleApply = () => {
    if (scannedResult && scannedResult.found) {
      onApplyBeerData(scannedResult);
      handleClose();
    }
  };

  const handleClose = async () => {
    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      // ignore
    }
    isProcessingBarcodeRef.current = false;
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      handleClose();
    }

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear().catch(() => {});
        } catch (e) {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1e2020] border border-white/15 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121414]">
          <div className="flex items-center gap-2 text-[#ffd18f]">
            <span className="material-symbols-outlined text-xl text-[#fbad18]">barcode_scanner</span>
            <div>
              <h2 className="font-serif text-base font-bold text-[#ffd18f] leading-tight">
                Escanear Código de Barras
              </h2>
              <p className="text-[11px] text-[#9f8e79]">Base de Datos Open Food Facts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#d7c4ad] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 overflow-y-auto flex flex-col gap-4">
          {/* Scanner View Area */}
          {(scannerState === 'scanning' || scannerState === 'searching') && (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/15 aspect-[4/3] flex items-center justify-center shadow-inner">
              <div id={readerElementId} className="w-full h-full object-cover" />

              {/* Viewfinder Target Graphic overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[78%] h-[60%] border-2 border-[#fbad18]/80 rounded-2xl relative shadow-[0_0_15px_rgba(251,173,24,0.3)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[#ffd18f] rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[#ffd18f] rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[#ffd18f] rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[#ffd18f] rounded-br" />

                  {/* Scanning Laser Line */}
                  {scannerState === 'scanning' && (
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd18f] to-transparent shadow-[0_0_8px_#fbad18] animate-bounce" />
                  )}
                </div>
              </div>

              {/* Searching Overlay */}
              {scannerState === 'searching' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-4">
                  <div className="w-12 h-12 rounded-full border-3 border-[#fbad18] border-t-transparent animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#ffd18f]">Buscando cerveza...</p>
                    <p className="text-xs text-[#d7c4ad]">Consultando Open Food Facts</p>
                  </div>
                </div>
              )}

              {/* Flashlight button if supported */}
              {hasTorch && scannerState === 'scanning' && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    torchOn
                      ? 'bg-[#fbad18] text-[#121414] border-[#ffd18f]'
                      : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {torchOn ? 'flashlight_on' : 'flashlight_off'}
                  </span>
                  <span>{torchOn ? 'Luz ON' : 'Luz'}</span>
                </button>
              )}
            </div>
          )}

          {/* SUCCESS RESULT CARD */}
          {scannerState === 'found' && scannedResult && (
            <div className="bg-[#121414] border border-[#fbad18]/40 rounded-2xl p-4.5 flex flex-col gap-3.5 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 text-[#7ef24a]">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <span className="text-xs font-bold uppercase tracking-wider">¡Cerveza Encontrada!</span>
              </div>

              <div className="flex gap-3.5 items-start">
                {scannedResult.imageUrl ? (
                  <img
                    src={scannedResult.imageUrl}
                    alt={scannedResult.name || 'Cerveza'}
                    className="w-20 h-24 object-contain rounded-xl bg-black/40 p-1 border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-24 rounded-xl bg-[#282a2b] border border-white/10 flex flex-col items-center justify-center text-[#ffd18f] shrink-0">
                    <span className="material-symbols-outlined text-3xl">sports_bar</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#ffd18f] leading-snug break-words">
                    {scannedResult.name || 'Cerveza sin nombre'}
                  </h3>

                  {scannedResult.brewery && (
                    <p className="text-xs text-[#d7c4ad] font-semibold flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-sm text-[#fbad18]">store</span>
                      <span>{scannedResult.brewery}</span>
                    </p>
                  )}

                  {scannedResult.country && (
                    <p className="text-xs text-[#9f8e79] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#fbad18]">public</span>
                      <span>{scannedResult.country}</span>
                    </p>
                  )}

                  {scannedResult.style && (
                    <div className="pt-0.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-[#1e2020] rounded border border-white/10 text-[#ffd18f] inline-block truncate max-w-full">
                        {scannedResult.style}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical indicators pills */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                <div className="bg-[#1e2020] rounded-xl p-2 text-center border border-white/5">
                  <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">Graduación</span>
                  <span className="text-sm font-bold text-[#e2e2e2]">
                    {scannedResult.abv !== undefined ? `${scannedResult.abv}%` : '—'}
                  </span>
                </div>

                <div className="bg-[#1e2020] rounded-xl p-2 text-center border border-white/5">
                  <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">IBU</span>
                  <span className="text-sm font-bold text-[#e2e2e2]">
                    {scannedResult.ibu !== undefined ? scannedResult.ibu : '—'}
                  </span>
                </div>

                <div className="bg-[#1e2020] rounded-xl p-2 text-center border border-white/5">
                  <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">EBC</span>
                  <span className="text-sm font-bold text-[#e2e2e2]">
                    {scannedResult.ebc !== undefined ? scannedResult.ebc : '—'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fbad18] to-[#ffd18f] text-[#684500] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
                >
                  <span className="material-symbols-outlined text-lg">download_done</span>
                  <span>Incorporar Datos a la Cata</span>
                </button>

                <button
                  type="button"
                  onClick={handleRetryScan}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#282a2b] hover:bg-[#333535] text-xs font-semibold text-[#d7c4ad] border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>Escanear Otro Código</span>
                </button>
              </div>
            </div>
          )}

          {/* NOT FOUND ERROR STATE */}
          {scannerState === 'not_found' && (
            <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4.5 flex flex-col gap-3 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-red-900/40 border border-red-500/40 text-red-300 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">search_off</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-200">Cerveza no encontrada</h3>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  {errorMessage ||
                    'El código de barras no se encuentra registrado en la base de datos de Open Food Facts.'}
                </p>
                {scannedResult?.barcode && (
                  <p className="text-[11px] font-mono text-[#d7c4ad] bg-black/40 py-1 px-2.5 rounded-lg inline-block mt-1">
                    Código: {scannedResult.barcode}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetryScan}
                  className="w-full py-3 px-4 rounded-xl bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>Reintentar Escaneo</span>
                </button>
              </div>
            </div>
          )}

          {/* CAMERA PERMISSION OR INITIALIZATION ERROR */}
          {scannerState === 'camera_error' && (
            <div className="bg-[#282a2b] border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-[#ffd18f] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-xl">videocam_off</span>
              </div>
              <p className="text-xs text-[#d7c4ad] leading-relaxed">
                {errorMessage || 'No se pudo activar la cámara para el escaneo automático.'}
              </p>
              <button
                type="button"
                onClick={startScanner}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#ffd18f] border border-white/10 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Reintentar Permisos de Cámara</span>
              </button>
            </div>
          )}

          {/* Manual Barcode Input Fallback */}
          <div className="bg-[#121414] rounded-2xl p-3.5 border border-white/5 flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-[#d7c4ad] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#fbad18]">pin</span>
              O introduce el código numérico manualmente:
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Ej. 8410793132049"
                className="flex-1 bg-[#1e2020] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none font-mono placeholder:text-[#524533]"
              />
              <button
                type="submit"
                disabled={!manualBarcode.trim() || scannerState === 'searching'}
                className="px-4 py-2.5 bg-[#fbad18] hover:bg-[#ffbe3b] disabled:opacity-40 text-[#684500] font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                <span>Buscar</span>
              </button>
            </form>

            {/* Quick Demo Barcodes for ease of testing */}
            <div className="pt-1.5">
              <span className="text-[10px] text-[#9f8e79] block mb-1.5 font-semibold">
                Ejemplos de códigos de prueba:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_BEERS.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setManualBarcode(b.code);
                      handleBarcodeDetected(b.code);
                    }}
                    className="text-[10px] px-2 py-1 bg-[#1e2020] hover:bg-[#2a2c2c] border border-white/10 hover:border-[#fbad18]/40 rounded-lg text-[#d7c4ad] flex items-center gap-1 transition-colors"
                  >
                    <span>🍺</span>
                    <span className="font-medium text-[#ffd18f]">{b.name.split(' ')[0]}</span>
                    <span className="font-mono text-[#9f8e79]">({b.code.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#121414] flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#d7c4ad] hover:text-white hover:bg-white/5 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
