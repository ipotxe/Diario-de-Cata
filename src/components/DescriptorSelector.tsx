import React, { useState, useMemo } from 'react';
import {
  SENSORY_DESCRIPTORS_DATABASE,
  ALL_DESCRIPTORS,
} from '../data/sensoryDescriptors';

interface DescriptorSelectorProps {
  title: string;
  subtitle?: string;
  selectedDescriptors: string[];
  onChange: (descriptors: string[]) => void;
  suggestedList?: string[];
  placeholder?: string;
  accentColor?: string;
  icon?: string;
}

export const DescriptorSelector: React.FC<DescriptorSelectorProps> = ({
  title,
  subtitle,
  selectedDescriptors,
  onChange,
  suggestedList = [],
  placeholder = 'Buscar o añadir descriptor...',
  accentColor = '#fbad18',
  icon = 'local_florist',
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const toggleDescriptor = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (selectedDescriptors.includes(trimmed)) {
      onChange(selectedDescriptors.filter((d) => d !== trimmed));
    } else {
      onChange([...selectedDescriptors, trimmed]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (!selectedDescriptors.includes(trimmed)) {
      onChange([...selectedDescriptors, trimmed]);
    }
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  // Search filtered items
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase().trim();
    return ALL_DESCRIPTORS.filter((d) => d.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="flex flex-col gap-3 bg-[#121414] p-4 rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[#ffd18f]">{icon}</span>
          <div>
            <h4 className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider">{title}</h4>
            {subtitle && <p className="text-[11px] text-[#9f8e79]">{subtitle}</p>}
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-[#282a2b] text-[#ffd18f] px-2.5 py-0.5 rounded-full border border-white/10">
          {selectedDescriptors.length} seleccionados
        </span>
      </div>

      {/* Selected Tags Chips */}
      {selectedDescriptors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#1e2020] rounded-xl border border-white/5">
          {selectedDescriptors.map((desc) => (
            <span
              key={desc}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fbad18]/20 border border-[#fbad18]/50 text-[#ffd18f] text-xs font-medium rounded-lg animate-fadeIn"
            >
              <span>{desc}</span>
              <button
                type="button"
                onClick={() => toggleDescriptor(desc)}
                className="hover:text-white p-0.5 rounded focus:outline-none"
              >
                <span className="material-symbols-outlined text-[13px] leading-none">close</span>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-[#9f8e79] hover:text-[#d7c4ad] underline px-1.5 py-1 self-center"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* Search and Quick Add Bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9f8e79]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-[#1e2020] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none placeholder:text-[#524533]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9f8e79] hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        {search.trim() && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3 py-2 bg-[#fbad18] text-[#121414] rounded-xl text-xs font-bold hover:bg-[#ffc043] transition-all flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Añadir
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowCatalog(!showCatalog)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
            showCatalog
              ? 'bg-[#ffd18f] text-[#121414] border-[#ffd18f]'
              : 'bg-[#1e2020] text-[#d7c4ad] border-white/10 hover:border-[#fbad18]'
          }`}
          title="Ver catálogo completo"
        >
          <span className="material-symbols-outlined text-sm">menu_book</span>
          <span className="hidden sm:inline">Catálogo</span>
        </button>
      </div>

      {/* Search Dropdown / Results */}
      {search.trim() && (
        <div className="bg-[#1e2020] border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
          <p className="text-[10px] uppercase font-bold text-[#9f8e79] mb-1.5">Resultados de búsqueda</p>
          <div className="flex flex-wrap gap-1.5">
            {searchResults.map((res) => {
              const isSelected = selectedDescriptors.includes(res);
              return (
                <button
                  key={res}
                  type="button"
                  onClick={() => toggleDescriptor(res)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#fbad18] text-[#121414] border-[#fbad18] font-bold'
                      : 'bg-[#121414] text-[#e2e2e2] border-white/10 hover:border-[#fbad18]'
                  }`}
                >
                  {isSelected ? `✓ ${res}` : `+ ${res}`}
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <p className="text-xs text-[#9f8e79]">
                No se encontraron descriptores estándar con "{search}". Pulsa{' '}
                <strong className="text-[#ffd18f]">Añadir</strong> para incluirlo como descriptor personalizado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick suggestions if not searching */}
      {!search.trim() && suggestedList.length > 0 && !showCatalog && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#9f8e79] font-bold uppercase tracking-wider">
            Descriptores Frecuentes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedList.map((item) => {
              const isSelected = selectedDescriptors.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleDescriptor(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
                    isSelected
                      ? 'bg-[#fbad18] text-[#121414] font-bold border-[#fbad18]'
                      : 'bg-[#1e2020] text-[#d7c4ad] border-white/5 hover:border-white/20'
                  }`}
                >
                  {isSelected ? `✓ ${item}` : `+ ${item}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Catalog Explorer */}
      {showCatalog && (
        <div className="bg-[#1e2020] border border-[#fbad18]/30 rounded-xl p-3 flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-[#ffd18f] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">category</span>
              Base de Datos Sensorial BJCP / Meilgaard
            </span>
            <button
              type="button"
              onClick={() => setShowCatalog(false)}
              className="text-xs text-[#9f8e79] hover:text-white"
            >
              Cerrar catálogo
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                activeCategory === null
                  ? 'bg-[#fbad18] text-[#121414] border-[#fbad18]'
                  : 'bg-[#121414] text-[#d7c4ad] border-white/5'
              }`}
            >
              Todas las categorías
            </button>
            {SENSORY_DESCRIPTORS_DATABASE.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActiveCategory(cat.category)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all flex items-center gap-1 ${
                  activeCategory === cat.category
                    ? 'bg-[#fbad18] text-[#121414] border-[#fbad18]'
                    : 'bg-[#121414] text-[#d7c4ad] border-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                <span>{cat.category}</span>
              </button>
            ))}
          </div>

          {/* Descriptors List by Category */}
          <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
            {SENSORY_DESCRIPTORS_DATABASE.filter(
              (cat) => activeCategory === null || cat.category === activeCategory
            ).map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#ffd18f]">
                  <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                  <span>{cat.category}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => {
                    const isSelected = selectedDescriptors.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDescriptor(item)}
                        className={`px-2 py-1 rounded-md text-xs transition-all border ${
                          isSelected
                            ? 'bg-[#fbad18] text-[#121414] font-bold border-[#fbad18]'
                            : 'bg-[#121414] text-[#e2e2e2] border-white/5 hover:border-white/20'
                        }`}
                      >
                        {isSelected ? `✓ ${item}` : item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
