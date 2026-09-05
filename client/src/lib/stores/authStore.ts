import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await authAPI.signup({ email, password, name })) as unknown as { user: User };
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Signup failed', isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await authAPI.login({ email, password })) as unknown as { user: User };
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Logout failed', isLoading: false });
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = (await authAPI.getCurrentUser()) as unknown as { user: User };
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Not authenticated - this is expected for unauthenticated users
      set({ user: null, isAuthenticated: false, isLoading: false });
      // Don't throw - let components handle the unauthenticated state
    }
  },

  clearError: () => set({ error: null }),
}));
