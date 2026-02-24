/**
 * UI store using Zustand
 * Manages UI state like modals, toasts, sidebar, etc.
 */

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  content?: React.ReactNode;
}

interface UiState {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Modals
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Loading
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
}

let toastIdCounter = 0;

export const useUiStore = create<UiState>((set, get) => ({
  // Sidebar
  isSidebarOpen: true,

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  openSidebar: () => {
    set({ isSidebarOpen: true });
  },

  closeSidebar: () => {
    set({ isSidebarOpen: false });
  },

  // Modals
  modals: {},

  openModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: true },
    }));
  },

  closeModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: false },
    }));
  },

  toggleModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: !state.modals[modalId] },
    }));
  },

  // Toasts
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${toastIdCounter++}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Theme
  theme: 'light',

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { theme: newTheme };
    });
  },

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  // Loading
  isGlobalLoading: false,

  setGlobalLoading: (isLoading) => {
    set({ isGlobalLoading: isLoading });
  },
}));
