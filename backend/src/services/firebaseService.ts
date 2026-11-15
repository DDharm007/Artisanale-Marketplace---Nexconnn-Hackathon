import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  doc,
  setDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { ENV } from '../config/env';
import { FirebaseSyncStatus } from '../../../shared';

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`Firestore sync timeout after ${ms}ms`)), ms)
    ),
  ]);
}

type SeedSyncPayload = {
  users?: any[];
  vendors: any[];
  products: any[];
  conversations: any[];
  supportTickets: any[];
  orders: any[];
  faqs?: any[];
  articles?: any[];
};

class FirebaseSyncService {
  private app: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private lastSyncedAt: string | null = null;
  private lastError: string | undefined = undefined;
  private isSyncing = false;
  private seedState: SeedSyncPayload | null = null;
  private syncedCounts: Record<string, number> = {
    convocart_users: 0,
    convocart_vendors: 0,
    convocart_products: 0,
    convocart_conversations: 0,
    convocart_messages: 0,
    convocart_orders: 0,
    'support-tickets': 0,
    convocart_faqs: 0,
    convocart_kb: 0,
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const firebaseConfig = {
        apiKey: ENV.FIREBASE_API_KEY,
        authDomain: ENV.FIREBASE_AUTH_DOMAIN,
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
        appId: ENV.FIREBASE_APP_ID,
        measurementId: ENV.FIREBASE_MEASUREMENT_ID,
      };

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        return;
      }

      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
        this.firestore = initializeFirestore(this.app, {
          localCache: memoryLocalCache(),
        });
      } else {
        this.app = getApps()[0];
        this.firestore = getFirestore(this.app);
      }

      console.log(
        `[Firebase] Initialized Firestore client for project "${firebaseConfig.projectId}" (bucket: ${firebaseConfig.storageBucket})`
      );
    } catch (err: any) {
      this.lastError = err?.message || 'Firebase init warning';
      console.warn('[Firebase] Initialization notice:', this.lastError);
    }
  }

  public async syncDoc(collectionName: string, docId: string, data: unknown): Promise<boolean> {
    if (!this.firestore || !docId) return false;
    try {
      const cleanData = sanitizeForFirestore({
        ...(data as Record<string, unknown>),
        _firebaseProjectId: ENV.FIREBASE_PROJECT_ID,
        _syncedAt: new Date().toISOString(),
      });
      await withTimeout(setDoc(doc(this.firestore, collectionName, docId), cleanData, { merge: true }));
      this.syncedCounts[collectionName] = (this.syncedCounts[collectionName] || 0) + 1;
      this.lastSyncedAt = new Date().toISOString();
      this.lastError = undefined;
      return true;
    } catch (err: any) {
      this.lastError = err?.message || 'Firestore write skipped';
      return false;
    }
  }

  public async deleteDocFromCloud(collectionName: string, docId: string): Promise<boolean> {
    if (!this.firestore || !docId) return false;
    try {
      await withTimeout(deleteDoc(doc(this.firestore, collectionName, docId)));
      this.lastSyncedAt = new Date().toISOString();
      return true;
    } catch (err: any) {
      this.lastError = err?.message || 'Firestore delete skipped';
      return false;
    }
  }

  public deleteDocsBatch(collectionName: string, docIds: string[]): void {
    if (!this.firestore || ENV.NODE_ENV === 'test' || docIds.length === 0) return;
    void Promise.allSettled(docIds.map((id) => this.deleteDocFromCloud(collectionName, id)));
  }

  public syncInitialSeed(state: SeedSyncPayload): void {
    this.seedState = state;
    if (!this.firestore || ENV.NODE_ENV === 'test') {
      return;
    }

    // Non-blocking background sync of core documents to Cloud Firestore
    void this.runSeedSync(state);
  }

  private async runSeedSync(state: SeedSyncPayload): Promise<void> {
    if (!this.firestore || this.isSyncing) return;
    this.isSyncing = true;
    try {
      const jobs: Promise<boolean>[] = [];
      for (const u of (state.users || []).slice(0, 20)) {
        jobs.push(this.syncDoc('convocart_users', u.uid, u));
      }
      for (const v of state.vendors.slice(0, 10)) {
        jobs.push(this.syncDoc('convocart_vendors', v.vendorId, v));
      }
      for (const p of state.products.slice(0, 15)) {
        jobs.push(this.syncDoc('convocart_products', p.productId, p));
      }
      for (const c of state.conversations.slice(0, 10)) {
        jobs.push(this.syncDoc('convocart_conversations', c.conversationId, c));
      }
      for (const o of state.orders.slice(0, 10)) {
        jobs.push(this.syncDoc('convocart_orders', o.orderId, o));
      }
      for (const t of state.supportTickets.slice(0, 10)) {
        jobs.push(this.syncDoc('support-tickets', t.ticketId, t));
      }
      for (const f of (state.faqs || []).slice(0, 10)) {
        jobs.push(this.syncDoc('convocart_faqs', f.id, f));
      }
      for (const a of (state.articles || []).slice(0, 10)) {
        jobs.push(this.syncDoc('convocart_kb', a.id, a));
      }
      await Promise.allSettled(jobs);
    } catch {
      // Resilient background sync never blocks runtime
    } finally {
      this.isSyncing = false;
    }
  }

  public async resyncAll(): Promise<FirebaseSyncStatus> {
    if (this.seedState) {
      await this.runSeedSync(this.seedState);
    }
    return this.getStatus();
  }

  public getStatus(): FirebaseSyncStatus {
    if (
      this.firestore &&
      ENV.FIREBASE_PROJECT_ID &&
      ENV.NODE_ENV !== 'test' &&
      !this.lastSyncedAt &&
      !this.isSyncing &&
      this.seedState
    ) {
      void this.runSeedSync(this.seedState);
    }

    return {
      connected: Boolean(this.firestore && ENV.FIREBASE_PROJECT_ID),
      projectId: ENV.FIREBASE_PROJECT_ID,
      storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
      lastSyncedAt: this.lastSyncedAt,
      syncedCounts: { ...this.syncedCounts },
      ...(this.lastError ? { error: this.lastError } : {}),
    };
  }
}

export const firebaseService = new FirebaseSyncService();
