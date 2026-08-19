import React, { useState } from 'react';
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

  if (!beer) return null;

  const hexColor = srmToHex(beer.srm);
  const photos = beer.images && beer.images.length > 0 ? beer.images : [beer.imageUrl];
  const currentPhoto = photos[activePhotoIndex < photos.length ? activePhotoIndex : 0];

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
        {/* Header Image Gallery */}
        <div className="relative h-60 w-full shrink-0 overflow-hidden bg-[#121414]">
          <img
            src={currentPhoto}
            alt={`${beer.name} - Foto ${activePhotoIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2020] via-[#1e2020]/30 to-black/60" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/90 active:scale-95 transition-all z-20"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

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
                onClick={() =>
                  setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/90 active:scale-90 transition-all z-20"
                title="Foto anterior"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                }
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

          {/* Title inside header bottom */}
          <div className="absolute bottom-3 left-5 right-5 z-20">
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#fbad18] text-[#684500] rounded-full uppercase tracking-wider mb-1 inline-block">
              {beer.style}
            </span>
            <h2 className="font-serif text-2xl font-bold text-white leading-tight">
              {beer.name}
            </h2>
            <p className="text-sm text-[#d7c4ad] flex items-center gap-1.5 mt-0.5">
              <span>{beer.brewery}</span>
              {beer.country && (
                <>
                  <span className="text-[#9f8e79]">•</span>
                  <span className="text-[#ffd18f] font-medium flex items-center gap-0.5">
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
            <div className="flex items-center gap-1.5">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
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
          <div className="pt-2 flex gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(beer);
                }}
                className="flex-1 py-3 bg-[#282a2b] hover:bg-[#333535] text-[#ffd18f] rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar cata de ${beer.name}?`)) {
                    onDelete(beer.id);
                    onClose();
                  }
                }}
                className="py-3 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-red-500/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
