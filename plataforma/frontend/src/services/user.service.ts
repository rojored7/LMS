/**
 * User service - Adapted for FastAPI backend
 */

import api from './api';
import type { User, UpdateUserDto } from '../types';
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
  const envelope = await api.get<ApiResponse<User>>('/users/me');
  return (envelope as any).data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateUserDto): Promise<User> {
  const envelope = await api.put<ApiResponse<User>>('/users/me', data);
  return (envelope as any).data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  const envelope = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return (envelope as any).data;
}

/**
 * Get all users (admin only)
 */
export async function getUsers(params?: QueryParams): Promise<PaginatedResponse<User>> {
  const response = await api.get<PaginatedResponse<User>>('/users', { params });
  return response as any;
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
  const envelope = await api.put(`/admin/users/${userId}/role`, { role });
  return (envelope as any).data || envelope;
}

const userService = {
  getProfile,
  updateProfile,
  getUserById,
  getUsers,
  deleteUser,
  updateUserRole,
};

export default userService;
