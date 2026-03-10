/**
 * Dark Mode Hook with System Preference Support
 * HU-037: Persistent theme with light/dark/system options
 */

import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface DarkModeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create the zustand store with persistence
const useDarkModeStore = create(
  persist<DarkModeState>(
    (set, get) => ({
      theme: 'system',
      effectiveTheme: 'light',

      setTheme: (theme: Theme) => {
        set({ theme });
        updateEffectiveTheme(theme);
      },

      toggleTheme: () => {
        const themes: Theme[] = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(get().theme);
        const nextTheme = themes[(currentIndex + 1) % 3];
        get().setTheme(nextTheme);
      }
    }),
    {
      name: 'theme-preference',
      getStorage: () => localStorage
    }
  )
);

// Helper function to determine effective theme
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateEffectiveTheme(theme: Theme) {
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

  // Update DOM
  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === 'dark' ? '#1f2937' : '#ffffff'
    );
  }

  // Store effective theme
  useDarkModeStore.setState({ effectiveTheme });
}

/**
 * Custom hook for dark mode management
 */
export function useDarkMode() {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useDarkModeStore();
  const [isSystemDark, setIsSystemDark] = useState(getSystemTheme() === 'dark');

  useEffect(() => {
    // Initialize theme on mount
    updateEffectiveTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
      if (theme === 'system') {
        updateEffectiveTheme('system');
      }
    };

    // Add event listener (using modern API with fallback)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [theme]);

  const cycleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme: cycleTheme,
    isSystemDark,
    isDark: effectiveTheme === 'dark'
  };
}

export default useDarkMode;