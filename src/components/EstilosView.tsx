import React, { useState, useMemo } from 'react';
import { srmToHex } from '../data/initialData';
import {
  BJCP_STYLE_CATEGORIES,
  BJCP_STYLE_DETAILS_DB,
  getStyleOfTheDay,
  getRandomStyle,
} from '../data/bjcpStyleDetails';
import { StyleDetail } from '../types';

interface EstilosViewProps {
  onStartNewCataWithStyle?: (styleName: string) => void;
}

const SRM_STYLES_MAP = [
  { srm: 2, ebc: 4, name: 'Pilsner / Berliner Weisse', hex: '#F8F753' },
  { srm: 4, ebc: 8, name: 'Helles / Witbier / Blonde Ale', hex: '#FBE854' },
  { srm: 6, ebc: 12, name: 'American Pale Ale / APA', hex: '#F3B432' },
  { srm: 8, ebc: 16, name: 'American IPA / Hazy IPA', hex: '#E58500' },
  { srm: 12, ebc: 24, name: 'Märzen / Amber Ale', hex: '#D48806' },
  { srm: 16, ebc: 32, name: 'Dubbel / Weizenbock', hex: '#A85304' },
  { srm: 22, ebc: 44, name: 'Brown Ale / English Porter', hex: '#783802' },
  { srm: 30, ebc: 60, name: 'Oatmeal Stout / Dry Stout', hex: '#4F2C05' },
  { srm: 40, ebc: 80, name: 'Imperial Stout / Black IPA', hex: '#080707' },
];

export const EstilosView: React.FC<EstilosViewProps> = ({ onStartNewCataWithStyle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyleModal, setSelectedStyleModal] = useState<StyleDetail | null>(null);
  const [explorerSRM, setExplorerSRM] = useState(8);

  // Style of the day initialized deterministically by date
  const [styleOfTheDay, setStyleOfTheDay] = useState<StyleDetail>(() => getStyleOfTheDay());

  const handleShuffleDaily = () => {
    setStyleOfTheDay(getRandomStyle(styleOfTheDay.id));
  };

  const getSRMStyleMatch = (val: number) => {
    const closest = SRM_STYLES_MAP.reduce((prev, curr) =>
      Math.abs(curr.srm - val) < Math.abs(prev.srm - val) ? curr : prev
    );
    return closest;
  };

  // Filter styles by search query and selected category
  const filteredStyles = useMemo(() => {
    return BJCP_STYLE_DETAILS_DB.filter((style) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.flavorProfile.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.pairingSuggestions.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (!selectedCategory) return true;

      // Match category name or category group
      const cat = BJCP_STYLE_CATEGORIES.find((c) => c.id === selectedCategory);
      if (!cat) return true;

      if (selectedCategory === 'ipas') {
        return style.category.toLowerCase().includes('ipa') || style.name.toLowerCase().includes('ipa');
      }
      if (selectedCategory === 'lagers') {
        return (
          style.category.toLowerCase().includes('lager') ||
          style.category.toLowerCase().includes('pils') ||
          style.name.toLowerCase().includes('lager') ||
          style.name.toLowerCase().includes('pils') ||
          style.name.toLowerCase().includes('märzen') ||
          style.name.toLowerCase().includes('helles') ||
          style.name.toLowerCase().includes('bock')
        );
      }
      if (selectedCategory === 'stouts-porters') {
        return (
          style.category.toLowerCase().includes('stout') ||
          style.category.toLowerCase().includes('porter') ||
          style.name.toLowerCase().includes('stout') ||
          style.name.toLowerCase().includes('porter')
        );
      }
      if (selectedCategory === 'belgians') {
        return (
          style.category.toLowerCase().includes('belgian') ||
          style.category.toLowerCase().includes('monastic') ||
          style.name.toLowerCase().includes('belgian') ||
          style.name.toLowerCase().includes('dubbel') ||
          style.name.toLowerCase().includes('tripel') ||
          style.name.toLowerCase().includes('saison') ||
          style.name.toLowerCase().includes('quadrupel')
        );
      }
      if (selectedCategory === 'trigo') {
        return (
          style.category.toLowerCase().includes('wheat') ||
          style.name.toLowerCase().includes('weissbier') ||
          style.name.toLowerCase().includes('witbier') ||
          style.name.toLowerCase().includes('weizenbock') ||
          style.name.toLowerCase().includes('wheat')
        );
      }
      if (selectedCategory === 'sours-wild') {
        return (
          style.category.toLowerCase().includes('sour') ||
          style.category.toLowerCase().includes('wild') ||
          style.name.toLowerCase().includes('gose') ||
          style.name.toLowerCase().includes('berliner') ||
          style.name.toLowerCase().includes('lambic') ||
          style.name.toLowerCase().includes('gueuze') ||
          style.name.toLowerCase().includes('flanders')
        );
      }
      if (selectedCategory === 'british-irish') {
        return (
          style.category.toLowerCase().includes('british') ||
          style.category.toLowerCase().includes('irish') ||
          style.category.toLowerCase().includes('commonwealth') ||
          style.name.toLowerCase().includes('bitter') ||
          style.name.toLowerCase().includes('irish')
        );
      }
      if (selectedCategory === 'american-ales') {
        return (
          style.category.toLowerCase().includes('pale american') ||
          style.category.toLowerCase().includes('amber and brown american') ||
          style.name.toLowerCase().includes('pale ale') ||
          style.name.toLowerCase().includes('amber ale') ||
          style.name.toLowerCase().includes('blonde ale')
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  const srmMatch = getSRMStyleMatch(explorerSRM);

  return (
    <div className="flex flex-col w-full gap-6 pb-24 max-w-lg mx-auto">
      {/* Header Banner & Search */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#e2e2e2] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fbad18]">menu_book</span>
              Guía de Estilos BJCP
            </h1>
            <p className="text-xs text-[#d7c4ad] mt-0.5">
              Explora descriptores, parámetros técnicos y maridajes oficiales
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9f8e79] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar estilo (ej. 21A, Hazy IPA, Pils, Stout, Trigo)..."
            className="w-full h-11 pl-11 pr-9 bg-[#1e2020] rounded-xl text-[#e2e2e2] placeholder:text-[#524533] text-sm focus:outline-none focus:ring-1 focus:ring-[#fbad18] transition-all border border-white/5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9f8e79] hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
            </button>
          )}
        </div>
      </section>

      {/* ESTILO DEL DÍA (Style of the Day) */}
      <section className="relative overflow-hidden rounded-2xl bg-[#282a2b] shadow-xl border border-white/10 group">
        {/* Background Image Header */}
        <div className="h-44 w-full relative overflow-hidden bg-[#121414]">
          {styleOfTheDay.imageUrl && (
            <img
              src={styleOfTheDay.imageUrl}
              alt={styleOfTheDay.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#282a2b] via-[#282a2b]/60 to-transparent" />

          {/* Badge Top Left */}
          <div className="absolute top-3.5 left-3.5 z-20">
            <div className="bg-[#fbad18] text-[#684500] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-[#ffd18f]/40">
              <span className="material-symbols-outlined text-sm font-bold">today</span>
              <span className="text-[10px] font-black uppercase tracking-wider">Estilo del Día</span>
            </div>
          </div>

          {/* Shuffle Button Top Right */}
          <div className="absolute top-3.5 right-3.5 z-20">
            <button
              onClick={handleShuffleDaily}
              title="Descubrir otro estilo al azar"
              className="bg-black/60 hover:bg-[#fbad18] text-white hover:text-[#684500] p-1.5 rounded-full border border-white/15 backdrop-blur-md transition-all flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-base">casino</span>
            </button>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4.5 -mt-8 relative z-20 bg-[#282a2b]/95 backdrop-blur-md mx-3.5 mb-3.5 rounded-xl border border-white/10 shadow-lg space-y-3.5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#fbad18]/20 text-[#ffd18f] px-2 py-0.5 rounded border border-[#fbad18]/30">
                  BJCP {styleOfTheDay.code}
                </span>
                <span className="text-[11px] text-[#d7c4ad] font-semibold uppercase tracking-wider">
                  {styleOfTheDay.category}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#ffd18f] mt-1">
                {styleOfTheDay.name}
              </h2>
            </div>
          </div>

          {/* 4 Technical Parameters: ABV, IBU, SRM, EBC */}
          <div className="grid grid-cols-4 gap-1.5 text-center bg-[#121414] p-2.5 rounded-xl border border-white/5">
            <div className="p-1">
              <span className="text-[9px] font-bold text-[#9f8e79] uppercase block tracking-wider">ABV</span>
              <span className="text-xs font-bold text-[#ffd18f]">{styleOfTheDay.abvRange}</span>
            </div>
            <div className="p-1 border-l border-white/5">
              <span className="text-[9px] font-bold text-[#9f8e79] uppercase block tracking-wider">IBU</span>
              <span className="text-xs font-bold text-[#ffd18f]">{styleOfTheDay.ibuRange}</span>
            </div>
            <div className="p-1 border-l border-white/5 flex flex-col items-center">
              <span className="text-[9px] font-bold text-[#9f8e79] uppercase block tracking-wider">SRM</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20"
                  style={{ backgroundColor: srmToHex(styleOfTheDay.srm) }}
                />
                <span className="text-xs font-bold text-[#ffd18f]">{styleOfTheDay.srmRange}</span>
              </div>
            </div>
            <div className="p-1 border-l border-white/5">
              <span className="text-[9px] font-bold text-[#9f8e79] uppercase block tracking-wider">EBC</span>
              <span className="text-xs font-bold text-[#ffd18f]">{styleOfTheDay.ebcRange}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <p className="text-xs text-[#e2e2e2] leading-relaxed">
              {styleOfTheDay.description}
            </p>
          </div>

          {/* Perfil de Sabor */}
          <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5 text-xs text-[#d7c4ad] space-y-0.5">
            <strong className="text-[#ffd18f] flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-xs text-[#fbad18]">psychology</span>
              Perfil de Sabor & Aroma:
            </strong>
            <p className="text-xs text-[#e2e2e2] leading-snug">{styleOfTheDay.flavorProfile}</p>
          </div>

          {/* Maridaje Sugerido */}
          <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5 text-xs text-[#d7c4ad] space-y-0.5">
            <strong className="text-[#ffd18f] flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-xs text-[#fbad18]">restaurant</span>
              Maridaje Sugerido:
            </strong>
            <p className="text-xs text-[#e2e2e2] leading-snug">{styleOfTheDay.pairingSuggestions}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setSelectedStyleModal(styleOfTheDay)}
              className="flex-1 py-2.5 bg-[#333535] hover:bg-[#3e4040] text-[#e2e2e2] font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">info</span>
              Ficha Completa
            </button>
            {onStartNewCataWithStyle && (
              <button
                onClick={() => onStartNewCataWithStyle(`${styleOfTheDay.code}. ${styleOfTheDay.name}`)}
                className="flex-1 py-2.5 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#fbad18]/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Catar Estilo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categorías BJCP Carousel / Filter */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif text-xl font-bold text-[#e2e2e2]">Categorías BJCP</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-[#ffd18f] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              Ver todas ({BJCP_STYLE_DETAILS_DB.length})
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="grid grid-cols-2 gap-2.5">
          {BJCP_STYLE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer border relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#fbad18] bg-[#282a2b] shadow-md shadow-[#fbad18]/10'
                    : 'bg-[#1e2020] border-white/5 hover:border-white/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#fbad18] text-[#684500]'
                      : 'bg-[#121414] text-[#ffd18f] group-hover:bg-[#fbad18]/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-[#e2e2e2] truncate group-hover:text-[#ffd18f]">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-[#9f8e79] truncate mt-0.5">{cat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Styles List with Full Parameters */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-xs font-bold text-[#d7c4ad] uppercase tracking-widest">
            {selectedCategory
              ? `Estilos: ${BJCP_STYLE_CATEGORIES.find((c) => c.id === selectedCategory)?.name}`
              : 'Todos los Estilos BJCP'}
          </h3>
          <span className="text-xs text-[#ffd18f] font-mono font-bold">
            {filteredStyles.length} estilos
          </span>
        </div>

        {filteredStyles.length === 0 ? (
          <div className="bg-[#1e2020] p-8 rounded-2xl border border-white/5 text-center text-[#d7c4ad] space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#524533]">search_off</span>
            <p className="text-sm font-semibold">No se encontraron estilos para "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-xs text-[#ffd18f] underline mt-1"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredStyles.map((style) => (
              <div
                key={style.id}
                onClick={() => setSelectedStyleModal(style)}
                className="bg-[#1e2020] p-4 rounded-xl border border-white/5 hover:border-[#fbad18]/40 transition-all cursor-pointer flex flex-col gap-3 group"
              >
                {/* Header: Code + Name + SRM Circle */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold bg-[#fbad18]/15 text-[#ffd18f] px-1.5 py-0.5 rounded border border-[#fbad18]/25">
                        {style.code}
                      </span>
                      <span className="text-[10px] text-[#9f8e79] font-semibold truncate">
                        {style.category}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-[#ffd18f] group-hover:text-[#fbad18] mt-1 leading-snug">
                      {style.name}
                    </h4>
                  </div>
                  {/* SRM Color indicator */}
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-inner shrink-0 mt-1"
                    style={{ backgroundColor: srmToHex(style.srm) }}
                    title={`SRM ${style.srm} (EBC ${style.ebc})`}
                  />
                </div>

                {/* 4 Technical Specs Badges */}
                <div className="grid grid-cols-4 gap-1 text-center bg-[#121414] py-1.5 px-2 rounded-lg border border-white/5 text-[11px]">
                  <div>
                    <span className="text-[9px] text-[#9f8e79] block">ABV</span>
                    <span className="font-bold text-[#e2e2e2]">{style.abvRange}</span>
                  </div>
                  <div className="border-l border-white/5">
                    <span className="text-[9px] text-[#9f8e79] block">IBU</span>
                    <span className="font-bold text-[#e2e2e2]">{style.ibuRange}</span>
                  </div>
                  <div className="border-l border-white/5">
                    <span className="text-[9px] text-[#9f8e79] block">SRM</span>
                    <span className="font-bold text-[#e2e2e2]">{style.srmRange}</span>
                  </div>
                  <div className="border-l border-white/5">
                    <span className="text-[9px] text-[#9f8e79] block">EBC</span>
                    <span className="font-bold text-[#e2e2e2]">{style.ebcRange}</span>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-[#d7c4ad] line-clamp-2 leading-relaxed">
                  {style.description}
                </p>

                {/* Sabor & Maridaje preview */}
                <div className="text-[11px] text-[#9f8e79] space-y-1 bg-[#181a1a] p-2.5 rounded-lg border border-white/5">
                  <div className="truncate">
                    <span className="text-[#ffd18f] font-semibold">Sabor: </span>
                    <span className="text-[#d7c4ad]">{style.flavorProfile}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-[#ffd18f] font-semibold">Maridaje: </span>
                    <span className="text-[#d7c4ad]">{style.pairingSuggestions}</span>
                  </div>
                </div>

                {/* Footer action row */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-[#ffd18f] group-hover:underline flex items-center gap-1 font-semibold">
                    <span>Ver ficha completa</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>

                  {onStartNewCataWithStyle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartNewCataWithStyle(`${style.code}. ${style.name}`);
                      }}
                      className="px-3 py-1 bg-[#fbad18]/15 hover:bg-[#fbad18] text-[#ffd18f] hover:text-[#684500] rounded-lg text-xs font-bold transition-all border border-[#fbad18]/30 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Catar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive SRM Color Explorer */}
      <section className="bg-[#1a1c1c] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col gap-1 text-center">
          <h3 className="text-xs font-bold text-[#ffd18f] uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">palette</span>
            Explorador de Color (SRM & EBC)
          </h3>
          <p className="text-xs text-[#d7c4ad]">
            Desliza para ver la tonalidad y estilos representativos de la escala cervecera
          </p>
        </div>

        <div className="relative h-12 w-full rounded-full bg-gradient-to-r from-[#F8F753] via-[#D48806] to-[#080707] flex items-center px-2 shadow-inner">
          <input
            type="range"
            min="1"
            max="40"
            value={explorerSRM}
            onChange={(e) => setExplorerSRM(Number(e.target.value))}
            className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-20"
          />
          <div
            className="w-10 h-10 rounded-full shadow-2xl border-2 border-white/80 flex items-center justify-center transition-all duration-75 pointer-events-none"
            style={{
              backgroundColor: srmToHex(explorerSRM),
              marginLeft: `calc(${(explorerSRM / 40) * 100}% - ${
                (explorerSRM / 40) * 36
              }px)`,
            }}
          >
            <span className="text-[11px] font-black text-white drop-shadow-md">
              {explorerSRM}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-[#121414] p-3 rounded-xl border border-white/5">
          <div>
            <span className="text-[10px] text-[#9f8e79] block uppercase tracking-wider">Estilo Ejemplo</span>
            <span className="font-serif text-sm font-bold text-[#ffd18f]">
              {srmMatch.name}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#9f8e79] block uppercase tracking-wider">Equivalencia</span>
            <span className="text-xs font-bold text-[#e2e2e2]">
              {explorerSRM} SRM ≈ {Math.round(explorerSRM * 1.97)} EBC
            </span>
          </div>
        </div>
      </section>

      {/* Style Detail Modal */}
      {selectedStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1e2020] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#fbad18]/20 text-[#ffd18f] rounded border border-[#fbad18]/30">
                    BJCP {selectedStyleModal.code}
                  </span>
                  <span className="text-xs text-[#d7c4ad] font-semibold">
                    {selectedStyleModal.category}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {selectedStyleModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStyleModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Technical Specs Grid: ABV, IBU, SRM, EBC */}
            <div className="grid grid-cols-4 gap-2 text-center bg-[#121414] p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">ABV</span>
                <span className="text-xs font-bold text-[#ffd18f]">{selectedStyleModal.abvRange}</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">IBU</span>
                <span className="text-xs font-bold text-[#ffd18f]">{selectedStyleModal.ibuRange}</span>
              </div>
              <div className="border-l border-white/5 flex flex-col items-center">
                <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">SRM</span>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ backgroundColor: srmToHex(selectedStyleModal.srm) }}
                  />
                  <span className="text-xs font-bold text-[#ffd18f]">{selectedStyleModal.srmRange}</span>
                </div>
              </div>
              <div className="border-l border-white/5">
                <span className="text-[10px] text-[#9f8e79] block uppercase font-bold">EBC</span>
                <span className="text-xs font-bold text-[#ffd18f]">{selectedStyleModal.ebcRange}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <strong className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider block">
                Descripción del Estilo
              </strong>
              <p className="text-sm text-[#e2e2e2] leading-relaxed bg-[#121414] p-3.5 rounded-xl border border-white/5">
                {selectedStyleModal.description}
              </p>
            </div>

            {/* Perfil de Sabor */}
            <div className="space-y-1">
              <strong className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#fbad18]">psychology</span>
                Perfil de Sabor & Aroma
              </strong>
              <p className="text-xs text-[#d7c4ad] bg-[#121414] p-3 rounded-xl border border-white/5 leading-relaxed">
                {selectedStyleModal.flavorProfile}
              </p>
            </div>

            {/* Maridaje Sugerido */}
            <div className="space-y-1">
              <strong className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#fbad18]">restaurant</span>
                Maridaje Sugerido
              </strong>
              <p className="text-xs text-[#d7c4ad] bg-[#121414] p-3 rounded-xl border border-white/5 leading-relaxed">
                {selectedStyleModal.pairingSuggestions}
              </p>
            </div>

            {/* Action button */}
            {onStartNewCataWithStyle && (
              <button
                onClick={() => {
                  const styleToPass = `${selectedStyleModal.code}. ${selectedStyleModal.name}`;
                  setSelectedStyleModal(null);
                  onStartNewCataWithStyle(styleToPass);
                }}
                className="w-full py-3.5 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Iniciar Cata con este Estilo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
