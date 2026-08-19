import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { LOGO_URL } from '../data/initialData';

interface HeaderProps {
  activeTab: ActiveTab;
  userProfile: UserProfile;
  onNavigate: (tab: ActiveTab) => void;
  titleOverride?: string;
  onBack?: () => void;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  userProfile,
  onNavigate,
  titleOverride,
  onBack,
  isOffline = false,
}) => {
  const getTitle = () => {
    if (titleOverride) return titleOverride;
    switch (activeTab) {
      case 'mis-catas':
        return 'Mis Catas';
      case 'estilos':
        return 'Estilos';
      case 'nueva-cata':
        return 'Nueva Cata';
      case 'perfil':
        return 'Perfil';
      default:
        return 'Diario del Cervecero';
    }
  };

  const isFormView = activeTab === 'nueva-cata' || Boolean(onBack);

  return (
    <header className="fixed top-0 w-full z-40 bg-[#121414]/85 backdrop-blur-xl border-b border-white/5 pt-safe">
      <div className="h-16 flex items-center justify-between px-5">
        {isFormView ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack || (() => onNavigate('mis-catas'))}
              className="w-10 h-10 flex items-center justify-center text-[#d7c4ad] hover:text-[#ffd18f] active:scale-95 transition-all"
              aria-label="Volver"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
            <h1 className="font-serif text-2xl font-semibold text-[#ffd18f] truncate">
              {getTitle()}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Diario del Cervecero Logo"
              className="h-8 w-auto object-contain cursor-pointer"
              onClick={() => onNavigate('mis-catas')}
            />
            <h1 className="font-serif text-2xl font-semibold text-[#ffd18f]">
              {getTitle()}
            </h1>
            {isOffline && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fbad18]/20 border border-[#fbad18]/40 text-[#ffd18f] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">cloud_off</span>
                Offline
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {isOffline && (
            <span className="inline-flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-full bg-[#fbad18]/20 border border-[#fbad18]/40 text-[#ffd18f] text-[10px] font-bold">
              <span className="material-symbols-outlined text-xs">cloud_off</span>
            </span>
          )}

          <button
            onClick={() => onNavigate('perfil')}
            className="relative group focus:outline-none"
            title="Ver Perfil"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className={`w-9 h-9 rounded-full object-cover ring-2 transition-all ${
                activeTab === 'perfil'
                  ? 'ring-[#fbad18]'
                  : 'ring-white/20 group-hover:ring-[#fbad18]/60'
              }`}
            />
            {userProfile.isPro && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#7ef24a] border-2 border-[#121414] rounded-full" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
