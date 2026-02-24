/**
 * User service
 * Handles user profile and user management operations
 */

import api from './api';
import type { User, UserProfile, UpdateUserDto, UserStats } from '../types';
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * Get current user profile
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<ApiResponse<UserProfile>>('/users/profile');
  return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateUserDto): Promise<UserProfile> {
  const response = await api.put<ApiResponse<UserProfile>>('/users/profile', data);
  return response.data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return response.data;
}

/**
 * Get all users (admin only)
 */
export async function getUsers(params?: QueryParams): Promise<PaginatedResponse<User>> {
  const response = await api.get<PaginatedResponse<User>>('/users', { params });
  return response;
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: string): Promise<User> {
  const response = await api.patch<ApiResponse<User>>(`/users/${userId}/role`, { role });
  return response.data;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const response = await api.get<ApiResponse<UserStats>>(`/users/${userId}/stats`);
  return response.data;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post<ApiResponse<{ url: string }>>('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(): Promise<void> {
  await api.delete('/users/avatar');
}

const userService = {
  getProfile,
  updateProfile,
  getUserById,
  getUsers,
  deleteUser,
  updateUserRole,
  getUserStats,
  uploadAvatar,
  deleteAvatar,
};

export default userService;
