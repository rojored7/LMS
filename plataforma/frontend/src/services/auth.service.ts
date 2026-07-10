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

/**
 * Get available auth providers
 */
export async function getAuthProviders(): Promise<Record<string, boolean>> {
  const envelope = await api.get('/auth/providers');
  return (envelope as any).data?.providers ?? { local: true };
}

/**
 * Login with LDAP credentials
 */
export async function loginLdap(username: string, password: string): Promise<AuthResponse> {
  const envelope = await api.post('/auth/login/ldap', { username, password });
  return (envelope as any).data;
}

export interface Session {
  id: string;
  session_started_at: string;
  last_activity_at: string;
  expires_at: string;
  is_expired: boolean;
}

/**
 * Get active sessions for the current user
 */
export async function getSessions(): Promise<Session[]> {
  const envelope = await api.get('/auth/sessions');
  return (envelope as any).data?.sessions ?? [];
}

/**
 * Close a specific session by id
 */
export async function closeSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

/**
 * Close all sessions except the current one
 */
export async function closeAllOtherSessions(): Promise<{ count: number }> {
  const envelope = await api.delete('/auth/sessions');
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
  getAuthProviders,
  loginLdap,
  getSessions,
  closeSession,
  closeAllOtherSessions,
};

export default authService;
