import { create } from 'zustand';
import { User } from '@pitchxi/shared-types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('pitchxi_token'),
  isAuthenticated: !!localStorage.getItem('pitchxi_token'),
  isLoading: true,
  error: null,

  initialize: async () => {
    const token = localStorage.getItem('pitchxi_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const { user } = await api.auth.getMe();
      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch {
      localStorage.removeItem('pitchxi_token');
      localStorage.removeItem('pitchxi_refresh');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('pitchxi_token', res.tokens.accessToken);
      localStorage.setItem('pitchxi_refresh', res.tokens.refreshToken);
      set({
        user: res.user,
        token: res.tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      set({
        error: err.message || 'Login failed. Please check your credentials.',
        isLoading: false
      });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(email, password, displayName);
      localStorage.setItem('pitchxi_token', res.tokens.accessToken);
      localStorage.setItem('pitchxi_refresh', res.tokens.refreshToken);
      set({
        user: res.user,
        token: res.tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      set({
        error: err.message || 'Registration failed.',
        isLoading: false
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('pitchxi_token');
    localStorage.removeItem('pitchxi_refresh');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null })
}));
