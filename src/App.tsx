import React, { useState, useEffect } from 'react';
import { BeerTasting, UserProfile, ActiveTab } from './types';
import {
  INITIAL_TASTINGS,
  INITIAL_USER_PROFILE,
} from './data/initialData';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MisCatasView } from './components/MisCatasView';
import { NuevaCataView } from './components/NuevaCataView';
import { EstilosView } from './components/EstilosView';
import { InsigniasView } from './components/InsigniasView';
import { PerfilView } from './components/PerfilView';
import { DetailModal } from './components/DetailModal';
import { WalkthroughModal } from './components/WalkthroughModal';
import { evaluarInsignias } from './utils/badgeEngine';
import {
  initializeAndMigrateDatabase,
  saveTastingToDB,
  deleteTastingFromDB,
  saveProfileToDB,
} from './utils/db';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mis-catas');

  // Local storage initial state as immediate synchronous buffer
  const [tastings, setTastings] = useState<BeerTasting[]>(() => {
    try {
      const saved = localStorage.getItem('diario_cervecero_catas');
      return saved ? JSON.parse(saved) : INITIAL_TASTINGS;
    } catch {
      return INITIAL_TASTINGS;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('diario_cervecero_profile');
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  // Modal / Editing state
  const [selectedBeer, setSelectedBeer] = useState<BeerTasting | null>(null);
  const [editingBeer, setEditingBeer] = useState<BeerTasting | null>(null);
  const [prefilledStyle, setPrefilledStyle] = useState<string | null>(null);

  // First-Time Walkthrough Tutorial State
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('diario_cervecero_walkthrough_completed') === null;
    } catch {
      return false;
    }
  });

  // Offline / Online Status Management
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Initialize IndexedDB and migrate any previous LocalStorage data
  useEffect(() => {
    let isMounted = true;
    initializeAndMigrateDatabase(INITIAL_TASTINGS, INITIAL_USER_PROFILE)
      .then(({ tastings: dbTastings, profile: dbProfile, migratedFromLocalStorage }) => {
        if (isMounted) {
          setTastings(dbTastings);
          setUserProfile(dbProfile);
          if (migratedFromLocalStorage) {
            setToastMessage('✓ Catas y fotos migradas a IndexedDB con éxito');
            setShowStatusToast(true);
            setTimeout(() => setShowStatusToast(false), 4000);
          }
        }
      })
      .catch((err) => {
        console.error('Error inicializando base de datos IndexedDB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setToastMessage('✓ Conexión a internet restablecida');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setToastMessage('⚡ Modo sin conexión activo: Catas y Guía de Estilos disponibles offline');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 4500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile to IndexedDB and LocalStorage & auto update count stats and title from badges
  useEffect(() => {
    const uniqueStylesCount = new Set(tastings.map((t) => t.style)).size;
    const currentBadges = evaluarInsignias(tastings);
    const unlocked = currentBadges.filter((b) => b.unlocked);
    const latestBadge = unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;

    const updated = {
      ...userProfile,
      title: latestBadge ? latestBadge.nombre : userProfile.title,
      stats: {
        ...userProfile.stats,
        totalCatas: tastings.length,
        totalEstilos: uniqueStylesCount || 1,
      },
    };

    // Asynchronously save to IndexedDB
    saveProfileToDB(updated).catch((e) => console.error('IndexedDB profile save error:', e));

    try {
      localStorage.setItem('diario_cervecero_profile', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  }, [tastings]);

  // Save or Update a Cata
  const handleSaveCata = (cata: BeerTasting) => {
    const prevBadges = evaluarInsignias(tastings);
    const prevUnlockedIds = new Set(prevBadges.filter((b) => b.unlocked).map((b) => b.id));

    let updatedTastings: BeerTasting[];
    if (editingBeer) {
      updatedTastings = tastings.map((item) => (item.id === cata.id ? cata : item));
      setEditingBeer(null);
    } else {
      updatedTastings = [cata, ...tastings];
    }
    setTastings(updatedTastings);

    // Save directly to IndexedDB (virtually unlimited quota for high-res photos)
    saveTastingToDB(cata).catch((e) => console.error('IndexedDB save error:', e));

    // Fallback sync to localStorage (caught if storage quota exceeded)
    try {
      localStorage.setItem('diario_cervecero_catas', JSON.stringify(updatedTastings));
    } catch {
      // IndexedDB has already persisted the full high-res data safely
    }

    // Check if new badges were unlocked!
    const nextBadges = evaluarInsignias(updatedTastings);
    const newlyUnlocked = nextBadges.filter((b) => b.unlocked && !prevUnlockedIds.has(b.id));

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map((b) => `${b.icono} ${b.nombre}`).join(', ');
      setToastMessage(`🎉 ¡Nueva Insignia Desbloqueada: ${names}!`);
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 5000);
    }

    setActiveTab('mis-catas');
  };

  // Delete a Cata
  const handleDeleteCata = (id: string) => {
    setTastings((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('diario_cervecero_catas', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Remove from IndexedDB
    deleteTastingFromDB(id).catch((e) => console.error('IndexedDB delete error:', e));

    if (selectedBeer?.id === id) {
      setSelectedBeer(null);
    }
  };

  // Edit action triggered from detail modal
  const handleEditCata = (beer: BeerTasting) => {
    setEditingBeer(beer);
    setSelectedBeer(null);
    setActiveTab('nueva-cata');
  };

  // Start new cata prefilled with a specific style from Estilos view
  const handleStartNewCataWithStyle = (styleName: string) => {
    setPrefilledStyle(styleName);
    setEditingBeer(null);
    setActiveTab('nueva-cata');
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e2e2e2] flex flex-col font-sans selection:bg-[#fbad18] selection:text-[#121414]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        userProfile={userProfile}
        onNavigate={setActiveTab}
        isOffline={isOffline}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onBack={
          activeTab === 'nueva-cata'
            ? () => {
                setEditingBeer(null);
                setActiveTab('mis-catas');
              }
            : undefined
        }
      />

      {/* Online / Offline Status Toast */}
      {showStatusToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 border animate-fade-in transition-all bg-[#1e2020]/95 text-[#ffd18f] border-[#fbad18]/40">
          <span className="material-symbols-outlined text-base">
            {isOffline ? 'cloud_off' : 'cloud_done'}
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Offline Banner below header when offline */}
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-[#282a2b]/95 backdrop-blur-md border-b border-[#fbad18]/30 px-4 py-1.5 text-center text-[11px] text-[#ffd18f] flex items-center justify-center gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-sm text-[#fbad18]">wifi_off</span>
          <span>Modo offline activo: Catas y Guía de Estilos disponibles sin conexión.</span>
        </div>
      )}

      {/* Main View Container */}
      <main className={`flex-1 w-full px-5 max-w-lg mx-auto ${isOffline ? 'pt-26' : 'pt-20'}`}>
        {activeTab === 'mis-catas' && (
          <MisCatasView
            tastings={tastings}
            onSelectBeer={setSelectedBeer}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'nueva-cata' && (
          <NuevaCataView
            onSave={handleSaveCata}
            onCancel={() => {
              setEditingBeer(null);
              setActiveTab('mis-catas');
            }}
            editingCata={
              editingBeer ||
              (prefilledStyle
                ? ({
                    id: '',
                    name: '',
                    brewery: '',
                    abv: 6.5,
                    style: prefilledStyle,
                    ibu: 40,
                    ebc: 12,
                    srm: 4,
                    clarity: 'Brillante',
                    foamType: 'Persistente',
                    carbonation: 'Media',
                    radarValues: { hop: 4, malt: 2, bitterness: 3, sweetness: 2 },
                    aromaDescriptors: ['Amargo'],
                    otherDescriptors: ['Cítrico'],
                    rating: 4,
                    notes: '',
                    pairing: '',
                    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC_9PJePcFLLcmRE6sUfky3cjo9U1uS6kSCsEq92ZLKF91Wi_6oV82C_vygjZ-Pl9n7lHja7CgD1rPvD_Jrzo9wOxw76iCEMsjFSKcxPTEtgTTNMW4q91IXep0-l9WM_oLiFwKsvxTEoYY6egS5Wq27u459SEjfmVutKeDlkWamGBR5k73CPM1ehNquhO09SdS8l6nfcWCXcUyGfEM4CcbXlxc8QxOTAm4XkwiOkBuSh0fPiE8uOCB4A',
                    createdAt: new Date().toISOString().split('T')[0],
                  } as BeerTasting)
                : null)
            }
          />
        )}

        {activeTab === 'estilos' && (
          <EstilosView onStartNewCataWithStyle={handleStartNewCataWithStyle} />
        )}

        {activeTab === 'insignias' && (
          <InsigniasView
            tastings={tastings}
            onStartNewCata={() => {
              setEditingBeer(null);
              setActiveTab('nueva-cata');
            }}
          />
        )}

        {activeTab === 'perfil' && (
          <PerfilView
            profile={userProfile}
            tastings={tastings}
            onUpdateProfile={setUserProfile}
            onNavigate={setActiveTab}
            onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
            onExportNotion={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tastings, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `catas_diario_cervecero_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedBeer && (
        <DetailModal
          beer={selectedBeer}
          onClose={() => setSelectedBeer(null)}
          onEdit={handleEditCata}
          onDelete={handleDeleteCata}
        />
      )}

      {/* Interactive Walkthrough Tutorial for First-Time Users */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onStartFirstCata={() => {
          setEditingBeer(null);
          setPrefilledStyle(null);
          setActiveTab('nueva-cata');
        }}
      />

      {/* Bottom Navigation Bar */}
      <Navigation activeTab={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
