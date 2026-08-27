import React, { useState, useMemo } from 'react';
import { BeerTasting } from '../types';
import {
  evaluarInsignias,
  EvaluatedBadge,
  BADGE_CATEGORIES,
  getCategoryColor,
} from '../utils/badgeEngine';
import { ChapaBottleCap } from './ChapaBottleCap';

interface InsigniasViewProps {
  tastings: BeerTasting[];
  onStartNewCata?: () => void;
}

const getRankTitle = (unlockedCount: number): { title: string; nextAt: number; icon: string; desc: string } => {
  if (unlockedCount >= 22) {
    return {
      title: 'Leyenda Cervecera Magna',
      nextAt: 25,
      icon: '👑',
      desc: 'Has dominado el arte, estilos y aromas de la cerveza a nivel supremo.',
    };
  }
  if (unlockedCount >= 16) {
    return {
      title: 'Maestro Sommelier BJCP',
      nextAt: 22,
      icon: '🏆',
      desc: 'Paladar ultra refinado con maestría en estilos internacionales.',
    };
  }
  if (unlockedCount >= 10) {
    return {
      title: 'Juez Cervecero en Prácticas',
      nextAt: 16,
      icon: '🎓',
      desc: 'Explorador avanzado con amplia bitácora sensorial y técnica.',
    };
  }
  if (unlockedCount >= 5) {
    return {
      title: 'Aficionado del Lúpulo y Malta',
      nextAt: 10,
      icon: '🍻',
      desc: 'Desarrollando el paladar en diversos estilos y familias.',
    };
  }
  return {
    title: 'Iniciado Cervecero',
    nextAt: 5,
    icon: '🍺',
    desc: 'Comienza a catar y registrar cervezas para ganar tus primeras chapas.',
  };
};

export const InsigniasView: React.FC<InsigniasViewProps> = ({ tastings, onStartNewCata }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectBadge, setInspectBadge] = useState<EvaluatedBadge | null>(null);

  // Evaluate all badges from real user tastings
  const allBadges = useMemo(() => evaluarInsignias(tastings), [tastings]);

  const unlockedCount = useMemo(() => allBadges.filter((b) => b.unlocked).length, [allBadges]);
  const totalBadges = allBadges.length;
  const globalProgress = Math.round((unlockedCount / totalBadges) * 100);
  const rank = getRankTitle(unlockedCount);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      const matchCat = selectedCategory === 'todas' || badge.categoria === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        badge.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allBadges, selectedCategory, searchQuery]);

  // General Statistics
  const uniqueStyles = useMemo(
    () => new Set(tastings.map((t) => t.style?.toLowerCase().trim()).filter(Boolean)).size,
    [tastings]
  );
  const uniqueCountries = useMemo(
    () => new Set(tastings.map((t) => t.country?.toLowerCase().trim()).filter(Boolean)).size,
    [tastings]
  );

  return (
    <div className="flex flex-col w-full gap-6 pb-28 max-w-lg mx-auto animate-fade-in">
      {/* Rank & Level Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#221811] via-[#1e2020] to-[#17100b] rounded-3xl p-5 border border-[#fbad18]/25 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] flex items-center justify-center text-3xl shadow-lg shadow-[#fbad18]/20 shrink-0">
              {rank.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#fbad18] uppercase">
                  Rango Cervecero
                </span>
                <span className="px-1.5 py-0.2 bg-[#fbad18]/15 border border-[#fbad18]/30 text-[#ffd18f] text-[10px] font-bold rounded-md">
                  {globalProgress}%
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#ffd18f] leading-tight mt-0.5">
                {rank.title}
              </h2>
              <p className="text-xs text-[#d7c4ad] mt-0.5">{rank.desc}</p>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-[#d7c4ad]">Insignias Coleccionadas</span>
            <span className="font-mono font-bold text-[#fbad18]">
              {unlockedCount} / {totalBadges} chapas
            </span>
          </div>
          <div className="h-2.5 w-full bg-[#121414] rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#fbad18] via-[#ffd18f] to-[#7ef24a] transition-all duration-700 shadow-sm"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Quick Strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#1e2020] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-lg font-bold text-[#fbad18]">{tastings.length}</span>
          <span className="text-[10px] text-[#a89680] font-medium leading-tight mt-0.5">Catas</span>
        </div>
        <div className="bg-[#1e2020] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-lg font-bold text-[#ffd18f]">{uniqueStyles}</span>
          <span className="text-[10px] text-[#a89680] font-medium leading-tight mt-0.5">Estilos</span>
        </div>
        <div className="bg-[#1e2020] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-lg font-bold text-[#7ef24a]">{uniqueCountries}</span>
          <span className="text-[10px] text-[#a89680] font-medium leading-tight mt-0.5">Países</span>
        </div>
        <div className="bg-[#1e2020] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-lg font-bold text-[#fbad18]">{unlockedCount}</span>
          <span className="text-[10px] text-[#a89680] font-medium leading-tight mt-0.5">Chapas</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89680] text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar insignias y desafíos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e2020] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#e2e2e2] placeholder-[#7a6e58] focus:outline-none focus:border-[#fbad18]/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89680] hover:text-[#e2e2e2]"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
          {BADGE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const countInCat =
              cat.id === 'todas'
                ? allBadges.filter((b) => b.unlocked).length
                : allBadges.filter((b) => b.categoria === cat.id && b.unlocked).length;
            const totalInCat =
              cat.id === 'todas'
                ? allBadges.length
                : allBadges.filter((b) => b.categoria === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-[#fbad18] text-[#121414] border-[#fbad18] shadow-md shadow-[#fbad18]/20 font-bold scale-[1.02]'
                    : 'bg-[#1e2020] text-[#d7c4ad] border-white/5 hover:border-white/15'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.iconName}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-[#121414]/20 text-[#121414]' : 'bg-[#121414] text-[#a89680]'
                  }`}
                >
                  {countInCat}/{totalInCat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-lg font-bold text-[#ffd18f]">
            {selectedCategory === 'todas'
              ? 'Todas las Insignias'
              : BADGE_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
          </h3>
          <span className="text-xs text-[#a89680]">
            {filteredBadges.length} {filteredBadges.length === 1 ? 'insignia' : 'insignias'}
          </span>
        </div>

        {filteredBadges.length === 0 ? (
          <div className="bg-[#1e2020] rounded-2xl p-8 text-center border border-white/5">
            <span className="material-symbols-outlined text-4xl text-[#7a6e58] mb-2">
              military_tech
            </span>
            <p className="text-sm font-semibold text-[#ffd18f]">No se encontraron insignias</p>
            <p className="text-xs text-[#a89680] mt-1">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredBadges.map((badge) => {
              const catColor = getCategoryColor(badge.categoria);
              return (
                <div
                  key={badge.id}
                  onClick={() => setInspectBadge(badge)}
                  className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer group active:scale-[0.98] ${
                    badge.unlocked
                      ? 'bg-[#1e2020] border-[#fbad18]/30 hover:border-[#fbad18]/60 shadow-sm'
                      : 'bg-[#171919] border-white/5 hover:border-white/10 opacity-90'
                  }`}
                >
                  {/* Chapa Bottle Cap */}
                  <ChapaBottleCap insignia={badge} size={58} />

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-sm font-bold truncate ${
                          badge.unlocked ? 'text-[#ffd18f]' : 'text-[#d7c4ad]'
                        }`}
                      >
                        {badge.nombre}
                      </h4>
                      {badge.unlocked ? (
                        <span className="text-[10px] font-bold text-[#7ef24a] bg-[#7ef24a]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                          Logrado
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] font-bold text-[#a89680] shrink-0">
                          {badge.current}/{badge.target}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#a89680] line-clamp-2 leading-relaxed mb-2">
                      {badge.desc}
                    </p>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-[#121414] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(badge.progreso * 100)}%`,
                          backgroundColor: catColor,
                          opacity: badge.unlocked ? 1 : 0.75,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State / CTA if low tastings */}
      {tastings.length === 0 && (
        <div className="bg-gradient-to-br from-[#282a2b] to-[#1e2020] border border-[#fbad18]/30 rounded-3xl p-6 text-center shadow-lg">
          <span className="text-4xl mb-2 block">🍺</span>
          <h3 className="font-serif text-xl font-bold text-[#ffd18f]">
            ¡Empieza a Desbloquear Chapas!
          </h3>
          <p className="text-xs text-[#d7c4ad] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Registra tu primera cata para conseguir tu primera insignia y subir en el ranking
            cervecero.
          </p>
          {onStartNewCata && (
            <button
              onClick={onStartNewCata}
              className="px-5 py-2.5 bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] text-[#684500] font-bold text-xs rounded-xl shadow-md uppercase tracking-wider active:scale-95 transition-all"
            >
              Registrar Primera Cata
            </button>
          )}
        </div>
      )}

      {/* Inspect Badge Modal */}
      {inspectBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setInspectBadge(null)}
        >
          <div
            className="w-full max-w-md bg-[#1e2020] border border-[#fbad18]/30 rounded-3xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setInspectBadge(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#121414] text-[#a89680] hover:text-white flex items-center justify-center border border-white/10"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Header with big Chapa */}
            <div className="flex flex-col items-center text-center pt-2">
              <ChapaBottleCap insignia={inspectBadge} size={96} />
              <div className="mt-3">
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${getCategoryColor(inspectBadge.categoria)}25`,
                    color: getCategoryColor(inspectBadge.categoria),
                  }}
                >
                  Categoría: {BADGE_CATEGORIES.find((c) => c.id === inspectBadge.categoria)?.label}
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#ffd18f] mt-2">
                {inspectBadge.nombre}
              </h3>
              <p className="text-xs text-[#d7c4ad] max-w-xs mt-1 leading-relaxed">
                {inspectBadge.desc}
              </p>
            </div>

            {/* Progress Box */}
            <div className="bg-[#121414] rounded-2xl p-4 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#a89680]">Estado del Desafío</span>
                <span
                  className={`font-bold ${
                    inspectBadge.unlocked ? 'text-[#7ef24a]' : 'text-[#ffd18f]'
                  }`}
                >
                  {inspectBadge.unlocked ? '¡Completado y Desbloqueado! ✓' : 'En Progreso'}
                </span>
              </div>

              <div className="h-3 w-full bg-[#1e2020] rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(inspectBadge.progreso * 100)}%`,
                    backgroundColor: getCategoryColor(inspectBadge.categoria),
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-[#a89680] pt-1">
                <span>Progreso: {Math.round(inspectBadge.progreso * 100)}%</span>
                <span className="font-bold text-[#ffd18f]">
                  {inspectBadge.current} / {inspectBadge.target}
                </span>
              </div>
            </div>

            {/* Tips & Guidance */}
            <div className="bg-[#282a2b]/60 rounded-2xl p-3.5 border border-white/5 text-xs text-[#d7c4ad] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#fbad18] text-lg shrink-0 mt-0.5">
                lightbulb
              </span>
              <div>
                <strong className="text-[#ffd18f] block mb-0.5">Cómo conseguirla:</strong>
                {inspectBadge.unlocked
                  ? '¡Has cumplido el objetivo de esta chapa! Sigue catando para alcanzar el siguiente rango cervecero.'
                  : `Registra nuevas catas que cumplan con los requisitos de ${inspectBadge.nombre.toLowerCase()} para sumar puntos a tu diario.`}
              </div>
            </div>

            <button
              onClick={() => setInspectBadge(null)}
              className="w-full py-3 bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] text-[#684500] rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
