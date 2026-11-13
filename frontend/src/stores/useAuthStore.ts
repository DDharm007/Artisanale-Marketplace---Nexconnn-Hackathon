import { create } from 'zustand';
import { UserProfile, UserRole } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { nexconnClient } from '../lib/nexconnClient';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  nexconnToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string; role?: UserRole; businessName?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('convocart_auth_token'),
  nexconnToken: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('convocart_auth_token', data.token);
      set({ user: data.user, token: data.token, nexconnToken: data.nexconnToken, isLoading: false });

      // Connect Nexconn SDK
      if (data.nexconnToken) {
        nexconnClient.connect(data.nexconnToken, data.user.uid);
      }
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<{ user: UserProfile; token: string; nexconnToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });
      localStorage.setItem('convocart_auth_token', data.token);
      set({ user: data.user, token: data.token, nexconnToken: data.nexconnToken, isLoading: false });

      if (data.nexconnToken) {
        nexconnClient.connect(data.nexconnToken, data.user.uid);
      }
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('convocart_auth_token');
    set({ user: null, token: null, nexconnToken: null, isLoading: false, error: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('convocart_auth_token');
    if (!token) {
      try {
        await get().login('customer@convocart.com', 'Password123!');
        return;
      } catch {
        set({ user: null, isLoading: false });
        return;
      }
    }

    try {
      const data = await apiRequest<{ user: UserProfile; nexconnToken: string }>('/auth/me');
      set({ user: data.user, nexconnToken: data.nexconnToken, isLoading: false });
      if (data.nexconnToken) {
        nexconnClient.connect(data.nexconnToken, data.user.uid);
      }
    } catch {
      localStorage.removeItem('convocart_auth_token');
      try {
        await get().login('customer@convocart.com', 'Password123!');
      } catch {
        set({ user: null, token: null, isLoading: false });
      }
    }
  },

  switchDemoRole: async (role: UserRole) => {
    const roleAccounts: Record<UserRole, { email: string; pass: string }> = {
      consumer: { email: 'customer@convocart.com', pass: 'Password123!' },
      vendor: { email: 'vendor@convocart.com', pass: 'Password123!' },
      support_agent: { email: 'support@convocart.com', pass: 'Password123!' },
      admin: { email: 'admin@convocart.com', pass: 'Password123!' },
    };

    const acc = roleAccounts[role];
    if (acc) {
      await get().login(acc.email, acc.pass);
    }
  },
}));
