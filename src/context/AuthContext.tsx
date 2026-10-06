import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  saveUserProfileToFirestore,
  fetchUserTastingsFromFirestore,
  syncAllLocalTastingsToFirestore,
  testConnection,
} from '../utils/firebase';
import { getAllTastingsFromDB, saveAllTastingsToDB } from '../utils/db';
import { BeerTasting } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  signInWithGoogleAuth: () => Promise<User | null>;
  signOutAuth: () => Promise<void>;
  syncLocalToCloud: () => Promise<{ success: boolean; count: number }>;
  syncCloudToLocal: () => Promise<{ success: boolean; count: number }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  syncStatus: 'idle',
  lastSyncTime: null,
  signInWithGoogleAuth: async () => null,
  signOutAuth: async () => {},
  syncLocalToCloud: async () => ({ success: false, count: 0 }),
  syncCloudToLocal: async () => ({ success: false, count: 0 }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('last_firestore_sync_time');
  });

  useEffect(() => {
    // Initial connection test
    testConnection();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Save/update user profile in firestore
        try {
          await saveUserProfileToFirestore(currentUser);
        } catch (e) {
          console.warn('Could not auto-update user profile in firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogleAuth = async (): Promise<User | null> => {
    try {
      setLoading(true);
      const loggedUser = await loginWithGoogle();
      setUser(loggedUser);
      await saveUserProfileToFirestore(loggedUser);
      return loggedUser;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutAuth = async () => {
    try {
      await logoutUser();
      setUser(null);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Upload local tastings to Firestore
  const syncLocalToCloud = async (): Promise<{ success: boolean; count: number }> => {
    if (!user) {
      return { success: false, count: 0 };
    }

    try {
      setSyncStatus('syncing');
      const localTastings = await getAllTastingsFromDB();
      const res = await syncAllLocalTastingsToFirestore(user.uid, localTastings);
      const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      localStorage.setItem('last_firestore_sync_time', now);
      setSyncStatus('synced');
      return { success: true, count: res.count };
    } catch (error) {
      console.error('Error syncing local to cloud:', error);
      setSyncStatus('error');
      return { success: false, count: 0 };
    }
  };

  // Download cloud tastings into local storage
  const syncCloudToLocal = async (): Promise<{ success: boolean; count: number }> => {
    if (!user) {
      return { success: false, count: 0 };
    }

    try {
      setSyncStatus('syncing');
      const cloudTastings = await fetchUserTastingsFromFirestore(user.uid);
      if (cloudTastings.length > 0) {
        const local = await getAllTastingsFromDB();
        const localMap = new Map(local.map((t) => [t.id, t]));
        // Merge cloud tastings into local
        cloudTastings.forEach((ct) => {
          localMap.set(ct.id, ct);
        });
        const merged = Array.from(localMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        await saveAllTastingsToDB(merged);
        try {
          localStorage.setItem('diario_cervecero_catas', JSON.stringify(merged));
        } catch {}
      }
      const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      localStorage.setItem('last_firestore_sync_time', now);
      setSyncStatus('synced');
      return { success: true, count: cloudTastings.length };
    } catch (error) {
      console.error('Error syncing cloud to local:', error);
      setSyncStatus('error');
      return { success: false, count: 0 };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncStatus,
        lastSyncTime,
        signInWithGoogleAuth,
        signOutAuth,
        syncLocalToCloud,
        syncCloudToLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
