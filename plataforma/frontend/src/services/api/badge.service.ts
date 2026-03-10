/**
 * Badge Service
 * API client for badge and achievement operations
 */

import api from '../api';
import type { Badge, UserBadge, BadgeCategory } from '../../types/gamification';

export interface CreateBadgeRequest {
  name: string;
  description: string;
  iconUrl?: string;
  category: BadgeCategory;
  requirement: string;
  xpReward: number;
}

export interface UpdateBadgeRequest extends Partial<CreateBadgeRequest> {}

/**
 * Get all available badges
 */
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await api.get('/badges');
  return response.data;
};

/**
 * Get my earned badges
 */
export const getMyBadges = async (): Promise<UserBadge[]> => {
  const response = await api.get('/badges/my-badges');
  return response.data;
};

/**
 * Get user badges by user ID
 * @param userId - User ID
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const response = await api.get(`/badges/users/${userId}/badges`);
  return response.data;
};

/**
 * Create a new badge (admin/instructor only)
 * @param badge - Badge data
 */
export const createBadge = async (badge: CreateBadgeRequest): Promise<Badge> => {
  const response = await api.post('/badges', badge);
  return response.data;
};

/**
 * Update a badge (admin/instructor only)
 * @param badgeId - Badge ID
 * @param badge - Badge data to update
 */
export const updateBadge = async (badgeId: string, badge: UpdateBadgeRequest): Promise<Badge> => {
  const response = await api.put(`/badges/${badgeId}`, badge);
  return response.data;
};

/**
 * Delete a badge (admin only)
 * @param badgeId - Badge ID
 */
export const deleteBadge = async (badgeId: string): Promise<void> => {
  await api.delete(`/badges/${badgeId}`);
};

/**
 * Get badge detail
 * @param badgeId - Badge ID
 */
export const getBadge = async (badgeId: string): Promise<Badge> => {
  const response = await api.get(`/badges/${badgeId}`);
  return response.data;
};

export default {
  getAllBadges,
  getMyBadges,
  getUserBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  getBadge,
};
