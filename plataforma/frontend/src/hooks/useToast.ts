/**
 * useToast hook
 * Provides toast notification functionality
 */

import { useUiStore } from '../store/uiStore';
import { TOAST_DURATION } from '../utils/constants';

export function useToast() {
  const { addToast, removeToast, clearToasts } = useUiStore();

  /**
   * Show success toast
   */
  const success = (message: string, duration?: number) => {
    addToast({
      type: 'success',
      message,
      duration: duration || TOAST_DURATION.MEDIUM,
    });
  };

  /**
   * Show error toast
   */
  const error = (message: string, duration?: number) => {
    addToast({
      type: 'error',
      message,
      duration: duration || TOAST_DURATION.LONG,
    });
  };

  /**
   * Show warning toast
   */
  const warning = (message: string, duration?: number) => {
    addToast({
      type: 'warning',
      message,
      duration: duration || TOAST_DURATION.MEDIUM,
    });
  };

  /**
   * Show info toast
   */
  const info = (message: string, duration?: number) => {
    addToast({
      type: 'info',
      message,
      duration: duration || TOAST_DURATION.MEDIUM,
    });
  };

  return {
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clear: clearToasts,
  };
}
