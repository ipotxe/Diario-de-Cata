import React from 'react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#1e2020]/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="grid grid-cols-5 items-center justify-items-center h-16 py-1 px-3 sm:px-6 max-w-md mx-auto text-center">
        {/* 1. Mis Catas */}
        <button
          onClick={() => onNavigate('mis-catas')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full transition-all ${
            activeTab === 'mis-catas'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
          title="Mis Catas"
        >
          <span className={`material-symbols-outlined text-2xl shrink-0 ${activeTab === 'mis-catas' ? 'symbol-fill-1' : ''}`}>
            home
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight sm:tracking-normal text-center leading-[1.1] max-w-[58px] break-words line-clamp-2">
            Mis Catas
          </span>
        </button>

        {/* 2. Guía Estilos */}
        <button
          onClick={() => onNavigate('estilos')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full transition-all ${
            activeTab === 'estilos'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
          title="Guía de Estilos BJCP"
        >
          <span className={`material-symbols-outlined text-2xl shrink-0 ${activeTab === 'estilos' ? 'symbol-fill-1' : ''}`}>
            sports_bar
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight sm:tracking-normal text-center leading-[1.1] max-w-[58px] break-words line-clamp-2">
            Guía Estilos
          </span>
        </button>

        {/* 3. Añadir Cata (Centrado) */}
        <button
          onClick={() => onNavigate('nueva-cata')}
          className={`relative -top-4 w-14 h-14 bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] text-[#684500] rounded-full flex items-center justify-center shadow-lg shadow-[#fbad18]/30 active:scale-90 transition-transform shrink-0 ${
            activeTab === 'nueva-cata' ? 'ring-4 ring-[#fbad18]/40 scale-105' : ''
          }`}
          aria-label="Añadir Cata"
          title="Añadir Cata"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>

        {/* 4. Insignias */}
        <button
          onClick={() => onNavigate('insignias')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full transition-all ${
            activeTab === 'insignias'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
          title="Insignias"
        >
          <span className={`material-symbols-outlined text-2xl shrink-0 ${activeTab === 'insignias' ? 'symbol-fill-1' : ''}`}>
            military_tech
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight sm:tracking-normal text-center leading-[1.1] max-w-[58px] break-words line-clamp-2">
            Insignias
          </span>
        </button>

        {/* 5. Ajustes */}
        <button
          onClick={() => onNavigate('perfil')}
          className={`flex flex-col items-center justify-center gap-0.5 w-full transition-all ${
            activeTab === 'perfil' || activeTab === 'importar-bd'
              ? 'text-[#fbad18] font-bold scale-105'
              : 'text-[#d7c4ad] hover:text-[#ffd18f]'
          }`}
          title="Ajustes"
        >
          <span className={`material-symbols-outlined text-2xl shrink-0 ${activeTab === 'perfil' || activeTab === 'importar-bd' ? 'symbol-fill-1' : ''}`}>
            settings
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight sm:tracking-normal text-center leading-[1.1] max-w-[58px] break-words line-clamp-2">
            Ajustes
          </span>
        </button>
      </div>
    </nav>
  );
};
