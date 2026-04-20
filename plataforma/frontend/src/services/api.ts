/**
 * API client configuration with Axios
 * Tokens se manejan via HttpOnly cookies (no localStorage)
 * withCredentials: true envia cookies automaticamente en cada request
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_TIMEOUT } from '../utils/constants';
import type { ApiError } from '../types';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Singleton para evitar multiples refresh simultaneos
 */
let refreshTokenPromise: Promise<void> | null = null;

/**
 * Response interceptor: auto-refresh en 401, formato de errores
 */
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = (async () => {
            try {
              // El refresh_token se envia automaticamente como cookie
              // (path=/api/auth/refresh, HttpOnly)
              await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            } finally {
              refreshTokenPromise = null;
            }
          })();
        }

        await refreshTokenPromise;

        // Retry con las nuevas cookies (se envian automaticamente)
        return api(originalRequest);
      } catch {
        refreshTokenPromise = null;
        localStorage.removeItem('auth-storage');
        localStorage.setItem('session-expired', 'true');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const apiError: ApiError = {
      success: false,
      error: {
        code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.error?.message || error.message || 'Error inesperado',
        details: error.response?.data?.error?.details,
      },
      timestamp: new Date().toISOString(),
      path: error.config?.url,
    };

    return Promise.reject(apiError);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return apiError.response?.data?.error?.message || apiError.message || 'Error inesperado';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    error.success === false &&
    'error' in error
  );
}

export default api;
