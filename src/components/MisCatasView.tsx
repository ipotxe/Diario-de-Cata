import React, { useState, useMemo } from 'react';
import { BeerTasting, ActiveTab } from '../types';
import { BeerCard } from './BeerCard';

interface MisCatasViewProps {
  tastings: BeerTasting[];
  onSelectBeer: (beer: BeerTasting) => void;
  onNavigate: (tab: ActiveTab) => void;
}

type SortOption = 'recent' | 'oldest' | 'rating-desc' | 'rating-asc' | 'abv-desc' | 'abv-asc' | 'name-asc';

export const MisCatasView: React.FC<MisCatasViewProps> = ({
  tastings,
  onSelectBeer,
  onNavigate,
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecificStyle, setSelectedSpecificStyle] = useState<string>('all');
  const [minAbv, setMinAbv] = useState<number>(0);
  const [maxAbv, setMaxAbv] = useState<number>(20);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Quick Preset Categories
  const STYLE_CATEGORIES = [
    { id: 'all', label: 'Todos los estilos' },
    { id: 'ipa', label: 'IPA / Lupuladas' },
    { id: 'stout', label: 'Stouts & Porters' },
    { id: 'lager', label: 'Lagers & Pilsners' },
    { id: 'belgian', label: 'Belgas & Abadía' },
    { id: 'wheat', label: 'Trigo / Weizen' },
    { id: 'sour', label: 'Sours & Ácidas' },
  ];

  // Extract unique specific styles from user's collection
  const availableStyles = useMemo(() => {
    const styleMap = new Map<string, number>();
    tastings.forEach((t) => {
      if (t.style) {
        styleMap.set(t.style, (styleMap.get(t.style) || 0) + 1);
      }
    });
    return Array.from(styleMap.entries())
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => a.style.localeCompare(b.style));
  }, [tastings]);

  // ABV Presets
  const ABV_PRESETS = [
    { label: 'Cualquiera', min: 0, max: 20 },
    { label: '< 4.5% (Ligera)', min: 0, max: 4.5 },
    { label: '4.5% - 6.5% (Media)', min: 4.5, max: 6.5 },
    { label: '6.5% - 8.5% (Fuerte)', min: 6.5, max: 8.5 },
    { label: '> 8.5% (Imperial)', min: 8.5, max: 20 },
  ];

  // Check if a specific ABV preset is active
  const isAbvPresetActive = (presetMin: number, presetMax: number) => {
    return minAbv === presetMin && maxAbv === presetMax;
  };

  const handleSelectAbvPreset = (min: number, max: number) => {
    setMinAbv(min);
    setMaxAbv(max);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSpecificStyle('all');
    setMinAbv(0);
    setMaxAbv(20);
    setMinRating(0);
    setSortBy('recent');
  };

  // Count active filters (excluding default values)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedSpecificStyle !== 'all') count++;
    if (minAbv > 0 || maxAbv < 20) count++;
    if (minRating > 0) count++;
    if (sortBy !== 'recent') count++;
    return count;
  }, [searchQuery, selectedCategory, selectedSpecificStyle, minAbv, maxAbv, minRating, sortBy]);

  // Filter & Sort Logic
  const filteredAndSortedTastings = useMemo(() => {
    const result = tastings.filter((tasting) => {
      // 1. Text Search across name, brewery, style, country, descriptors and notes
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tasting.name.toLowerCase().includes(q);
        const matchesBrewery = tasting.brewery.toLowerCase().includes(q);
        const matchesStyle = tasting.style.toLowerCase().includes(q);
        const matchesCountry = (tasting.country || '').toLowerCase().includes(q);
        const matchesNotes = (tasting.notes || '').toLowerCase().includes(q);
        const matchesAroma = (tasting.aromaDescriptors || []).some((d) => d.toLowerCase().includes(q));
        const matchesSabor = (tasting.saborDescriptors || []).some((d) => d.toLowerCase().includes(q));

        if (!matchesName && !matchesBrewery && !matchesStyle && !matchesCountry && !matchesNotes && !matchesAroma && !matchesSabor) {
          return false;
        }
      }

      // 2. Filter by Specific Style
      if (selectedSpecificStyle !== 'all') {
        if (tasting.style !== selectedSpecificStyle) {
          return false;
        }
      }

      // 3. Filter by Category
      if (selectedCategory !== 'all') {
        const s = tasting.style.toLowerCase();
        if (selectedCategory === 'ipa' && !s.includes('ipa') && !s.includes('india pale')) return false;
        if (selectedCategory === 'stout' && !s.includes('stout') && !s.includes('porter')) return false;
        if (selectedCategory === 'lager' && !s.includes('lager') && !s.includes('pils') && !s.includes('helles') && !s.includes('märzen') && !s.includes('bock')) return false;
        if (selectedCategory === 'belgian' && !s.includes('belg') && !s.includes('tripel') && !s.includes('dubbel') && !s.includes('saison') && !s.includes('blond')) return false;
        if (selectedCategory === 'wheat' && !s.includes('weizen') && !s.includes('trigo') && !s.includes('witbier') && !s.includes('blanche')) return false;
        if (selectedCategory === 'sour' && !s.includes('sour') && !s.includes('gose') && !s.includes('lambic') && !s.includes('berliner') && !s.includes('ácid') && !s.includes('acid')) return false;
      }

      // 4. Filter by ABV Range
      const abv = typeof tasting.abv === 'number' ? tasting.abv : 0;
      if (abv < minAbv || abv > maxAbv) {
        return false;
      }

      // 5. Filter by Minimum Rating
      if (minRating > 0 && tasting.rating < minRating) {
        return false;
      }

      return true;
    });

    // 6. Sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'oldest':
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case 'rating-desc':
          return b.rating - a.rating;
        case 'rating-asc':
          return a.rating - b.rating;
        case 'abv-desc':
          return (b.abv || 0) - (a.abv || 0);
        case 'abv-asc':
          return (a.abv || 0) - (b.abv || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [tastings, searchQuery, selectedSpecificStyle, selectedCategory, minAbv, maxAbv, minRating, sortBy]);

  return (
    <div className="flex flex-col w-full gap-5 pb-24">
      {/* Search & Advanced Filters Container */}
      <section className="flex flex-col gap-3">
        {/* Search Input & Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9f8e79] text-xl group-focus-within:text-[#fbad18] transition-colors">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, cervecería, país o notas..."
              className="w-full h-12 pl-11 pr-10 bg-[#1e2020] rounded-xl text-[#e2e2e2] placeholder:text-[#524533] text-sm focus:outline-none focus:ring-1 focus:ring-[#fbad18] transition-all border border-white/5 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9f8e79] hover:text-white transition-colors"
                title="Borrar texto"
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
              </button>
            )}
          </div>

          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`h-12 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 border ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-[#fbad18] text-[#684500] border-[#ffd18f] shadow-md shadow-[#fbad18]/20'
                : 'bg-[#1e2020] text-[#d7c4ad] border-white/10 hover:border-white/20 hover:text-white'
            }`}
            title="Filtros avanzados"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-black leading-none ${
                  isAdvancedOpen || activeFiltersCount > 0
                    ? 'bg-[#684500] text-[#ffd18f]'
                    : 'bg-[#fbad18] text-[#684500]'
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filters Horizontal Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar items-center">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSpecificStyle('all');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
              selectedCategory === 'all' && selectedSpecificStyle === 'all'
                ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
            }`}
          >
            <span>Todos ({tastings.length})</span>
          </button>

          {/* Quick Rating 4.5+ */}
          <button
            type="button"
            onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
              minRating === 4.5
                ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm symbol-fill-1 text-[#fbad18] group-hover:text-inherit">star</span>
            <span>4.5+ Estrellas</span>
          </button>

          {/* Quick Style presets */}
          {[
            { id: 'ipa', label: '🍺 IPAs' },
            { id: 'stout', label: '☕ Stouts & Porters' },
            { id: 'lager', label: '🌾 Lagers & Pils' },
            { id: 'belgian', label: '🏰 Belgas' },
            { id: 'sour', label: '🍋 Sours' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                  : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Quick High ABV */}
          <button
            type="button"
            onClick={() => {
              if (minAbv === 7) {
                setMinAbv(0);
                setMaxAbv(20);
              } else {
                setMinAbv(7);
                setMaxAbv(20);
              }
            }}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
              minAbv === 7 && maxAbv === 20
                ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
            }`}
          >
            <span>⚡ Fuerte (&gt; 7%)</span>
          </button>
        </div>

        {/* EXPANDABLE ADVANCED FILTERS PANEL */}
        {isAdvancedOpen && (
          <div className="bg-[#1e2020] border border-[#fbad18]/30 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl animate-fade-in">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#ffd18f]">
                <span className="material-symbols-outlined text-xl text-[#fbad18]">tune</span>
                <span className="font-serif font-bold text-sm text-[#ffd18f]">Filtros Avanzados</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-[#fbad18] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span>Restablecer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-[#d7c4ad] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* 1. FILTRO POR ESTILO / CATEGORÍA */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#d7c4ad] flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#fbad18]">sports_bar</span>
                Estilo / Familia Cervecera
              </label>

              {/* Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {STYLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedSpecificStyle('all');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium text-left truncate transition-colors border ${
                      selectedCategory === cat.id && selectedSpecificStyle === 'all'
                        ? 'bg-[#fbad18] text-[#684500] font-bold border-[#ffd18f]'
                        : 'bg-[#121414] text-[#d7c4ad] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Specific Style Dropdown from User's Tastings */}
              {availableStyles.length > 0 && (
                <div className="mt-1">
                  <label className="text-[11px] text-[#9f8e79] block mb-1">
                    O selecciona un estilo específico de tus catas:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpecificStyle}
                      onChange={(e) => {
                        setSelectedSpecificStyle(e.target.value);
                        if (e.target.value !== 'all') {
                          setSelectedCategory('all');
                        }
                      }}
                      className="w-full bg-[#121414] text-xs text-[#e2e2e2] rounded-xl px-3 py-2.5 border border-white/10 focus:ring-1 focus:ring-[#fbad18] outline-none appearance-none pr-8 cursor-pointer"
                    >
                      <option value="all">Todos los estilos específicos ({availableStyles.length})</option>
                      {availableStyles.map(({ style, count }) => (
                        <option key={style} value={style}>
                          {style} ({count})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#9f8e79] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. FILTRO POR GRADUACIÓN ALCOHÓLICA (ABV %) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#d7c4ad] flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base text-[#fbad18]">percent</span>
                  Graduación Alcohólica (ABV)
                </label>
                <span className="text-xs font-mono font-bold text-[#ffd18f] bg-[#121414] px-2 py-0.5 rounded border border-white/10">
                  {minAbv}% — {maxAbv === 20 ? '20%+' : `${maxAbv}%`}
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ABV_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectAbvPreset(preset.min, preset.max)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium text-center transition-colors border ${
                      isAbvPresetActive(preset.min, preset.max)
                        ? 'bg-[#fbad18] text-[#684500] font-bold border-[#ffd18f]'
                        : 'bg-[#121414] text-[#d7c4ad] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Dual Sliders for Min & Max ABV */}
              <div className="grid grid-cols-2 gap-3 mt-1.5 bg-[#121414] p-2.5 rounded-xl border border-white/5">
                <div>
                  <div className="flex justify-between text-[10px] text-[#9f8e79] mb-1">
                    <span>Mínimo</span>
                    <span className="text-[#ffd18f] font-mono font-bold">{minAbv}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={minAbv}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMinAbv(val);
                      if (val > maxAbv) setMaxAbv(val);
                    }}
                    className="w-full h-1.5 bg-[#333535] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#9f8e79] mb-1">
                    <span>Máximo</span>
                    <span className="text-[#ffd18f] font-mono font-bold">
                      {maxAbv === 20 ? '20%+' : `${maxAbv}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={maxAbv}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMaxAbv(val);
                      if (val < minAbv) setMinAbv(val);
                    }}
                    className="w-full h-1.5 bg-[#333535] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
                  />
                </div>
              </div>
            </div>

            {/* 3. FILTRO POR VALORACIÓN / RATING (ESTRELLAS) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#d7c4ad] flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base text-[#fbad18] symbol-fill-1">star</span>
                  Puntuación Mínima
                </label>
                <span className="text-xs font-bold text-[#ffd18f]">
                  {minRating === 0 ? 'Todas las notas' : `≥ ${minRating} ★`}
                </span>
              </div>

              {/* Interactive Star Tier Buttons */}
              <div className="flex gap-1.5">
                {[
                  { value: 0, label: 'Todas' },
                  { value: 3, label: '3.0+' },
                  { value: 4, label: '4.0+' },
                  { value: 4.5, label: '4.5+' },
                  { value: 5, label: '5.0 ★' },
                ].map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => setMinRating(tier.value)}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      minRating === tier.value
                        ? 'bg-[#fbad18] text-[#684500] border-[#ffd18f] shadow-md'
                        : 'bg-[#121414] text-[#d7c4ad] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {tier.value > 0 && (
                      <span
                        className={`material-symbols-outlined text-sm ${
                          minRating === tier.value ? 'symbol-fill-1 text-[#684500]' : 'symbol-fill-1 text-[#fbad18]'
                        }`}
                      >
                        star
                      </span>
                    )}
                    <span>{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. CRITERIO DE ORDENACIÓN */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-[#d7c4ad] flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#fbad18]">sort</span>
                Ordenar Resultados
              </label>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full bg-[#121414] text-xs text-[#e2e2e2] rounded-xl px-3 py-2.5 border border-white/10 focus:ring-1 focus:ring-[#fbad18] outline-none appearance-none pr-8 cursor-pointer"
                >
                  <option value="recent">Más recientes primero (por fecha de cata)</option>
                  <option value="oldest">Más antiguas primero</option>
                  <option value="rating-desc">Mayor valoración (5 ★ a 1 ★)</option>
                  <option value="rating-asc">Menor valoración (1 ★ a 5 ★)</option>
                  <option value="abv-desc">Mayor graduación (Mayor ABV %)</option>
                  <option value="abv-asc">Menor graduación (Menor ABV %)</option>
                  <option value="name-asc">Nombre alfabético (A — Z)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#9f8e79] pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>

            {/* Panel Actions */}
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl bg-[#121414] hover:bg-white/5 border border-white/10 text-xs font-semibold text-[#d7c4ad] transition-colors"
              >
                Limpiar Todo
              </button>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider shadow"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE FILTER CHIPS (Tags) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
            <span className="text-[11px] font-semibold text-[#9f8e79] mr-1">Filtros activos:</span>

            {/* Search Query Tag */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* Category Tag */}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span>Estilo: {STYLE_CATEGORIES.find((c) => c.id === selectedCategory)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* Specific Style Tag */}
            {selectedSpecificStyle !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span className="truncate max-w-[140px]">{selectedSpecificStyle}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSpecificStyle('all')}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* ABV Range Tag */}
            {(minAbv > 0 || maxAbv < 20) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span>ABV: {minAbv}% - {maxAbv === 20 ? '20%+' : `${maxAbv}%`}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMinAbv(0);
                    setMaxAbv(20);
                  }}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* Rating Tag */}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span>≥ {minRating} ★</span>
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* Sort Tag */}
            {sortBy !== 'recent' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2b] border border-white/10 text-[#ffd18f] text-xs">
                <span>Orden: {sortBy}</span>
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className="hover:text-white p-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            )}

            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-[#fbad18] hover:underline font-bold px-1.5 py-0.5"
            >
              Borrar todos
            </button>
          </div>
        )}
      </section>

      {/* Tastings List Section */}
      <section className="flex flex-col gap-4">
        {/* Results Counter Header */}
        <div className="flex justify-between items-end px-1">
          <h2 className="font-serif text-2xl font-bold text-[#e2e2e2]">
            {activeFiltersCount > 0 ? 'Resultados Filtrados' : 'Catas Registradas'}
          </h2>
          <span className="text-xs font-bold text-[#ffd18f] uppercase tracking-widest">
            {filteredAndSortedTastings.length} de {tastings.length} {tastings.length === 1 ? 'CATA' : 'CATAS'}
          </span>
        </div>

        {/* List of Beer Cards */}
        {filteredAndSortedTastings.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {filteredAndSortedTastings.map((beer, index) => (
              <BeerCard key={beer.id} beer={beer} index={index} onClick={onSelectBeer} />
            ))}
          </div>
        ) : tastings.length > 0 ? (
          /* Empty Search / Filter Results State */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3.5 bg-[#1e2020]/60 border border-white/5 rounded-2xl animate-fade-in">
            <div className="w-16 h-16 bg-[#282a2b] rounded-full flex items-center justify-center text-[#fbad18]">
              <span className="material-symbols-outlined text-3xl">filter_alt_off</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#e2e2e2]">
              Sin coincidencias para los filtros aplicados
            </h3>
            <p className="text-xs text-[#d7c4ad] max-w-xs leading-relaxed">
              No hemos encontrado cervezas que cumplan con todos los criterios seleccionados. Prueba a ajustar o restablecer los filtros.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-1 px-5 py-2.5 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Restablecer Filtros
            </button>
          </div>
        ) : (
          /* Empty Collection State (No beers logged at all) */
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4 bg-[#1e2020]/60 border border-white/5 rounded-2xl">
            <div className="w-20 h-20 bg-[#282a2b] rounded-full flex items-center justify-center mb-1 text-[#9f8e79]">
              <span className="material-symbols-outlined text-4xl">sports_bar</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#e2e2e2]">
              ¿Sediento de aventuras?
            </h3>
            <p className="text-sm text-[#d7c4ad] max-w-xs">
              Tu diario está esperando por tu primera cata. ¡Destapa una cerveza y comienza a escribir!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('nueva-cata')}
              className="mt-2 px-6 py-3 bg-[#fbad18] text-[#684500] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nueva Cata
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
