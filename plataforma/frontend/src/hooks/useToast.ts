/**
 * useToast Hook
 * Custom hook for showing toast notifications
 */

import { useUiStore } from '../store/uiStore';
import { TOAST_DURATION } from '../utils/constants';

export const useToast = () => {
  const addToast = useUiStore((state) => state.addToast);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    addToast({
      message,
      type,
      duration: TOAST_DURATION.MEDIUM,
    });
  };

  // Convenience methods for common toast types
  const success = (message: string) => showToast(message, 'success');
  const error = (message: string) => showToast(message, 'error');
  const info = (message: string) => showToast(message, 'info');
  const warning = (message: string) => showToast(message, 'warning');

  return {
    showToast,
    success,
    error,
    info,
    warning
  };
};
