import { BeerTasting, UserProfile } from '../types';

const DB_NAME = 'BeerTastingJournalDB';
const DB_VERSION = 1;
const STORE_TASTINGS = 'tastings';
const STORE_PROFILE = 'profile';

/**
 * Verifica si IndexedDB está disponible en el entorno actual (navegador / WebView).
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

let dbInstance: IDBDatabase | null = null;
let dbOpeningPromise: Promise<IDBDatabase> | null = null;

/**
 * Inicializa y abre la conexión a la base de datos IndexedDB.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB no está soportado en este entorno.'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbOpeningPromise) {
    return dbOpeningPromise;
  }

  dbOpeningPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Almacén de objetos para las catas (con capacidad ilimitada para fotos en alta resolución)
      if (!db.objectStoreNames.contains(STORE_TASTINGS)) {
        const tastingStore = db.createObjectStore(STORE_TASTINGS, { keyPath: 'id' });
        tastingStore.createIndex('createdAt', 'createdAt', { unique: false });
        tastingStore.createIndex('rating', 'rating', { unique: false });
        tastingStore.createIndex('style', 'style', { unique: false });
        tastingStore.createIndex('brewery', 'brewery', { unique: false });
        tastingStore.createIndex('abv', 'abv', { unique: false });
      }

      // 2. Almacén para el perfil de usuario y estadísticas
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;

      // Manejar cierre inesperado
      dbInstance.onclose = () => {
        dbInstance = null;
        dbOpeningPromise = null;
      };

      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbOpeningPromise = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      dbOpeningPromise = null;
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('[IndexedDB] Error al abrir la base de datos:', error);
      reject(error || new Error('No se pudo abrir IndexedDB'));
    };
  });

  return dbOpeningPromise;
}

/**
 * Obtiene todas las catas almacenadas en IndexedDB.
 */
export async function getAllTastingsFromDB(): Promise<BeerTasting[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TASTINGS], 'readonly');
      const store = transaction.objectStore(STORE_TASTINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as BeerTasting[]) || [];
        // Ordenar por fecha descendente
        results.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        resolve(results);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error al consultar todas las catas:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback a LocalStorage para leer catas:', err);
    try {
      const raw = localStorage.getItem('diario_cervecero_catas');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Guarda o actualiza una cata individual en IndexedDB.
 */
export async function saveTastingToDB(tasting: BeerTasting): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TASTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_TASTINGS);
      const request = store.put(tasting);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] Error al guardar la cata:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Fallo al guardar cata en IndexedDB:', err);
  }
}

/**
 * Guarda un lote completo de catas en una única transacción de IndexedDB.
 */
export async function saveAllTastingsToDB(tastings: BeerTasting[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TASTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_TASTINGS);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('[IndexedDB] Error al sincronizar catas:', transaction.error);
        reject(transaction.error);
      };

      tastings.forEach((t) => store.put(t));
    });
  } catch (err) {
    console.error('[IndexedDB] Fallo al sincronizar lote en IndexedDB:', err);
  }
}

/**
 * Vacía el almacén de catas en IndexedDB.
 */
export async function clearAllTastingsFromDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TASTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_TASTINGS);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] Error al vaciar almacén de catas:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Fallo al limpiar catas:', err);
  }
}

/**
 * Elimina una cata por su ID de IndexedDB.
 */
export async function deleteTastingFromDB(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TASTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_TASTINGS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] Error al eliminar cata:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Fallo al eliminar cata:', err);
  }
}

/**
 * Obtiene el perfil del usuario desde IndexedDB.
 */
export async function getProfileFromDB(): Promise<UserProfile | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROFILE], 'readonly');
      const store = transaction.objectStore(STORE_PROFILE);
      const request = store.get('current_user');

      request.onsuccess = () => {
        if (request.result && request.result.profile) {
          resolve(request.result.profile as UserProfile);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Guarda el perfil de usuario en IndexedDB.
 */
export async function saveProfileToDB(profile: UserProfile): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROFILE], 'readwrite');
      const store = transaction.objectStore(STORE_PROFILE);
      const request = store.put({ id: 'current_user', profile });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[IndexedDB] Fallo al guardar perfil:', err);
  }
}

/**
 * Información sobre cuota y almacenamiento del navegador (Storage API).
 */
export async function getStorageUsage(): Promise<{
  quotaMB: number;
  usageMB: number;
  percentUsed: number;
  tastingCount: number;
  isIndexedDBSupported: boolean;
}> {
  const isSupported = isIndexedDBAvailable();
  let tastingCount = 0;

  try {
    const list = await getAllTastingsFromDB();
    tastingCount = list.length;
  } catch {
    // Ignorar si falla
  }

  if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const quotaMB = Math.round(quota / (1024 * 1024));
      const usageMB = parseFloat((usage / (1024 * 1024)).toFixed(2));
      const percentUsed = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(2)) : 0;

      return {
        quotaMB,
        usageMB,
        percentUsed,
        tastingCount,
        isIndexedDBSupported: isSupported,
      };
    } catch {
      // Fallback
    }
  }

  return {
    quotaMB: 2048,
    usageMB: 1.2,
    percentUsed: 0.1,
    tastingCount,
    isIndexedDBSupported: isSupported,
  };
}

/**
 * Detecta si una cata corresponde a los ejemplos predeterminados de muestra.
 */
export const isDefaultSampleTasting = (t: BeerTasting): boolean => {
  if (!t) return false;
  const isIdMatch = t.id === '1' || t.id === '2' || t.id === '3';
  const isNameMatch =
    t.name === 'Nebula Haze IPA' ||
    t.name === 'Midnight Stout' ||
    t.name === 'Cactus Sour';
  const isBreweryMatch =
    t.brewery === 'Stellar Brewing Co.' ||
    t.brewery === 'Obsidian Labs' ||
    t.brewery === 'Prickly Pear Brewing';

  return (isIdMatch && isNameMatch) || (isNameMatch && isBreweryMatch);
};

/**
 * Inicializa la base de datos y migra los datos preexistentes desde LocalStorage
 * sin pérdida de información para el usuario, eliminando los ejemplos predeterminados.
 */
export async function initializeAndMigrateDatabase(
  initialTastings: BeerTasting[],
  initialProfile: UserProfile
): Promise<{ tastings: BeerTasting[]; profile: UserProfile; migratedFromLocalStorage: boolean }> {
  if (!isIndexedDBAvailable()) {
    console.warn('[IndexedDB] No disponible, usando LocalStorage');
    try {
      const savedTastings = localStorage.getItem('diario_cervecero_catas');
      const savedProfile = localStorage.getItem('diario_cervecero_profile');
      let cleanedTastings: BeerTasting[] = initialTastings;
      if (savedTastings) {
        const parsed = JSON.parse(savedTastings);
        if (Array.isArray(parsed)) {
          cleanedTastings = parsed.filter((t) => !isDefaultSampleTasting(t));
          localStorage.setItem('diario_cervecero_catas', JSON.stringify(cleanedTastings));
        }
      }
      return {
        tastings: cleanedTastings,
        profile: savedProfile ? JSON.parse(savedProfile) : initialProfile,
        migratedFromLocalStorage: false,
      };
    } catch {
      return {
        tastings: initialTastings,
        profile: initialProfile,
        migratedFromLocalStorage: false,
      };
    }
  }

  try {
    const existingInDB = await getAllTastingsFromDB();
    let finalTastings: BeerTasting[] = [];
    let migrated = false;

    // Purgar de IndexedDB cualquier cata de ejemplo predeterminada si existía
    const sampleTastingsInDB = existingInDB.filter(isDefaultSampleTasting);
    if (sampleTastingsInDB.length > 0) {
      console.info(`[IndexedDB] Eliminando ${sampleTastingsInDB.length} catas de ejemplo por defecto...`);
      for (const sample of sampleTastingsInDB) {
        await deleteTastingFromDB(sample.id);
      }
    }
    const nonSampleExisting = existingInDB.filter((t) => !isDefaultSampleTasting(t));

    if (nonSampleExisting.length > 0) {
      finalTastings = nonSampleExisting;
    } else {
      // Verificar si hay datos en localStorage para migrarlos a IndexedDB (filtrando ejemplos)
      let fromLocalStorage: BeerTasting[] | null = null;
      try {
        const raw = localStorage.getItem('diario_cervecero_catas');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            fromLocalStorage = parsed.filter((t) => !isDefaultSampleTasting(t));
          }
        }
      } catch (e) {
        console.warn('Error leyendo localStorage durante la migración:', e);
      }

      if (fromLocalStorage && fromLocalStorage.length > 0) {
        console.info(`[IndexedDB] Migrando ${fromLocalStorage.length} catas de usuario desde LocalStorage a IndexedDB...`);
        await saveAllTastingsToDB(fromLocalStorage);
        finalTastings = fromLocalStorage;
        migrated = true;
      } else {
        // Inicializar sin ejemplos (vacío a menos que se hayan pasado catas explícitas no de ejemplo)
        const validInitial = initialTastings.filter((t) => !isDefaultSampleTasting(t));
        if (validInitial.length > 0) {
          await saveAllTastingsToDB(validInitial);
        }
        finalTastings = validInitial;
      }
    }

    // Sincronizar localStorage con las catas limpiadas
    try {
      localStorage.setItem('diario_cervecero_catas', JSON.stringify(finalTastings));
    } catch {}

    // Perfil
    const profileInDB = await getProfileFromDB();
    let finalProfile: UserProfile = initialProfile;

    if (profileInDB) {
      finalProfile = profileInDB;
      // Si el perfil antiguo tenía estadísticas de ejemplo (48 catas, Carlos M.) pero no hay catas reales, limpiarlas
      if (finalTastings.length === 0 && (finalProfile.name === 'Carlos M.' || finalProfile.stats?.totalCatas === 48)) {
        finalProfile = {
          ...finalProfile,
          name: finalProfile.name === 'Carlos M.' ? initialProfile.name : finalProfile.name,
          title: 'Iniciado',
          stats: {
            totalCatas: 0,
            totalEstilos: 0,
            favoriteBrewery: '—',
          },
          achievements: initialProfile.achievements,
        };
        await saveProfileToDB(finalProfile);
      }
    } else {
      let profileFromLS: UserProfile | null = null;
      try {
        const rawP = localStorage.getItem('diario_cervecero_profile');
        if (rawP) profileFromLS = JSON.parse(rawP);
      } catch {
        // Ignore
      }
      finalProfile = profileFromLS || initialProfile;
      if (finalTastings.length === 0 && (finalProfile.name === 'Carlos M.' || finalProfile.stats?.totalCatas === 48)) {
        finalProfile = {
          ...finalProfile,
          name: finalProfile.name === 'Carlos M.' ? initialProfile.name : finalProfile.name,
          title: 'Iniciado',
          stats: {
            totalCatas: 0,
            totalEstilos: 0,
            favoriteBrewery: '—',
          },
          achievements: initialProfile.achievements,
        };
      }
      await saveProfileToDB(finalProfile);
    }

    try {
      localStorage.setItem('diario_cervecero_profile', JSON.stringify(finalProfile));
    } catch {}

    return {
      tastings: finalTastings,
      profile: finalProfile,
      migratedFromLocalStorage: migrated,
    };
  } catch (err) {
    console.error('[IndexedDB] Error en inicialización:', err);
    return {
      tastings: initialTastings,
      profile: initialProfile,
      migratedFromLocalStorage: false,
    };
  }
}
