import { create } from 'zustand';
import { Address, UserProfile, UserRole } from '@convocart/shared';
import { apiRequest, ApiError } from '../lib/api';
import { nexconnClient } from '../lib/nexconnClient';
import { syncMyRsaPublicKey } from '../lib/encryption';
import {
  firebaseSignUpWithEmail,
  firebaseSignInWithEmail,
  firebaseSignInWithGoogle,
  firebaseSignOutUser,
  getInitialFirebaseAuthUser,
  syncUserProfileToFirestore,
  updateFirebaseUserProfile,
} from '../lib/firebase';

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role?: 'consumer' | 'vendor';
  businessName?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  photoURL?: string;
  address?: Partial<Address>;
}

export interface AccountPrefill {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  role?: 'consumer' | 'vendor';
  businessName?: string;
  authProvider: 'firebase' | 'google';
  emailVerified?: boolean;
  addresses?: Address[];
}

export type AuthFlowResult =
  | { status: 'SIGNED_IN' }
  | { status: 'ACCOUNT_NOT_FOUND'; email: string }
  | { status: 'NEEDS_ONBOARDING'; isNewAccount: boolean; prefill: AccountPrefill };

export interface CompleteOnboardingPayload {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: 'consumer' | 'vendor';
  businessName?: string;
  phoneNumber: string;
  preferredLanguage: string;
  photoURL?: string;
  authProvider: 'firebase' | 'google';
  emailVerified?: boolean;
  address: Partial<Address>;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  nexconnToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthFlowResult>;
  loginWithGoogle: (intent?: 'signin' | 'signup') => Promise<AuthFlowResult>;
  completeOnboarding: (payload: CompleteOnboardingPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | undefined>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  switchDemoRole: (role: UserRole, emailOverride?: string) => Promise<void>;
}

interface CheckAccountResponse {
  exists: boolean;
  needsProfileCompletion: boolean;
  user?: {
    uid: string;
    firebaseUid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    preferredLanguage?: string;
    role?: UserRole;
    city?: string;
    country?: string;
    vendorId?: string;
    businessName?: string;
    addresses?: Address[];
  };
}

function finalizeAuthenticatedSession(
  set: (partial: Partial<AuthState>) => void,
  data: { user: UserProfile; token?: string; nexconnToken: string }
) {
  if (data.token) {
    localStorage.setItem('convocart_auth_token', data.token);
  }
  set({
    user: data.user,
    token: data.token || localStorage.getItem('convocart_auth_token'),
    nexconnToken: data.nexconnToken,
    isLoading: false,
    error: null,
  });

  if (data.nexconnToken) {
    nexconnClient.connect(data.nexconnToken, data.user.uid);
  }
  void syncMyRsaPublicKey(data.user.uid, data.user.rsaPublicKey).then((info) => {
    if (info && data.user && data.user.rsaPublicKey !== info.publicKey) {
      set({
        user: {
          ...data.user,
          rsaPublicKey: info.publicKey,
          rsaKeyFingerprint: info.fingerprint,
        },
      });
    }
  });
  void syncUserProfileToFirestore(data.user);
  void import('./useChatStore').then(({ useChatStore }) =>
    useChatStore.getState().resetAndFetchForNewUser()
  );
  nexconnClient.notifySync({ type: 'auth_changed' });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('convocart_auth_token') : null,
  nexconnToken: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Try primary cloud auth first
      try {
        const fbUser = await firebaseSignInWithEmail(email, password);
        const check = await apiRequest<CheckAccountResponse>('/auth/check-account', {
          method: 'POST',
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            email: fbUser.email || email,
          }),
        });

        if (!check.exists || check.needsProfileCompletion) {
          set({ isLoading: false, error: null });
          return {
            status: 'NEEDS_ONBOARDING',
            isNewAccount: !check.exists,
            prefill: {
              firebaseUid: fbUser.uid,
              email: fbUser.email || email,
              displayName: check.user?.displayName || fbUser.displayName || '',
              photoURL: check.user?.photoURL || fbUser.photoURL || '',
              phoneNumber: check.user?.phoneNumber || fbUser.phoneNumber || '',
              preferredLanguage: check.user?.preferredLanguage || 'en',
              role: check.user?.role === 'vendor' ? 'vendor' : 'consumer',
              businessName: check.user?.businessName || '',
              authProvider: 'firebase',
              emailVerified: fbUser.emailVerified,
              addresses: check.user?.addresses || [],
            },
          };
        }

        const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
          '/auth/firebase-sync',
          {
            method: 'POST',
            body: JSON.stringify({
              firebaseUid: fbUser.uid,
              email: fbUser.email || email,
              displayName: fbUser.displayName || undefined,
              photoURL: fbUser.photoURL || undefined,
              phoneNumber: fbUser.phoneNumber || undefined,
              emailVerified: fbUser.emailVerified,
              authProvider: 'firebase',
            }),
          }
        );
        finalizeAuthenticatedSession(set, data);
        return { status: 'SIGNED_IN' };
      } catch (fbErr: any) {
        const code = fbErr?.code || '';
        if (
          code &&
          !code.includes('user-not-found') &&
          !code.includes('invalid-credential') &&
          !code.includes('wrong-password') &&
          !code.includes('operation-not-allowed') &&
          !code.includes('network-request-failed')
        ) {
          throw fbErr;
        }
      }

      // 2. Backend credential verification fallback
      try {
        const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          }
        );
        finalizeAuthenticatedSession(set, data);
        return { status: 'SIGNED_IN' };
      } catch (loginErr: any) {
        if (loginErr instanceof ApiError && loginErr.statusCode === 404) {
          set({ isLoading: false, error: null });
          return { status: 'ACCOUNT_NOT_FOUND', email };
        }
        throw loginErr;
      }
    } catch (err: any) {
      set({ error: err.message || 'Invalid email or password', isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (intent = 'signin') => {
    set({ isLoading: true, error: null });
    try {
      const fbUser = await firebaseSignInWithGoogle();
      const email = fbUser.email || '';

      const check = await apiRequest<CheckAccountResponse>('/auth/check-account', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: fbUser.uid,
          email,
        }),
      });

      const shouldCollectDetails =
        intent === 'signup' || !check.exists || check.needsProfileCompletion;

      if (shouldCollectDetails) {
        set({ isLoading: false, error: null });
        return {
          status: 'NEEDS_ONBOARDING',
          isNewAccount: !check.exists,
          prefill: {
            firebaseUid: fbUser.uid,
            email,
            displayName: check.user?.displayName || fbUser.displayName || '',
            photoURL: check.user?.photoURL || fbUser.photoURL || '',
            phoneNumber: check.user?.phoneNumber || fbUser.phoneNumber || '',
            preferredLanguage: check.user?.preferredLanguage || 'en',
            role: check.user?.role === 'vendor' ? 'vendor' : 'consumer',
            businessName: check.user?.businessName || '',
            authProvider: 'google',
            emailVerified: fbUser.emailVerified,
            addresses: check.user?.addresses || [],
          },
        };
      }

      const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
        '/auth/firebase-sync',
        {
          method: 'POST',
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            phoneNumber: fbUser.phoneNumber,
            emailVerified: fbUser.emailVerified,
            authProvider: 'google',
          }),
        }
      );
      finalizeAuthenticatedSession(set, data);
      return { status: 'SIGNED_IN' };
    } catch (err: any) {
      set({ error: err.message || 'Google sign-in failed', isLoading: false });
      throw err;
    }
  },

  completeOnboarding: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
        '/auth/firebase-sync',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      void updateFirebaseUserProfile(data.user.displayName, data.user.photoURL);
      finalizeAuthenticatedSession(set, data);
    } catch (err: any) {
      set({ error: err.message || 'Could not complete account setup', isLoading: false });
      throw err;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      let firebaseUid: string | undefined;
      try {
        const fbUser = await firebaseSignUpWithEmail(
          registerData.email,
          registerData.password,
          registerData.displayName
        );
        firebaseUid = fbUser.uid;
      } catch (fbErr: any) {
        const code = fbErr?.code || '';
        if (code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Please Sign In instead.');
        }
        if (code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
        if (code !== 'auth/operation-not-allowed' && code !== 'auth/network-request-failed') {
          throw fbErr;
        }
      }

      const data = firebaseUid
        ? await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
            '/auth/firebase-sync',
            {
              method: 'POST',
              body: JSON.stringify({
                ...registerData,
                firebaseUid,
                authProvider: 'firebase',
              }),
            }
          )
        : await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
            '/auth/register',
            {
              method: 'POST',
              body: JSON.stringify(registerData),
            }
          );

      finalizeAuthenticatedSession(set, data);
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  updateUserProfile: async (updates) => {
    const res = await apiRequest<{ message: string; user: UserProfile }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (res.user) {
      set({ user: res.user });
      void updateFirebaseUserProfile(res.user.displayName, res.user.photoURL);
      void syncUserProfileToFirestore(res.user);
      void import('./useChatStore').then(({ useChatStore }) =>
        useChatStore.getState().fetchConversations()
      );
    }
    return res.user;
  },

  logout: async () => {
    await firebaseSignOutUser();
    localStorage.removeItem('convocart_auth_token');
    set({ user: null, token: null, nexconnToken: null, isLoading: false, error: null });
    void import('./useChatStore').then(({ useChatStore }) => {
      useChatStore.setState({ activeConversationId: null, conversations: [], unreadTotal: 0 });
    });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('convocart_auth_token');
    if (token) {
      try {
        const data = await apiRequest<{ user: UserProfile; nexconnToken: string }>('/auth/me');
        set({ user: data.user, nexconnToken: data.nexconnToken, isLoading: false, error: null });
        if (data.nexconnToken) {
          nexconnClient.connect(data.nexconnToken, data.user.uid);
        }
        void syncMyRsaPublicKey(data.user.uid, data.user.rsaPublicKey).then((info) => {
          if (info && data.user && data.user.rsaPublicKey !== info.publicKey) {
            set({
              user: {
                ...data.user,
                rsaPublicKey: info.publicKey,
                rsaKeyFingerprint: info.fingerprint,
              },
            });
          }
        });
        void syncUserProfileToFirestore(data.user);
        void import('./useChatStore').then(({ useChatStore }) =>
          useChatStore.getState().fetchConversations()
        );
        return;
      } catch {
        localStorage.removeItem('convocart_auth_token');
      }
    }

    // Only auto-restore active session if profile registration was already completed
    try {
      const fbUser = await getInitialFirebaseAuthUser(1200);
      if (fbUser && fbUser.email) {
        const check = await apiRequest<CheckAccountResponse>('/auth/check-account', {
          method: 'POST',
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            email: fbUser.email,
          }),
        });

        if (check.exists && !check.needsProfileCompletion) {
          const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>(
            '/auth/firebase-sync',
            {
              method: 'POST',
              body: JSON.stringify({
                firebaseUid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                phoneNumber: fbUser.phoneNumber,
                emailVerified: fbUser.emailVerified,
                authProvider:
                  fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase',
              }),
            }
          );
          finalizeAuthenticatedSession(set, data);
          return;
        }
      }
    } catch {
      // No active completed session
    }

    set({ user: null, token: null, nexconnToken: null, isLoading: false });
  },

  switchDemoRole: async (role: UserRole, emailOverride?: string) => {
    const roleAccounts: Record<UserRole, { email: string; pass: string }> = {
      consumer: { email: 'customer@convocart.com', pass: 'Password123!' },
      vendor: { email: 'vendor@convocart.com', pass: 'Password123!' },
      support_agent: { email: 'support@convocart.com', pass: 'Password123!' },
      admin: { email: 'admin@convocart.com', pass: 'Password123!' },
    };

    const acc = roleAccounts[role];
    const targetEmail = emailOverride || acc?.email;
    if (targetEmail) {
      await get().login(targetEmail, acc?.pass || 'Password123!');
    }
  },
}));
