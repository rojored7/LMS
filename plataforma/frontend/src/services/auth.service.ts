/**
 * Authentication service
 * Handles login, register, logout, and token management
 */

import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
} from '../types';
import type { ApiResponse } from '../types';

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return response.data;
}

/**
 * Register a new user
 * HU-001: Registro de Usuario
 */
export async function register(data: RegisterRequest): Promise<{ user: any }> {
  const response = await api.post<ApiResponse<{ user: any }>>('/auth/register', data);
  return response.data;
}

/**
 * Logout user
 * HU-004 AC6: Envía access token y refresh token para ser invalidados
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');

    // Enviar refresh token en el body para ser eliminado de la BD
    // El access token se envía automáticamente en el header Authorization por el interceptor
    await api.post('/auth/logout', { refreshToken });

    // Limpiar tokens del localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error) {
    // Incluso si hay error, limpiar los tokens localmente
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    console.error('Logout error:', error);
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data);
  return response.data;
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.post('/auth/change-password', data);
}

/**
 * Request password reset
 * HU-005 AC1, AC2, AC3: Solicita reseteo de contraseña
 */
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

/**
 * Verify password reset token
 * HU-005 AC4: Verifica validez del token
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const response = await api.get<ApiResponse<{ valid: boolean; userId?: string }>>(`/auth/verify-reset-token/${token}`);
  return response.data;
}

/**
 * Reset password with token
 * HU-005 AC4, AC5, AC6, AC7: Resetea contraseña con token válido
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', {
    token,
    newPassword,
    confirmPassword: newPassword,
  });
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(): Promise<void> {
  await api.post('/auth/resend-verification');
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const response = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
  return response.data;
}

const authService = {
  login,
  register,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getCurrentUser,
};

export default authService;
