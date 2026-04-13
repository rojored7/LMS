/**
 * Authentication service
 * Tokens se manejan via HttpOnly cookies - no se almacenan en el cliente
 */

import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest } from '../types';

/**
 * Login - el backend setea HttpOnly cookies en la respuesta
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  // api interceptor ya retorna response.data (el envelope {success, data})
  const envelope = await api.post('/auth/login', credentials);
  return (envelope as any).data;
}

/**
 * Register - el backend setea HttpOnly cookies en la respuesta
 */
export async function register(data: RegisterRequest): Promise<{ user: AuthResponse['user'] }> {
  const envelope = await api.post('/auth/register', data);
  return (envelope as any).data;
}

/**
 * Logout - el backend invalida las cookies
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Refresh - las cookies se envian automaticamente via withCredentials
 */
export async function refreshToken(): Promise<void> {
  await api.post('/auth/refresh');
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.post('/users/me/change-password', data);
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', {
    token,
    password: newPassword,
  });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const envelope = await api.get('/users/me');
  return (envelope as any).data;
}

const authService = {
  login,
  register,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};

export default authService;
