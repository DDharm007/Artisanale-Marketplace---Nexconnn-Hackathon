import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

const viteEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || 'AIzaSy_YOUR_FIREBASE_API_KEY_HERE',
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || 'your-project-id.firebaseapp.com',
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || 'your-project-id.firebasestorage.app',
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: viteEnv.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: viteEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const FIREBASE_PROJECT_INFO = {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  authDomain: firebaseConfig.authDomain,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

auth = getAuth(app);
storage = getStorage(app);

if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics optional
    });
}

export { app, db, auth, storage, analytics };

function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`Firebase operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads voice notes, webcam photos, or chat attachments to Firebase Storage,
 * falling back seamlessly to an embedded Data URL if offline or if Storage rules deny unauthenticated writes.
 */
export async function uploadChatFile(
  file: File,
  conversationId: string
): Promise<{ url: string; provider: 'firebase' | 'local' }> {
  const timestamp = Date.now();
  const originalName = file.name || 'attachment';
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

  try {
    const storageRef = ref(storage, `website-files/chats/${conversationId}/${timestamp}_${safeName}`);
    const snapshot = await withTimeout(
      uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
      }),
      3500
    );
    const downloadUrl = await withTimeout(getDownloadURL(snapshot.ref), 3500);
    return { url: downloadUrl, provider: 'firebase' };
  } catch (err) {
    console.warn('[Firebase Storage] Falling back to local data URL for attachment:', err);
    const dataUrl = await readFileAsDataUrl(file);
    return { url: dataUrl, provider: 'local' };
  }
}

export async function syncTicketToFirestore(ticket: Record<string, any>): Promise<boolean> {
  if (!ticket?.ticketId) return false;
  try {
    const cleanTicket = JSON.parse(
      JSON.stringify({
        ...ticket,
        sourceApp: 'ConvoCart-Nexconn',
        firebaseProjectId: firebaseConfig.projectId,
        syncedAt: new Date().toISOString(),
      })
    );
    await withTimeout(setDoc(doc(db, 'support-tickets', ticket.ticketId), cleanTicket, { merge: true }), 2500);
    return true;
  } catch {
    return false;
  }
}

export async function syncUserProfileToFirestore(user: Record<string, any>): Promise<boolean> {
  if (!user?.uid) return false;
  try {
    const cleanUser = JSON.parse(
      JSON.stringify({
        ...user,
        sourceApp: 'ConvoCart-Nexconn',
        firebaseProjectId: firebaseConfig.projectId,
        syncedAt: new Date().toISOString(),
      })
    );
    await withTimeout(setDoc(doc(db, 'convocart_users', user.uid), cleanUser, { merge: true }), 3000);
    return true;
  } catch {
    return false;
  }
}

export async function firebaseSignUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

export async function firebaseSignInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function firebaseSignInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function updateFirebaseUserProfile(
  displayName?: string,
  photoURL?: string
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await updateProfile(auth.currentUser, {
      ...(displayName ? { displayName } : {}),
      ...(photoURL ? { photoURL } : {}),
    });
  } catch {
    // Non-blocking
  }
}

export async function firebaseSignOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore
  }
}

export function getInitialFirebaseAuthUser(timeoutMs = 1500): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsub();
        resolve(auth.currentUser);
      }
    }, timeoutMs);
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        unsub();
        resolve(fbUser);
      }
    });
  });
}

export function subscribeToFirestoreCollection<T = any>(
  collectionName: string,
  onData: (items: T[]) => void,
  maxItems = 25
): Unsubscribe {
  try {
    const q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'), limit(maxItems));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as T[];
        onData(docs);
      },
      () => {
        // Ignore security rule errors gracefully
      }
    );
  } catch {
    return () => {};
  }
}
