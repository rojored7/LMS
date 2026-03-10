/**
 * useNotifications Hook
 * Manages real-time notifications with polling and actions
 */

import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/api/notification.service';
import type { Notification } from '../types/gamification';
import { useAuthStore } from '../store/authStore';

const POLL_INTERVAL = 30000; // 30 seconds
const DEFAULT_LIMIT = 10;

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing user notifications
 * @param autoPolling - Enable automatic polling (default: true)
 * @param limit - Number of notifications to fetch (default: 10)
 */
export const useNotifications = (
  autoPolling: boolean = true,
  limit: number = DEFAULT_LIMIT
): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get authentication state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      const [notificationsData, count] = await Promise.all([
        notificationService.getNotifications({ unreadOnly: false, limit }),
        notificationService.getUnreadCount(),
      ]);

      // Ensure notifications is always an array
      const safeNotifications = Array.isArray(notificationsData) ? notificationsData : [];
      setNotifications(safeNotifications);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err: any) {
      // Only log error if it's not a 401 (authentication error)
      if (err?.response?.status !== 401) {
        console.error('Error fetching notifications:', err);
        setError(err?.error?.message || 'Error al cargar notificaciones');
      } else {
        // For 401 errors, silently clear notifications
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [limit, isAuthenticated]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Polling interval for real-time updates
   */
  useEffect(() => {
    if (!autoPolling || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [autoPolling, fetchNotifications, isAuthenticated]);

  /**
   * Clear notifications when user logs out
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (id: string) => {
      // Skip if not authenticated
      if (!isAuthenticated) return;

      try {
        await notificationService.markAsRead(id);

        // Optimistic update
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        if (err?.response?.status !== 401) {
          console.error('Error marking notification as read:', err);
        }
        // Revert on error
        await fetchNotifications();
      }
    },
    [fetchNotifications, isAuthenticated]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    try {
      await notificationService.markAllAsRead();

      // Optimistic update
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        console.error('Error marking all notifications as read:', err);
      }
      // Revert on error
      await fetchNotifications();
    }
  }, [fetchNotifications, isAuthenticated]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      // Skip if not authenticated
      if (!isAuthenticated) return;

      try {
        await notificationService.deleteNotification(id);

        // Optimistic update
        setNotifications((prev) => {
          const deleted = prev.find((n) => n.id === id);
          if (deleted && !deleted.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((notif) => notif.id !== id);
        });
      } catch (err: any) {
        if (err?.response?.status !== 401) {
          console.error('Error deleting notification:', err);
        }
        // Revert on error
        await fetchNotifications();
      }
    },
    [fetchNotifications, isAuthenticated]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};
