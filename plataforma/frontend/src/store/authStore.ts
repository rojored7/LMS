/**
 * Authentication store using Zustand
 * Tokens se manejan via HttpOnly cookies (no localStorage)
 * Solo se persiste user e isAuthenticated en Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import authService from '../services/auth.service';

interface RawUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
  xp?: number;
  theme?: string;
  locale?: string;
  trainingProfileId?: string;
  createdAt?: string;
}

function mapUser(raw: RawUser): User {
  const name = raw.name || '';
  const spaceIndex = name.indexOf(' ');
  const firstName = spaceIndex === -1 ? name : name.substring(0, spaceIndex);
  const lastName = spaceIndex === -1 ? '' : name.substring(spaceIndex + 1);
  return {
    ...raw,
    name,
    firstName: firstName || '',
    lastName: lastName || '',
    isActive: true,
  };
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.login({ email, password });

          set({
            user: mapUser(response.user),
            isAuthenticated: true,
            isLoading: false,
          });
          // Tokens quedan en HttpOnly cookies (seteadas por el backend)
        } catch (error: unknown) {
          const message =
            error && typeof error === 'object' && 'error' in error
              ? (error as { error: { message: string } }).error.message
              : 'Error al iniciar sesion';
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.register(data);

          set({
            user: mapUser(response.user),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message =
            error && typeof error === 'object' && 'error' in error
              ? (error as { error: { message: string } }).error.message
              : 'Error al registrarse';
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignorar error de logout, limpiar estado local de todas formas
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
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
          set({ user: mapUser(user) });
        } catch {
          await get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
