import React, { useState, useMemo } from 'react';
import { UserProfile, BeerTasting, ActiveTab } from '../types';
import { exportTastingsToCsv } from '../utils/exportCsv';
import { evaluarInsignias } from '../utils/badgeEngine';
import { ChapaBottleCap } from './ChapaBottleCap';

interface PerfilViewProps {
  profile: UserProfile;
  tastings?: BeerTasting[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onExportNotion?: () => void;
  onExportCsv?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  profile,
  tastings = [],
  onUpdateProfile,
  onExportNotion,
  onExportCsv,
  onNavigate,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editFavBrewery, setEditFavBrewery] = useState(profile.stats.favoriteBrewery);
  const [notionConnected, setNotionConnected] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      exportTastingsToCsv(tastings);
    }
    triggerToast(`¡Base de datos exportada! Descargando ${tastings.length} catas en formato .csv`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: editName,
      title: editTitle,
      bio: editBio,
      stats: {
        ...profile.stats,
        favoriteBrewery: editFavBrewery,
      },
    });
    setIsEditingModalOpen(false);
    triggerToast('¡Perfil actualizado con éxito!');
  };

  const handleNotionSync = () => {
    setNotionConnected(!notionConnected);
    if (onExportNotion) onExportNotion();
    triggerToast(
      !notionConnected
        ? '¡Sincronizado con Notion! TUS catas se han preparado para exportar.'
        : 'Desconectado de Notion.'
    );
  };

  const allBadges = useMemo(() => evaluarInsignias(tastings), [tastings]);
  const unlockedBadges = useMemo(() => allBadges.filter((b) => b.unlocked), [allBadges]);
  const lastUnlockedBadge = useMemo(() => {
    if (unlockedBadges.length === 0) return null;
    return unlockedBadges[unlockedBadges.length - 1];
  }, [unlockedBadges]);

  const effectiveTitle = lastUnlockedBadge
    ? lastUnlockedBadge.nombre
    : (profile.title || 'Iniciado Cervecero');

  const totalCatasCount = tastings.length > 0 ? tastings.length : profile.stats.totalCatas;
  const totalEstilosCount = useMemo(() => {
    if (tastings.length === 0) return profile.stats.totalEstilos;
    return new Set(tastings.map((t) => t.style?.toLowerCase().trim()).filter(Boolean)).size;
  }, [tastings, profile.stats.totalEstilos]);

  const handleOpenInsignias = () => {
    if (onNavigate) {
      onNavigate('insignias');
    } else {
      triggerToast(`Tienes ${unlockedBadges.length} de ${allBadges.length} insignias desbloqueadas.`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-28 max-w-lg mx-auto animate-fade-in">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#fbad18] text-[#684500] px-5 py-2.5 rounded-full font-bold text-xs shadow-xl z-50 animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          {showToast}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="relative overflow-hidden bg-[#1e2020] rounded-2xl p-5 shadow-md border border-white/5">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 text-[#fbad18]">
          <span className="material-symbols-outlined !text-[140px]">sports_bar</span>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#fbad18] to-[#ffd18f] shadow-lg">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="font-serif text-2xl font-bold text-[#e2e2e2] truncate">
              {profile.name}
            </h1>
            <div className="flex items-center gap-1.5 text-[#ffd18f] mt-1 flex-wrap">
              {lastUnlockedBadge ? (
                <span className="text-base shrink-0 leading-none select-none">{lastUnlockedBadge.icono}</span>
              ) : (
                <span className="material-symbols-outlined text-base shrink-0">military_tech</span>
              )}
              <span className="text-xs font-bold tracking-wide text-[#ffd18f]">{effectiveTitle}</span>
              {lastUnlockedBadge && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/30 text-[#ffd18f] rounded font-medium">
                  Última insignia
                </span>
              )}
            </div>
            <p className="text-xs text-[#d7c4ad] mt-1 line-clamp-1">{profile.bio}</p>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#282a2b] p-4 rounded-2xl flex flex-col justify-between shadow-sm border border-white/5">
          <span className="material-symbols-outlined text-[#fbad18] text-3xl mb-2">menu_book</span>
          <div>
            <div className="text-[#d7c4ad] text-[11px] font-bold uppercase tracking-wider">
              Total Catas
            </div>
            <div className="font-serif text-2xl font-bold text-[#e2e2e2] mt-0.5">
              {totalCatasCount}
            </div>
          </div>
        </div>

        <div className="bg-[#282a2b] p-4 rounded-2xl flex flex-col justify-between shadow-sm border border-white/5">
          <span className="material-symbols-outlined text-[#7ef24a] text-3xl mb-2">category</span>
          <div>
            <div className="text-[#d7c4ad] text-[11px] font-bold uppercase tracking-wider">
              Estilos
            </div>
            <div className="font-serif text-2xl font-bold text-[#e2e2e2] mt-0.5">
              {totalEstilosCount}
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-gradient-to-r from-[#fbad18] to-[#ffd18f] text-[#684500] p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-85">
              Cervecería Favorita
            </span>
            <span className="font-serif text-2xl font-bold mt-0.5">{profile.stats.favoriteBrewery}</span>
          </div>
          <span className="material-symbols-outlined text-4xl opacity-50">factory</span>
        </div>
      </div>

      {/* Achievements / Insignias Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-[#e2e2e2]">Insignias de Cata</h2>
            <span className="px-2 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/30 text-[#ffd18f] text-[11px] font-mono font-bold rounded-md">
              {unlockedBadges.length} / {allBadges.length}
            </span>
          </div>
          <button
            onClick={handleOpenInsignias}
            className="text-xs font-bold text-[#ffd18f] hover:underline flex items-center gap-0.5"
          >
            <span>Ver todas</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
          {allBadges.slice(0, 10).map((badge) => (
            <div
              key={badge.id}
              onClick={handleOpenInsignias}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 cursor-pointer transition-transform active:scale-95 group"
            >
              <ChapaBottleCap insignia={badge} size={60} />
              <span className="text-[11px] font-medium text-center text-[#e2e2e2] leading-tight line-clamp-1 group-hover:text-[#ffd18f] transition-colors">
                {badge.nombre}
              </span>
              <span className="text-[9px] font-mono text-[#a89680]">
                {badge.unlocked ? 'Desbloqueada' : `${badge.current}/${badge.target}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Settings Section */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-bold text-[#d7c4ad] uppercase tracking-widest px-1">
          Configuración
        </h2>

        <div className="bg-[#1a1c1c] rounded-2xl overflow-hidden border border-white/5">
          {/* Editar Perfil */}
          <button
            onClick={() => setIsEditingModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#d7c4ad]">edit</span>
              <span className="text-sm font-medium text-[#e2e2e2]">Editar Perfil</span>
            </div>
            <span className="material-symbols-outlined text-[#d7c4ad] text-xl">chevron_right</span>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Exportar Base de Datos (.CSV) */}
          <button
            onClick={handleExportCsv}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">download</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors">
                  Exportar Base de Datos
                </span>
                <span className="text-[11px] text-[#9f8e79] truncate">
                  Descargar archivo .csv con todas las catas ({tastings.length} registradas)
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/40 text-[#ffd18f] text-[10px] font-mono font-bold rounded-md uppercase tracking-wider ml-2 shrink-0">
              .CSV
            </span>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Conectar Notion */}
          <button
            onClick={handleNotionSync}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4 fill-[#e2e2e2]" viewBox="0 0 24 24">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l10.551-.7c1.353-.093 1.493.046 1.167.98l-.28 1.026c-.187.607-.14 1.167.373 1.167.42 0 .933-.373 1.167-.887.233-.466.233-.886.233-1.4 0-1.633-1.074-2.333-3.08-2.24l-11.298.747c-1.353.093-2.007-.047-2.52.42-.513.467-.653.98-.653 2.1l-.046 13.16c0 1.213.606 1.82 1.82 1.82l13.066.047c1.353 0 1.867-.653 1.867-1.82v-9.333c0-1.213-.607-1.82-1.82-1.82H6.606l2.333 4.807 4.2-1.026c.747-.187 1.167.14 1.167.84a1.074 1.074 0 0 1-1.027 1.027l-5.46.746c-.747.094-1.26-.373-1.54-.98L4.459 4.208z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#e2e2e2]">
                {notionConnected ? 'Notion Conectado ✓' : 'Conectar Notion'}
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-xl ${
                notionConnected ? 'text-[#7ef24a]' : 'text-[#fbad18]'
              }`}
            >
              {notionConnected ? 'check_circle' : 'link'}
            </span>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Notificaciones */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#d7c4ad]">notifications</span>
              <span className="text-sm font-medium text-[#e2e2e2]">Notificaciones</span>
            </div>
            <button
              onClick={() => {
                setNotificationsEnabled(!notificationsEnabled);
                triggerToast(
                  !notificationsEnabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas'
                );
              }}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                notificationsEnabled ? 'bg-[#fbad18]' : 'bg-[#333535]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  notificationsEnabled
                    ? 'right-1 bg-[#684500]'
                    : 'left-1 bg-[#d7c4ad]'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Logout Button */}
      <button
        onClick={() => triggerToast('Sesión mantenida en almacenamiento local.')}
        className="w-full py-3.5 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-2 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Cerrar Sesión
      </button>

      {/* Edit Profile Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1e2020] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-white">Editar Perfil</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-[#d7c4ad]">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-sm text-[#e2e2e2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#d7c4ad]">Título Cervecero</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-sm text-[#e2e2e2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#d7c4ad]">Bio</label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-sm text-[#e2e2e2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#d7c4ad]">Cervecería Favorita</label>
                <input
                  type="text"
                  value={editFavBrewery}
                  onChange={(e) => setEditFavBrewery(e.target.value)}
                  className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-sm text-[#e2e2e2]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#fbad18] text-[#684500] rounded-xl font-bold text-xs uppercase"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-3 bg-[#282a2b] text-[#d7c4ad] rounded-xl font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
