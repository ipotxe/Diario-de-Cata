import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, BeerTasting, ActiveTab } from '../types';
import { exportTastingsToCsv } from '../utils/exportCsv';
import { evaluarInsignias } from '../utils/badgeEngine';
import { getStorageUsage, isIndexedDBAvailable, clearAllTastingsFromDB } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { ImportDatabaseModal } from './ImportDatabaseModal';
import { UserAccountModal } from './UserAccountModal';

interface PerfilViewProps {
  profile: UserProfile;
  tastings?: BeerTasting[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onExportBackupJson?: () => void;
  onExportCsv?: () => void;
  onImportTastings?: (tastings: BeerTasting[], mode: 'merge' | 'replace') => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenWalkthrough?: () => void;
  onClearAllData?: () => Promise<{ localCount: number; cloudCount: number }>;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  profile,
  tastings = [],
  onUpdateProfile,
  onExportBackupJson,
  onExportCsv,
  onImportTastings,
  onNavigate,
  onOpenWalkthrough,
  onClearAllData,
}) => {
  const { user } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDbModalOpen, setIsDeleteDbModalOpen] = useState(false);
  const [isDeletingDb, setIsDeletingDb] = useState(false);
  const [hasAcceptedDeleteWarning, setHasAcceptedDeleteWarning] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    quotaMB: number;
    usageMB: number;
    percentUsed: number;
    tastingCount: number;
    isIndexedDBSupported: boolean;
  } | null>(null);

  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editFavBrewery, setEditFavBrewery] = useState(profile.stats.favoriteBrewery);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    getStorageUsage().then(setStorageInfo).catch(console.error);
  }, [tastings]);

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

  const handleImportComplete = (importedTastings: BeerTasting[], mode: 'merge' | 'replace') => {
    if (onImportTastings) {
      onImportTastings(importedTastings, mode);
    }
    triggerToast(
      mode === 'replace'
        ? `¡Base de datos reemplazada con éxito (${importedTastings.length} catas)!`
        : `¡${importedTastings.length} nuevas catas añadidas a tu diario!`
    );
  };

  const handleConfirmDeleteDatabases = async () => {
    if (!hasAcceptedDeleteWarning) return;
    setIsDeletingDb(true);
    try {
      if (onClearAllData) {
        await onClearAllData();
      } else {
        await clearAllTastingsFromDB();
        try {
          localStorage.removeItem('diario_cervecero_catas');
        } catch {}
      }
      setIsDeleteDbModalOpen(false);
      triggerToast('✓ Todas las bases de datos (local y nube) han sido eliminadas.');
    } catch (err: any) {
      console.error('Error al eliminar bases de datos:', err);
      triggerToast('Error al eliminar las bases de datos.');
    } finally {
      setIsDeletingDb(false);
      setHasAcceptedDeleteWarning(false);
    }
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

      {/* Cloud & User Account Banner */}
      <div
        onClick={() => setIsAccountModalOpen(true)}
        className="bg-gradient-to-r from-[#1e2020] to-[#252828] p-4 rounded-2xl border border-white/10 hover:border-[#fbad18]/50 transition-all cursor-pointer shadow-md flex items-center justify-between group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
            <span className="material-symbols-outlined text-xl">cloud_sync</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors truncate">
                {user ? 'Cuenta Cloud Activa' : 'Cuenta de Usuario y Nube'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#fbad18]/15 border border-[#fbad18]/30 text-[#ffd18f] shrink-0">
                SPARK GRATIS
              </span>
            </div>
            <span className="text-[11px] text-[#9f8e79] truncate mt-0.5">
              {user ? `${user.email} • Firestore Sincronizado` : 'Conectar con Google para respaldo en la nube'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {user ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#ffd18f] group-hover:underline">Conectar</span>
          )}
          <span className="material-symbols-outlined text-[#9f8e79] group-hover:text-[#ffd18f] text-lg">
            chevron_right
          </span>
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

      {/* Settings Section */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-bold text-[#d7c4ad] uppercase tracking-widest px-1">
          Configuración
        </h2>

        <div className="bg-[#1a1c1c] rounded-2xl overflow-hidden border border-white/5">
          {/* Cuenta y Nube (Firestore) */}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">manage_accounts</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors">
                  Cuenta y Nube (Firestore)
                </span>
                <span className="text-[11px] text-[#9f8e79] truncate">
                  {user ? `${user.email} • Plan Spark Gratuito` : 'Iniciar sesión con Google para sincronización'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider border ${
                  user
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-[#fbad18]/15 border-[#fbad18]/40 text-[#ffd18f]'
                }`}
              >
                {user ? 'CONECTADO' : 'CONECTAR'}
              </span>
              <span className="material-symbols-outlined text-[#d7c4ad] text-xl">chevron_right</span>
            </div>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Tutorial Interactivo de Cata */}
          {onOpenWalkthrough && (
            <>
              <button
                onClick={onOpenWalkthrough}
                className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
                    <span className="material-symbols-outlined text-lg">school</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors">
                      Tutorial de Inicio
                    </span>
                    <span className="text-[11px] text-[#9f8e79] truncate">
                      Guía paso a paso interactiva para registrar catas
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#d7c4ad] text-xl">chevron_right</span>
              </button>
              <div className="mx-4 h-[1px] bg-white/5" />
            </>
          )}

          {/* Editar Perfil */}
          <button
            onClick={() => setIsEditingModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#d7c4ad]">edit</span>
              <span className="text-sm font-medium text-[#e2e2e2]">Editar Perfil</span>
            </div>
            <span className="material-symbols-outlined text-[#d7c4ad] text-xl">chevron_right</span>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Base de Datos Local (IndexedDB) */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">database</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors">
                  Base de Datos Local
                </span>
                <span className="text-[11px] text-[#9f8e79] truncate">
                  IndexedDB Activo • Capacidad ilimitada para fotos y catas
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/40 text-[#ffd18f] text-[10px] font-mono font-bold rounded-md uppercase tracking-wider ml-2 shrink-0">
              INDEXEDDB
            </span>
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

          {/* Importar Base de Datos */}
          <button
            onClick={() => {
              if (onNavigate) onNavigate('importar-bd');
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-[#282a2b] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f] group-hover:bg-[#fbad18] group-hover:text-[#121414] transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">upload</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#e2e2e2] group-hover:text-[#ffd18f] transition-colors">
                  Importar Base de Datos
                </span>
                <span className="text-[11px] text-[#9f8e79] truncate">
                  Importar archivo .csv o .json (Notion, Untappd, Excel)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="px-2 py-0.5 bg-[#fbad18]/15 border border-[#fbad18]/40 text-[#ffd18f] text-[10px] font-mono font-bold rounded-md uppercase tracking-wider">
                .CSV / .JSON
              </span>
              <span className="material-symbols-outlined text-base text-[#9f8e79] group-hover:text-[#ffd18f] transition-colors">
                chevron_right
              </span>
            </div>
          </button>

          <div className="mx-4 h-[1px] bg-white/5" />

          {/* Eliminar Bases de Datos */}
          <button
            type="button"
            onClick={() => {
              setHasAcceptedDeleteWarning(false);
              setIsDeleteDbModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">delete_forever</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-red-300 group-hover:text-red-200 transition-colors">
                  Eliminar Bases de Datos
                </span>
                <span className="text-[11px] text-[#9f8e79] truncate">
                  Borrar catas en local (IndexedDB) y en la nube (Firestore)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider">
                LOCAL + NUBE
              </span>
              <span className="material-symbols-outlined text-red-400/70 text-xl group-hover:text-red-400 transition-colors">
                chevron_right
              </span>
            </div>
          </button>
        </div>
      </section>

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

      {/* IndexedDB Database Status Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1e2020] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-[#ffd18f]">
                <div className="w-9 h-9 rounded-xl bg-[#7ef24a]/15 border border-[#7ef24a]/30 flex items-center justify-center text-[#7ef24a]">
                  <span className="material-symbols-outlined text-xl">database</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Base de Datos Local</h3>
                  <p className="text-[11px] text-[#9f8e79]">Motor IndexedDB del navegador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#d7c4ad] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 py-1">
              <div className="bg-[#121414] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9f8e79]">Estado del Motor:</span>
                  <span className="text-[#7ef24a] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#7ef24a] animate-pulse" />
                    Activo y Persistente
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9f8e79]">Base de Datos:</span>
                  <span className="font-mono text-[#ffd18f] font-semibold">BeerTastingJournalDB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9f8e79]">Catas Almacenadas:</span>
                  <span className="font-mono text-[#e2e2e2] font-bold">{tastings.length} registradas</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9f8e79]">Compresión de Fotos:</span>
                  <span className="text-emerald-400 font-semibold font-mono">~90-150 KB / foto (Auto)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9f8e79]">Capacidad para Fotografías:</span>
                  <span className="text-[#ffd18f] font-semibold">Ilimitada (IndexedDB)</span>
                </div>
                {storageInfo && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-[#9f8e79]">Espacio Actual Utilizado:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {storageInfo.usageMB > 0 ? `${storageInfo.usageMB} MB` : '< 1 MB'}
                    </span>
                  </div>
                )}
                {storageInfo && storageInfo.quotaMB > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9f8e79]">Cuota Estimada del Dispositivo:</span>
                    <span className="font-mono text-[#9f8e79]">~{storageInfo.quotaMB} MB disponibles</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#fbad18]/10 border border-[#fbad18]/20 rounded-xl text-xs text-[#ffd18f] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-[#fbad18] shrink-0 mt-0.5">verified_user</span>
                <p className="leading-relaxed">
                  Tus notas y fotografías se comprimen al vuelo a 1000px y se almacenan en <strong>IndexedDB</strong> (~90-150 KB por foto en lugar de 5-10 MB), garantizando miles de catas 100% offline sin saturar la memoria.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDbModalOpen(false);
                  if (onNavigate) onNavigate('importar-bd');
                }}
                className="w-full py-3 px-3 bg-[#fbad18]/20 hover:bg-[#fbad18]/30 border border-[#fbad18]/40 text-[#ffd18f] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">upload</span>
                Importar Base de Datos (.CSV / .JSON)
              </button>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onExportBackupJson) onExportBackupJson();
                    triggerToast('¡Copia de seguridad en JSON descargada!');
                  }}
                  className="flex-1 py-3 px-3 bg-[#282a2b] hover:bg-[#333535] text-[#ffd18f] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">file_download</span>
                  Backup JSON
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex-1 py-3 px-3 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">table_view</span>
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Base de Datos */}
      <ImportDatabaseModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        existingCount={tastings.length}
      />

      {/* Modal de Cuenta de Usuario y Nube Firestore */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        profile={profile}
        tastings={tastings}
        onUpdateProfile={onUpdateProfile}
        onShowToast={triggerToast}
      />

      {/* Modal: Eliminar Bases de Datos (Confirmación & Recordatorio) */}
      {isDeleteDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1e2020] border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <span className="material-symbols-outlined text-xl">delete_forever</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Eliminar Bases de Datos</h3>
                  <p className="text-[11px] text-[#9f8e79]">Borrado irreversible local y en la nube</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingDb && setIsDeleteDbModalOpen(false)}
                disabled={isDeletingDb}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#d7c4ad] flex items-center justify-center disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* RECORDATORIO IMPORTANTE */}
            <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl space-y-2 text-red-200">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300 tracking-wide uppercase">
                <span className="material-symbols-outlined text-base text-red-400 animate-pulse">warning</span>
                <span>Recordatorio Importante</span>
              </div>
              <p className="text-xs leading-relaxed text-red-200/95">
                Estás a punto de eliminar <strong>definitivamente todos los datos</strong> de tu diario cervecero. Esta operación es <strong>permanente y no se puede deshacer</strong>.
              </p>
            </div>

            {/* Desglose de lo que se va a borrar */}
            <div className="bg-[#121414] p-3.5 rounded-xl border border-white/5 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-[#e2e2e2]">
                <span className="material-symbols-outlined text-[#ffd18f] text-base shrink-0 mt-0.5">database</span>
                <div>
                  <span className="font-semibold block text-[#ffd18f]">Base de Datos Local (IndexedDB)</span>
                  <span className="text-[11px] text-[#9f8e79]">
                    Se vaciarán todas las <strong>{tastings.length} catas</strong>, notas de degustación y fotografías guardadas en este dispositivo.
                  </span>
                </div>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="flex items-start gap-2.5 text-[#e2e2e2]">
                <span className="material-symbols-outlined text-sky-400 text-base shrink-0 mt-0.5">cloud</span>
                <div>
                  <span className="font-semibold block text-sky-300">Base de Datos en la Nube (Firestore)</span>
                  <span className="text-[11px] text-[#9f8e79]">
                    {user ? (
                      <>Se eliminarán permanentemente todas las catas sincronizadas en tu cuenta <strong>{user.email}</strong>.</>
                    ) : (
                      <>No hay sesión activa de Google en la nube. Se limpiará el almacenamiento local del dispositivo.</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox de confirmación expresa */}
            <label className="flex items-start gap-2.5 p-2.5 bg-[#121414] rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
              <input
                type="checkbox"
                checked={hasAcceptedDeleteWarning}
                onChange={(e) => setHasAcceptedDeleteWarning(e.target.checked)}
                disabled={isDeletingDb}
                className="mt-0.5 rounded border-white/20 text-red-500 focus:ring-red-400 focus:ring-offset-0 bg-[#1e2020] cursor-pointer"
              />
              <span className="text-xs text-[#d7c4ad] select-none leading-snug">
                He leído el recordatorio y confirmo que deseo <strong>eliminar todos los datos definitivamente</strong> sin posibilidad de recuperación.
              </span>
            </label>

            {/* Botones de Acción */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={!hasAcceptedDeleteWarning || isDeletingDb}
                onClick={handleConfirmDeleteDatabases}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {isDeletingDb ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                    <span>Eliminando bases de datos...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                    <span>Eliminar Definitivamente Todas las Bases de Datos</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isDeletingDb}
                onClick={() => setIsDeleteDbModalOpen(false)}
                className="w-full py-2.5 text-xs text-[#d7c4ad] hover:text-white font-medium transition-colors cursor-pointer"
              >
                Cancelar y conservar mis catas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
