/**
 * Authentication store using Zustand
 * Manages user authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import authService from '../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });

        // Store tokens in localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response: AuthResponse = await authService.login({ email, password });

          // Update store with user and tokens
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store tokens in localStorage
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error: any) {
          set({
            error: error?.error?.message || 'Error al iniciar sesión',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response: AuthResponse = await authService.register(data);

          // Update store with user and tokens
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store tokens in localStorage
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error: any) {
          set({
            error: error?.error?.message || 'Error al registrarse',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear store
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear localStorage
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      refreshUser: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user });
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
          console.error('Error refreshing user:', error);
          // If refresh fails, logout
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
