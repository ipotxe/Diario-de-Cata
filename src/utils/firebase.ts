import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BeerTasting } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handler required by Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by SKILL.md
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
    }
  }
}

// Auth operations
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Save or sync user profile document to /users/{userId}
export async function saveUserProfileToFirestore(user: User, extra?: { bio?: string; title?: string }) {
  const userRef = doc(db, 'users', user.uid);
  const data = {
    uid: user.uid,
    name: user.displayName || 'Cervecero',
    email: user.email || '',
    avatarUrl: user.photoURL || '',
    bio: extra?.bio || 'Entusiasta de la cerveza artesana y catador BJCP',
    title: extra?.title || 'Catador Artesanal',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Save a single tasting to /users/{userId}/tastings/{tastingId}
export async function saveTastingToFirestore(userId: string, tasting: BeerTasting): Promise<void> {
  const tastingRef = doc(db, 'users', userId, 'tastings', tasting.id);
  const data = {
    ...tasting,
    userId,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(tastingRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/tastings/${tasting.id}`);
  }
}

// Delete a single tasting from /users/{userId}/tastings/{tastingId}
export async function deleteTastingFromFirestore(userId: string, tastingId: string): Promise<void> {
  const tastingRef = doc(db, 'users', userId, 'tastings', tastingId);
  try {
    await deleteDoc(tastingRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tastings/${tastingId}`);
  }
}

// Fetch all tastings for a user from /users/{userId}/tastings
export async function fetchUserTastingsFromFirestore(userId: string): Promise<BeerTasting[]> {
  const path = `users/${userId}/tastings`;
  try {
    const colRef = collection(db, 'users', userId, 'tastings');
    const snapshot = await getDocs(colRef);
    const tastings: BeerTasting[] = [];
    snapshot.forEach((d) => {
      tastings.push(d.data() as BeerTasting);
    });
    return tastings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Sync all local tastings to Firestore in batch/sequence
export async function syncAllLocalTastingsToFirestore(
  userId: string,
  localTastings: BeerTasting[]
): Promise<{ count: number }> {
  let count = 0;
  for (const tasting of localTastings) {
    try {
      await saveTastingToFirestore(userId, tasting);
      count++;
    } catch (err) {
      console.error(`Failed to sync tasting ${tasting.id}:`, err);
    }
  }
  return { count };
}

// Delete all tastings for a user in Firestore
export async function deleteAllUserTastingsFromFirestore(
  userId: string
): Promise<{ count: number }> {
  let count = 0;
  try {
    const colRef = collection(db, 'users', userId, 'tastings');
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      try {
        await deleteDoc(docSnap.ref);
        count++;
      } catch (err) {
        console.error(`Failed to delete tasting ${docSnap.id} from Firestore:`, err);
      }
    }
    return { count };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tastings`);
  }
}
