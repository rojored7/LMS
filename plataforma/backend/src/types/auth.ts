/**
 * Authentication and Authorization Types
 * Define types related to authentication and user authorization
 */

import { UserRole } from '@prisma/client';

/**
 * Export UserRole enum from Prisma for convenience
 */
export { UserRole };

/**
 * Authenticated user information
 * This interface represents the user data attached to the request after authentication
 */
export interface AuthenticatedUser {
  id: string; // ID del usuario (alias de userId para compatibilidad)
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  trainingProfileId?: string | null;
}

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  trainingProfileId?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Token pair response
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Auth response with user data and tokens
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string | null;
    trainingProfileId?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
