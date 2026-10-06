import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, BeerTasting } from '../types';
import { saveUserProfileToFirestore } from '../utils/firebase';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  tastings: BeerTasting[];
  onUpdateProfile: (updated: UserProfile) => void;
  onTastingsUpdated?: (tastings: BeerTasting[]) => void;
  onShowToast: (msg: string) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  tastings,
  onUpdateProfile,
  onShowToast,
}) => {
  const {
    user,
    loading: authLoading,
    signInWithGoogleAuth,
    signOutAuth,
    syncLocalToCloud,
    syncCloudToLocal,
    syncStatus,
    lastSyncTime,
  } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editFavBrewery, setEditFavBrewery] = useState(profile.stats.favoriteBrewery);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      const loggedUser = await signInWithGoogleAuth();
      if (loggedUser) {
        onShowToast(`¡Sesión iniciada como ${loggedUser.displayName || loggedUser.email}!`);
        // Update local profile with Google info if desired
        if (loggedUser.displayName) setEditName(loggedUser.displayName);
        onUpdateProfile({
          ...profile,
          name: loggedUser.displayName || profile.name,
          avatarUrl: loggedUser.photoURL || profile.avatarUrl,
        });
      }
    } catch (error: any) {
      console.error(error);
      onShowToast('Error al iniciar sesión con Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAuth();
      onShowToast('Has cerrado sesión en Firebase.');
    } catch (error) {
      onShowToast('Error al cerrar sesión.');
    }
  };

  const handleUploadLocalToCloud = async () => {
    if (!user) {
      onShowToast('Debes iniciar sesión con Google primero.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncLocalToCloud();
      if (res.success) {
        onShowToast(`✓ ¡${res.count} catas sincronizadas en Firestore con éxito!`);
      } else {
        onShowToast('Error al sincronizar catas con la nube.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCloudToLocal = async () => {
    if (!user) {
      onShowToast('Debes iniciar sesión con Google primero.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncCloudToLocal();
      if (res.success) {
        onShowToast(`✓ ¡${res.count} catas descargadas de Firestore a tu diario local!`);
        window.location.reload(); // Refresh to reload state from IndexedDB
      } else {
        onShowToast('Error al descargar catas de la nube.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const updated = {
      ...profile,
      name: editName,
      title: editTitle,
      bio: editBio,
      stats: {
        ...profile.stats,
        favoriteBrewery: editFavBrewery,
      },
    };
    onUpdateProfile(updated);

    if (user) {
      try {
        await saveUserProfileToFirestore(user, { bio: editBio, title: editTitle });
      } catch (err) {
        console.warn('Could not sync profile to firestore:', err);
      }
    }

    setIsSavingProfile(false);
    onShowToast('¡Perfil y preferencias actualizadas!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#1e2020] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-[#181a1a] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fbad18]/15 border border-[#fbad18]/30 flex items-center justify-center text-[#ffd18f]">
              <span className="material-symbols-outlined text-lg">cloud_sync</span>
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#e2e2e2]">Cuenta y Nube Firestore</h3>
              <p className="text-[10px] text-[#9f8e79]">Sincronización multi-dispositivo con Google Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9f8e79] hover:text-[#e2e2e2] rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* User Auth Card */}
          <div className="bg-[#141616] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#d7c4ad] uppercase tracking-wider">
                Estado de la Cuenta
              </span>
              {user ? (
                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONECTADO
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded-md">
                  MODO LOCAL
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL || profile.avatarUrl}
                    alt={user.displayName || 'Usuario'}
                    className="w-12 h-12 rounded-full border border-[#fbad18]/40 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#e2e2e2] truncate">
                      {user.displayName || 'Catador de Cerveza'}
                    </p>
                    <p className="text-xs text-[#9f8e79] truncate">{user.email}</p>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Google Auth Verificado
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#282a2b] hover:bg-[#343738] text-xs font-semibold text-[#e2e2e2] transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-sm text-[#ff6b6b]">logout</span>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-[#d7c4ad] leading-relaxed">
                  Inicia sesión con tu cuenta de Google para respaldar tus catas, notas y fotos en tiempo real en la nube sin ningún coste.
                </p>

                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Firestore Spark Free Plan Info Card */}
          <div className="bg-[#141616] p-4 rounded-xl border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ffd18f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#fbad18]">workspace_premium</span>
                Plan Spark de Firebase (100% Gratuito)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#d7c4ad]">
                0,00 € / mes
              </span>
            </div>

            <p className="text-[11px] text-[#9f8e79] leading-relaxed">
              Tu diario utiliza Cloud Firestore Enterprise en capa gratuita permanente con soporte offline mediante IndexedDB:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5">
                <span className="text-[#9f8e79] block text-[9px] uppercase">Almacenamiento NoSQL</span>
                <span className="font-bold text-[#e2e2e2] font-mono">1.000 MB (1 GB)</span>
              </div>
              <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5">
                <span className="text-[#9f8e79] block text-[9px] uppercase">Escrituras Diarias</span>
                <span className="font-bold text-emerald-400 font-mono">20.000 / día</span>
              </div>
              <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5">
                <span className="text-[#9f8e79] block text-[9px] uppercase">Lecturas Diarias</span>
                <span className="font-bold text-[#ffd18f] font-mono">50.000 / día</span>
              </div>
              <div className="bg-[#1e2020] p-2.5 rounded-lg border border-white/5">
                <span className="text-[#9f8e79] block text-[9px] uppercase">Usuarios Activos</span>
                <span className="font-bold text-[#e2e2e2] font-mono">50.000 / mes</span>
              </div>
            </div>
          </div>

          {/* Cloud Sync Manager */}
          {user && (
            <div className="bg-[#141616] p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#d7c4ad] uppercase tracking-wider">
                  Sincronización de Catas
                </span>
                {lastSyncTime && (
                  <span className="text-[10px] text-[#9f8e79]">
                    Última sinc: {lastSyncTime}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleUploadLocalToCloud}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-3 bg-[#fbad18] hover:bg-[#ffbe43] text-[#121414] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isSyncing ? 'hourglass_top' : 'cloud_upload'}
                  </span>
                  <span>
                    {isSyncing ? 'Sincronizando...' : `Subir mis ${tastings.length} catas locales a Firestore`}
                  </span>
                </button>

                <button
                  onClick={handleDownloadCloudToLocal}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-3 bg-[#1e2020] hover:bg-[#282a2b] text-[#ffd18f] border border-[#fbad18]/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">cloud_download</span>
                  <span>Descargar catas de la nube a este dispositivo</span>
                </button>
              </div>

              <p className="text-[10px] text-[#9f8e79] leading-tight">
                * Las nuevas catas que registres mientras tengas sesión iniciada se guardarán automáticamente en Firestore y en tu IndexedDB local.
              </p>
            </div>
          )}

          {/* Profile Details Edit Form */}
          <form onSubmit={handleSaveProfileChanges} className="bg-[#141616] p-4 rounded-xl border border-white/5 space-y-3">
            <span className="text-xs font-bold text-[#d7c4ad] uppercase tracking-wider block">
              Editar Datos del Catador
            </span>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9f8e79] font-medium">Nombre de usuario</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                required
                className="w-full px-3 py-2 bg-[#1e2020] border border-white/10 rounded-lg text-xs text-[#e2e2e2] focus:outline-none focus:border-[#fbad18]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9f8e79] font-medium">Título o Rango de Catador</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={80}
                placeholder="Ej. Juez BJCP, Maestro Cervecero..."
                className="w-full px-3 py-2 bg-[#1e2020] border border-white/10 rounded-lg text-xs text-[#e2e2e2] focus:outline-none focus:border-[#fbad18]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9f8e79] font-medium">Biografía o Filosofía Cervecera</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={240}
                rows={2}
                className="w-full px-3 py-2 bg-[#1e2020] border border-white/10 rounded-lg text-xs text-[#e2e2e2] focus:outline-none focus:border-[#fbad18] resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9f8e79] font-medium">Cervecería Favorita</label>
              <input
                type="text"
                value={editFavBrewery}
                onChange={(e) => setEditFavBrewery(e.target.value)}
                maxLength={80}
                placeholder="Ej. Cantillon, Sierra Nevada, Basqueland..."
                className="w-full px-3 py-2 bg-[#1e2020] border border-white/10 rounded-lg text-xs text-[#e2e2e2] focus:outline-none focus:border-[#fbad18]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2 px-4 bg-[#282a2b] hover:bg-[#343738] text-[#ffd18f] border border-[#fbad18]/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{isSavingProfile ? 'Guardando...' : 'Guardar Datos del Catador'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#181a1a] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#282a2b] hover:bg-[#343738] text-xs font-semibold text-[#e2e2e2] rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
