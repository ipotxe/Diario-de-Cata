import React from 'react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#1e2020]/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center h-16 px-6 max-w-md mx-auto">
        {/* Mis Catas */}
        <button
          onClick={() => onNavigate('mis-catas')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'mis-catas'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'mis-catas' ? 'symbol-fill-1' : ''}`}>
            home
          </span>
          <span className="text-[11px] font-medium tracking-wide">Mis Catas</span>
        </button>

        {/* Guía Estilos */}
        <button
          onClick={() => onNavigate('estilos')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'estilos'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'estilos' ? 'symbol-fill-1' : ''}`}>
            sports_bar
          </span>
          <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">Guía Estilos</span>
        </button>

        {/* Nueva Cata Action Button */}
        <button
          onClick={() => onNavigate('nueva-cata')}
          className={`relative -top-4 w-14 h-14 bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] text-[#684500] rounded-full flex items-center justify-center shadow-lg shadow-[#fbad18]/30 active:scale-90 transition-transform ${
            activeTab === 'nueva-cata' ? 'ring-4 ring-[#fbad18]/40 scale-105' : ''
          }`}
          aria-label="Nueva Cata"
          title="Agregar Nueva Cata"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>

        {/* Insignias */}
        <button
          onClick={() => onNavigate('insignias')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'insignias'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'insignias' ? 'symbol-fill-1' : ''}`}>
            military_tech
          </span>
          <span className="text-[11px] font-medium tracking-wide">Insignias</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => onNavigate('perfil')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'perfil'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'perfil' ? 'symbol-fill-1' : ''}`}>
            person
          </span>
          <span className="text-[11px] font-medium tracking-wide">Perfil</span>
        </button>
      </div>
    </nav>
  );
};
