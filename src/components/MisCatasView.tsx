import React, { useState, useMemo } from 'react';
import { BeerTasting, ActiveTab } from '../types';
import { BeerCard } from './BeerCard';

interface MisCatasViewProps {
  tastings: BeerTasting[];
  onSelectBeer: (beer: BeerTasting) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const MisCatasView: React.FC<MisCatasViewProps> = ({
  tastings,
  onSelectBeer,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filteredTastings = useMemo(() => {
    return tastings.filter((tasting) => {
      const matchesSearch =
        tasting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tasting.brewery.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tasting.style.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (!selectedFilter) return true;

      if (selectedFilter === 'IPA') {
        return tasting.style.toLowerCase().includes('ipa');
      }
      if (selectedFilter === 'Stout') {
        return tasting.style.toLowerCase().includes('stout') || tasting.style.toLowerCase().includes('porter');
      }
      if (selectedFilter === 'Sour') {
        return tasting.style.toLowerCase().includes('sour');
      }
      if (selectedFilter === 'Rating 4.5+') {
        return tasting.rating >= 4.5;
      }

      return true;
    });
  }, [tastings, searchQuery, selectedFilter]);

  const toggleFilter = (filterName: string) => {
    if (selectedFilter === filterName) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(filterName);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-24">
      {/* Search & Filter Bar */}
      <section className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9f8e79] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o cervecería..."
            className="w-full h-12 pl-12 pr-4 bg-[#1e2020] rounded-xl text-[#e2e2e2] placeholder:text-[#524533] text-sm focus:outline-none focus:ring-1 focus:ring-[#fbad18] transition-all border border-white/5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9f8e79] hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
            </button>
          )}
        </div>

        {/* Quick Filters Horizontal Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
          <button
            onClick={() => setSelectedFilter(null)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
              selectedFilter === null
                ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-base">tune</span>
            <span>Todos ({tastings.length})</span>
          </button>

          {['IPA', 'Stout', 'Sour', 'Rating 4.5+'].map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                selectedFilter === filter
                  ? 'bg-[#fbad18] text-[#684500] shadow-md shadow-[#fbad18]/20'
                  : 'bg-[#1e2020] text-[#d7c4ad] border border-white/5 hover:border-white/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Tastings List */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="font-serif text-2xl font-bold text-[#e2e2e2]">
            Catas Recientes
          </h2>
          <span className="text-xs font-bold text-[#ffd18f] uppercase tracking-widest cursor-pointer hover:underline">
            {filteredTastings.length} ENTRADAS
          </span>
        </div>

        {filteredTastings.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {filteredTastings.map((beer, index) => (
              <BeerCard key={beer.id} beer={beer} index={index} onClick={onSelectBeer} />
            ))}
          </div>
        ) : (
          /* Empty State */
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
