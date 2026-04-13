/**
 * Notification Service
 * API client for notification operations
 */

import api from '../api';
import type { Notification } from '../../types/gamification';

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * Get notifications with optional filters
 * @param filters - Notification filters
 */
export const getNotifications = async (
  filters: NotificationFilters = {}
): Promise<Notification[]> => {
  const params = new URLSearchParams();

  if (filters.unreadOnly !== undefined) {
    params.append('unreadOnly', String(filters.unreadOnly));
  }
  if (filters.limit !== undefined) {
    params.append('limit', String(filters.limit));
  }
  if (filters.offset !== undefined) {
    params.append('offset', String(filters.offset));
  }

  const queryString = params.toString();
  const url = queryString ? `/notifications?${queryString}` : '/notifications';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
  const envelope = response as any;
  return typeof envelope.data === 'number' ? envelope.data : (envelope.data?.count ?? 0);
};

/**
 * Mark a notification as read
 * @param notificationId - Notification ID
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

/**
 * Delete a notification
 * @param notificationId - Notification ID
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
