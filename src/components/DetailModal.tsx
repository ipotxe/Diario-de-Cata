import React, { useState, useEffect } from 'react';
import { BeerTasting } from '../types';
import { Radar5Chart, Radar5Axis } from './Radar5Chart';
import { srmToHex } from '../data/initialData';

interface DetailModalProps {
  beer: BeerTasting | null;
  onClose: () => void;
  onEdit?: (beer: BeerTasting) => void;
  onDelete?: (id: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  beer,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [modalSensoryTab, setModalSensoryTab] = useState<'aroma' | 'sabor' | 'ambos'>('ambos');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomMode, setZoomMode] = useState<'contain' | 'original'>('contain');
  const [shareToast, setShareToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const photos = beer && beer.images && beer.images.length > 0 ? beer.images : (beer ? [beer.imageUrl] : []);
  const photosLength = photos.length;

  // Reset indices when active beer changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setIsImageViewerOpen(false);
  }, [beer?.id]);

  // Keyboard navigation when full size image viewer is open
  useEffect(() => {
    if (!isImageViewerOpen || photosLength === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageViewerOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photosLength - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev < photosLength - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageViewerOpen, photosLength]);

  if (!beer) return null;

  const hexColor = srmToHex(beer.srm);
  const currentPhoto = photos[activePhotoIndex < photos.length ? activePhotoIndex : 0] || beer.imageUrl;

  // Derive 5-axis Aroma data
  const aromaValues = beer.aromaRadar || {
    dulce: beer.radarValues?.sweetness ?? 2,
    amargo: beer.radarValues?.bitterness ?? 3,
    acido: 1,
    lupulo: beer.radarValues?.hop ?? 3,
    malta: beer.radarValues?.malt ?? 3,
  };

  const aromaAxes: Radar5Axis[] = [
    { key: 'dulce', label: 'Dulce', emoji: '🍬', value: aromaValues.dulce },
    { key: 'amargo', label: 'Amargo', emoji: '🌿', value: aromaValues.amargo },
    { key: 'acido', label: 'Ácido', emoji: '🍋', value: aromaValues.acido },
    { key: 'lupulo', label: 'Lúpulo', emoji: '🌱', value: aromaValues.lupulo },
    { key: 'malta', label: 'Malta', emoji: '🌾', value: aromaValues.malta },
  ];

  // Derive 5-axis Sabor data
  const saborValues = beer.saborRadar || {
    dulce: beer.radarValues?.sweetness ?? 2,
    amargo: beer.radarValues?.bitterness ?? 3,
    seco: 2,
    acido: 1,
    fusel: 0,
  };

  const saborAxes: Radar5Axis[] = [
    { key: 'dulce', label: 'Dulce', emoji: '🍬', value: saborValues.dulce },
    { key: 'amargo', label: 'Amargo', emoji: '🌿', value: saborValues.amargo },
    { key: 'seco', label: 'Seco', emoji: '🍷', value: saborValues.seco },
    { key: 'acido', label: 'Ácido', emoji: '🍋', value: saborValues.acido },
    { key: 'fusel', label: 'Fusel', emoji: '🔥', value: saborValues.fusel },
  ];

  const flavorDescriptors = beer.saborDescriptors && beer.saborDescriptors.length > 0
    ? beer.saborDescriptors
    : beer.otherDescriptors || [];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareToast({
        message: '¡Notas de cata copiadas al portapapeles para compartir!',
        type: 'info',
      });
      setTimeout(() => setShareToast(null), 4000);
    } catch {
      setShareToast({
        message: 'No se pudo copiar al portapapeles.',
        type: 'info',
      });
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const handleShare = async () => {
    const starsString = '★'.repeat(Math.floor(beer.rating)) + (beer.rating % 1 !== 0 ? '½' : '');
    const descriptorsList = [
      ...(beer.aromaDescriptors || []).slice(0, 3),
      ...flavorDescriptors.slice(0, 3),
    ];
    const uniqueDescriptors = Array.from(new Set(descriptorsList));

    const shareTitle = `Cata: ${beer.name} - ${beer.brewery}`;
    let shareText = `🍺 ${beer.name} (${beer.brewery})\n` +
      `🏷️ Estilo: ${beer.style}\n` +
      `⭐ Valoración: ${beer.rating}/5 ${starsString}\n` +
      `📊 Graduación: ${beer.abv}% ABV | IBU: ${beer.ibu} | SRM: ${beer.srm}\n`;

    if (beer.country) {
      shareText += `🌍 Origen: ${beer.country}\n`;
    }

    if (uniqueDescriptors.length > 0) {
      shareText += `👃 Perfil: ${uniqueDescriptors.join(', ')}\n`;
    }

    if (beer.notes) {
      shareText += `📝 Notas: "${beer.notes}"\n`;
    }

    if (beer.pairing) {
      shareText += `🍽️ Maridaje: ${beer.pairing}\n`;
    }

    shareText += `\n#Cerveza #BeerTasting #CraftBeer #CataDeCerveza`;

    const shareData: ShareData = {
      title: shareTitle,
      text: shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast({
          message: '¡Cata compartida con éxito!',
          type: 'success',
        });
        setTimeout(() => setShareToast(null), 3500);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          // Si hubo un error técnico en el diálogo de compartir, usamos el portapapeles como respaldo
          await copyToClipboard(shareText);
        }
      }
    } else {
      // Fallback para navegadores de escritorio o entornos sin Web Share API
      await copyToClipboard(shareText);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined text-xl ${
          i < Math.floor(rating)
            ? 'symbol-fill-1 text-[#ffd18f]'
            : i < rating
            ? 'symbol-fill-1 text-[#ffd18f]'
            : 'symbol-fill-0 text-white/20'
        }`}
      >
        {i < Math.floor(rating) ? 'star' : i < rating ? 'star_half' : 'star'}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#1e2020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* Floating Toast Notification */}
        {shareToast && (
          <div className="absolute top-16 left-4 right-4 z-30 p-3 rounded-xl bg-[#121414]/95 border border-[#fbad18]/60 text-[#ffd18f] text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#7ef24a]">
                {shareToast.type === 'success' ? 'check_circle' : 'content_paste'}
              </span>
              <span className="leading-tight">{shareToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setShareToast(null)}
              className="text-[#9f8e79] hover:text-white p-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Header Image Gallery */}
        <div
          className="relative h-60 w-full shrink-0 overflow-hidden bg-[#121414] cursor-zoom-in group/hero"
          onClick={() => {
            setZoomMode('contain');
            setIsImageViewerOpen(true);
          }}
          title="Haz clic para ver la imagen a tamaño completo"
        >
          <img
            src={currentPhoto}
            alt={`${beer.name} - Foto ${activePhotoIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover/hero:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2020] via-[#1e2020]/30 to-black/60" />

          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
            {/* Magnifying Glass (Lupa) button to view full size image */}
            <button
              type="button"
              onClick={() => {
                setZoomMode('contain');
                setIsImageViewerOpen(true);
              }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-[#ffd18f] hover:text-white flex items-center justify-center border border-white/20 hover:bg-[#fbad18]/30 active:scale-95 transition-all shadow-lg"
              title="Ver imagen a tamaño original completo (Lupa)"
              aria-label="Abrir imagen a tamaño completo"
            >
              <span className="material-symbols-outlined text-lg">zoom_in</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-[#ffd18f] hover:text-white flex items-center justify-center border border-white/20 hover:bg-[#fbad18]/30 active:scale-95 transition-all shadow-lg"
              title="Compartir cata en redes sociales"
              aria-label="Compartir cata"
            >
              <span className="material-symbols-outlined text-lg">share</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/90 active:scale-95 transition-all"
              title="Cerrar"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* SRM badge floating */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: hexColor }}
            />
            <span className="text-xs font-semibold text-[#ffd18f]">SRM {beer.srm}</span>
          </div>

          {/* Photos Navigation Arrows & Counter if multiple */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/90 active:scale-90 transition-all z-20"
                title="Foto anterior"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/90 active:scale-90 transition-all z-20"
                title="Foto siguiente"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>

              {/* Photo Dots / Counter Indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-20">
                <span className="material-symbols-outlined text-xs text-[#fbad18]">photo_camera</span>
                <span className="text-[10px] font-mono font-bold text-white">
                  {activePhotoIndex + 1} / {photos.length}
                </span>
              </div>
            </>
          )}

          {/* Floating Lupa / Zoom Original Badge */}
          <div className="absolute bottom-3 right-4 z-20" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setZoomMode('contain');
                setIsImageViewerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-[#ffd18f] hover:text-white border border-white/20 hover:border-[#fbad18]/60 hover:bg-black/90 active:scale-95 transition-all text-xs font-semibold shadow-xl group cursor-pointer"
              title="Pulsar lupa para ver imagen a tamaño completo original"
            >
              <span className="material-symbols-outlined text-base text-[#fbad18] group-hover:scale-125 transition-transform">
                zoom_in
              </span>
              <span className="text-[11px] font-medium">Tamaño Original</span>
            </button>
          </div>

          {/* Title inside header bottom */}
          <div className="absolute bottom-3 left-5 right-28 z-20 pointer-events-none">
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#fbad18] text-[#684500] rounded-full uppercase tracking-wider mb-1 inline-block">
              {beer.style}
            </span>
            <h2 className="font-serif text-2xl font-bold text-white leading-tight truncate">
              {beer.name}
            </h2>
            <p className="text-sm text-[#d7c4ad] flex items-center gap-1.5 mt-0.5 truncate">
              <span className="truncate">{beer.brewery}</span>
              {beer.country && (
                <>
                  <span className="text-[#9f8e79]">•</span>
                  <span className="text-[#ffd18f] font-medium flex items-center gap-0.5 shrink-0">
                    <span className="material-symbols-outlined text-xs">public</span>
                    {beer.country}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Thumbnail Selector Strip if multiple photos */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#171919] border-b border-white/5 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-[#9f8e79] tracking-wider shrink-0">
              Fotos ({photos.length}):
            </span>
            <div className="flex items-center gap-2">
              {photos.map((p, idx) => (
                <div key={idx} className="relative group/thumb shrink-0">
                  <button
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 transition-all block ${
                      activePhotoIndex === idx
                        ? 'border-[#fbad18] scale-105 shadow-md ring-1 ring-[#fbad18]/40'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                    title={`Ver foto ${idx + 1}${idx === 0 ? ' (Principal)' : ''}`}
                  >
                    <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 right-0 bg-[#fbad18] text-[#684500] text-[8px] font-black px-1 rounded-tl">
                        ★
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(idx);
                      setZoomMode('contain');
                      setIsImageViewerOpen(true);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#121414] text-[#ffd18f] border border-white/20 hover:bg-[#fbad18] hover:text-[#121414] flex items-center justify-center shadow-md opacity-80 group-hover/thumb:opacity-100 transition-all z-10"
                    title={`Abrir foto ${idx + 1} a tamaño completo con lupa`}
                  >
                    <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Rating Header */}
          <div className="flex items-center justify-between bg-[#121414] p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1">
              {renderStars(beer.rating)}
              <span className="ml-2 font-bold text-lg text-[#ffd18f]">{beer.rating} / 5</span>
            </div>
            <span className="text-xs text-[#d7c4ad]">{beer.createdAt}</span>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#121414] p-3 rounded-xl border border-white/5">
              <span className="text-[11px] text-[#d7c4ad] block uppercase tracking-wider">ABV</span>
              <span className="font-bold text-base text-[#ffd18f]">{beer.abv}%</span>
            </div>
            <div className="bg-[#121414] p-3 rounded-xl border border-white/5">
              <span className="text-[11px] text-[#d7c4ad] block uppercase tracking-wider">IBU</span>
              <span className="font-bold text-base text-[#ffd18f]">{beer.ibu}</span>
            </div>
            <div className="bg-[#121414] p-3 rounded-xl border border-white/5">
              <span className="text-[11px] text-[#d7c4ad] block uppercase tracking-wider">EBC</span>
              <span className="font-bold text-base text-[#ffd18f]">{beer.ebc}</span>
            </div>
          </div>

          {/* Visual Attributes */}
          <div className="bg-[#121414] p-4 rounded-xl border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-[#ffd18f] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">visibility</span>
              Atributos Visuales & Carbonatación
            </h4>
            <div className="flex flex-wrap gap-2 text-xs pt-1">
              <span className="px-3 py-1 bg-[#282a2b] rounded-full text-[#e2e2e2] border border-white/10">
                Claridad: <strong className="text-[#ffd18f]">{beer.clarity}</strong>
              </span>
              <span className="px-3 py-1 bg-[#282a2b] rounded-full text-[#e2e2e2] border border-white/10">
                Espuma: <strong className="text-[#ffd18f]">{beer.foamType}</strong>
              </span>
              <span className="px-3 py-1 bg-[#282a2b] rounded-full text-[#e2e2e2] border border-white/10">
                Carbonatación: <strong className="text-[#ffd18f]">{beer.carbonation}</strong>
              </span>
            </div>
          </div>

          {/* Perfil Sensorial: Aroma & Sabor */}
          <div className="bg-[#121414] p-4 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-xs font-semibold text-[#ffd18f] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">psychiatry</span>
                Perfil Sensorial
              </h4>
              <div className="flex bg-[#1e2020] p-0.5 rounded-lg border border-white/5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setModalSensoryTab('aroma')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    modalSensoryTab === 'aroma'
                      ? 'bg-[#fbad18] text-[#121414] font-bold'
                      : 'text-[#d7c4ad] hover:text-white'
                  }`}
                >
                  👃 Aroma
                </button>
                <button
                  type="button"
                  onClick={() => setModalSensoryTab('sabor')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    modalSensoryTab === 'sabor'
                      ? 'bg-[#fbad18] text-[#121414] font-bold'
                      : 'text-[#d7c4ad] hover:text-white'
                  }`}
                >
                  👅 Sabor
                </button>
                <button
                  type="button"
                  onClick={() => setModalSensoryTab('ambos')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    modalSensoryTab === 'ambos'
                      ? 'bg-[#fbad18] text-[#121414] font-bold'
                      : 'text-[#d7c4ad] hover:text-white'
                  }`}
                >
                  👁️ Ambos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aroma Card */}
              {(modalSensoryTab === 'aroma' || modalSensoryTab === 'ambos') && (
                <div className="bg-[#1e2020] p-3 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffd18f] flex items-center gap-1">
                      <span>👃</span>
                      <span>Perfil de Aroma</span>
                    </span>
                    <span className="text-[10px] text-[#d7c4ad]/70 font-mono">Dulce·Amargo·Ácido·Lúpulo·Malta</span>
                  </div>
                  <Radar5Chart
                    axes={aromaAxes}
                    size={175}
                    accentColor="#FBAD18"
                  />
                  {beer.aromaDescriptors && beer.aromaDescriptors.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d7c4ad]">
                        Descriptores de Aroma
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {beer.aromaDescriptors.map((desc, idx) => (
                          <span
                            key={`aroma-${idx}`}
                            className="px-2.5 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/40 text-[#ffd18f] rounded-md text-[11px] font-medium"
                          >
                            {desc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sabor Card */}
              {(modalSensoryTab === 'sabor' || modalSensoryTab === 'ambos') && (
                <div className="bg-[#1e2020] p-3 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffd18f] flex items-center gap-1">
                      <span>👅</span>
                      <span>Perfil de Sabor</span>
                    </span>
                    <span className="text-[10px] text-[#d7c4ad]/70 font-mono">Dulce·Amargo·Seco·Ácido·Fusel</span>
                  </div>
                  <Radar5Chart
                    axes={saborAxes}
                    size={175}
                    accentColor="#F59E0B"
                  />
                  {flavorDescriptors.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d7c4ad]">
                        Descriptores de Sabor
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {flavorDescriptors.map((desc, idx) => (
                          <span
                            key={`flavor-${idx}`}
                            className="px-2.5 py-0.5 bg-[#282a2b] border border-white/10 text-[#e2e2e2] rounded-md text-[11px] font-medium"
                          >
                            {desc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Personal Notes */}
          {beer.notes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-[#d7c4ad] uppercase tracking-wider">
                Notas de Cata
              </h4>
              <p className="text-sm text-[#e2e2e2] bg-[#121414] p-3.5 rounded-xl border border-white/5 italic leading-relaxed">
                "{beer.notes}"
              </p>
            </div>
          )}

          {/* Pairing */}
          {beer.pairing && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-[#d7c4ad] uppercase tracking-wider flex items-center gap-1">
                <span>🍽️ Maridaje Recomendado</span>
              </h4>
              <p className="text-sm text-[#ffd18f] bg-[#121414] p-3.5 rounded-xl border border-white/5">
                {beer.pairing}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#fbad18] to-[#ffd18f] hover:from-[#ffbe3b] hover:to-[#ffe0ab] text-[#684500] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#fbad18]/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Compartir Cata
            </button>

            <div className="flex gap-2.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(beer);
                  }}
                  className="flex-1 sm:flex-initial py-3 px-4 bg-[#282a2b] hover:bg-[#333535] text-[#ffd18f] rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar cata de ${beer.name}?`)) {
                      onDelete(beer.id);
                      onClose();
                    }
                  }}
                  className="py-3 px-3.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-red-500/20 active:scale-95 transition-all"
                  title="Eliminar cata"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Original Size Image Lightbox Modal */}
      {isImageViewerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-fade-in"
          onClick={() => setIsImageViewerOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between gap-3 bg-[#121414]/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 z-30 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbad18]/20 border border-[#fbad18]/40 flex items-center justify-center text-[#ffd18f] shrink-0">
                <span className="material-symbols-outlined text-lg">zoom_in</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-sm sm:text-base font-bold text-white truncate">
                  {beer.name}
                </h3>
                <p className="text-[11px] text-[#d7c4ad] truncate flex items-center gap-1.5">
                  <span>{beer.brewery}</span>
                  <span>•</span>
                  <span className="text-[#ffd18f] font-mono font-semibold">
                    Foto {activePhotoIndex + 1} de {photos.length}
                  </span>
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomMode((prev) => (prev === 'contain' ? 'original' : 'contain'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#ffd18f] border border-white/15 text-xs font-semibold active:scale-95 transition-all"
                title={zoomMode === 'contain' ? 'Ver en escala 100% original' : 'Ajustar imagen a la pantalla'}
              >
                <span className="material-symbols-outlined text-base">
                  {zoomMode === 'contain' ? 'zoom_in' : 'fit_screen'}
                </span>
                <span className="hidden sm:inline">
                  {zoomMode === 'contain' ? '100% Original' : 'Ajustar Pantalla'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsImageViewerOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 active:scale-95 transition-all"
                title="Cerrar visor (Esc)"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Central Image Viewport */}
          <div
            className="flex-1 flex items-center justify-center relative my-2 overflow-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Photo Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                }}
                className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-[#fbad18] hover:text-[#121414] hover:border-[#fbad18] active:scale-90 transition-all flex items-center justify-center shadow-2xl z-30"
                title="Foto anterior (Flecha Izquierda)"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            )}

            {/* Next Photo Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                }}
                className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-[#fbad18] hover:text-[#121414] hover:border-[#fbad18] active:scale-90 transition-all flex items-center justify-center shadow-2xl z-30"
                title="Foto siguiente (Flecha Derecha)"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            )}

            {zoomMode === 'contain' ? (
              <div
                className="relative max-h-[75vh] sm:max-h-[82vh] max-w-[95vw] flex items-center justify-center cursor-zoom-in"
                onClick={() => setZoomMode('original')}
                title="Haz clic para ampliar al 100% de tamaño real"
              >
                <img
                  src={currentPhoto}
                  alt={`${beer.name} - Foto ${activePhotoIndex + 1}`}
                  className="max-h-[75vh] sm:max-h-[82vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                />
              </div>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-auto custom-scrollbar cursor-zoom-out"
                onClick={() => setZoomMode('contain')}
                title="Haz clic para volver a ajustar la imagen a la pantalla"
              >
                <img
                  src={currentPhoto}
                  alt={`${beer.name} - Foto ${activePhotoIndex + 1} (Tamaño Original)`}
                  className="max-w-none max-h-none rounded-xl shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Bottom Bar / Thumbnail Strip */}
          <div
            className="flex flex-col items-center gap-2 bg-[#121414]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 z-30 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activePhotoIndex === idx
                        ? 'border-[#fbad18] scale-110 shadow-lg ring-2 ring-[#fbad18]/50'
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                    title={`Ver imagen ${idx + 1}`}
                  >
                    <img src={p} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between w-full text-[11px] text-[#9f8e79]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#ffd18f]">zoom_in</span>
                <span>Haz clic en la imagen para alternar entre ajuste de pantalla y resolución original 1:1</span>
              </span>
              <span className="hidden sm:inline font-mono text-[#d7c4ad]">
                ESC para salir • ◄ ► navegar
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
