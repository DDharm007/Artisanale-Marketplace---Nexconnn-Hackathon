import * as admin from 'firebase-admin';
import { ENV } from './env';

let firestoreDb: admin.firestore.Firestore | null = null;
let firebaseAuth: admin.auth.Auth | null = null;
let isFirebaseInitialized = false;

try {
  if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY,
      }),
    });
    firestoreDb = admin.firestore();
    firebaseAuth = admin.auth();
    isFirebaseInitialized = true;
    console.log('[Firebase] Initialized official Firebase Admin SDK');
  } else {
    console.log('[Firebase] No Service Account credentials found. Running in hybrid persistence mode.');
  }
} catch (err) {
  console.warn('[Firebase] Firebase Admin init error, falling back to local database store:', err);
}

export { firestoreDb, firebaseAuth, isFirebaseInitialized };
