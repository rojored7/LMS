/**
 * API client configuration with Axios
 * Includes interceptors for JWT authentication and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_TIMEOUT, STORAGE_KEYS } from '../utils/constants';
import type { ApiError, ApiResponse } from '../types';

/**
 * Create and configure Axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add JWT token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Variable para evitar múltiples llamadas simultáneas a /refresh
 * HU-004 AC5: Refresh token mechanism
 */
let refreshTokenPromise: Promise<string> | null = null;

/**
 * Response interceptor to handle common errors and token refresh
 * HU-004: Implementa renovación automática de tokens cuando expiran
 */
api.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token available, redirect to login
          throw new Error('No refresh token available');
        }

        // Evitar múltiples llamadas simultáneas a /refresh
        // Si ya hay una renovación en progreso, esperar su resultado
        if (!refreshTokenPromise) {
          refreshTokenPromise = (async () => {
            try {
              // Try to refresh the token
              // Usar axios directamente para evitar el interceptor
              const response = await axios.post<ApiResponse<{ accessToken: string }>>(
                `${API_URL}/auth/refresh`,
                { refreshToken },
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );

              const { accessToken } = response.data.data;

              // Update access token in storage
              // Nota: El backend no retorna un nuevo refreshToken en /refresh
              // Solo retorna un nuevo accessToken
              localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

              return accessToken;
            } finally {
              // Limpiar la promise después de completar
              refreshTokenPromise = null;
            }
          })();
        }

        // Esperar el resultado de la renovación
        const newAccessToken = await refreshTokenPromise;

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth data and redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        // Limpiar la promise en caso de error
        refreshTokenPromise = null;

        // Redirect to login page
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const apiError: ApiError = {
      success: false,
      error: {
        code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
        details: error.response?.data?.error?.details,
      },
      timestamp: new Date().toISOString(),
      path: error.config?.url,
    };

    return Promise.reject(apiError);
  }
);

/**
 * Helper function to handle API errors
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return apiError.response?.data?.error?.message || apiError.message || 'An unexpected error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Helper function to check if error is an API error
 */
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
