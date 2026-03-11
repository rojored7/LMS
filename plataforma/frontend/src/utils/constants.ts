/**
 * Application constants
 */

import { UserRole } from '../types';

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Storage Keys
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_KEY_PREFIX || 'curso_ciber_';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: `${STORAGE_PREFIX}access_token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
  USER: `${STORAGE_PREFIX}user`,
  THEME: `${STORAGE_PREFIX}theme`,
  LANGUAGE: `${STORAGE_PREFIX}language`,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '10');
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// Roles
export const ROLES = {
  STUDENT: UserRole.STUDENT,
  INSTRUCTOR: UserRole.INSTRUCTOR,
  ADMIN: UserRole.ADMIN,
} as const;

// Role Display Names
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Estudiante',
  [UserRole.INSTRUCTOR]: 'Instructor',
  [UserRole.ADMIN]: 'Administrador',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password', // HU-005: Recuperación de contraseña
  RESET_PASSWORD: '/reset-password', // HU-005: Reseteo de contraseña
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:id',
  ADMIN: '/admin',
  FORBIDDEN: '/403', // HU-003: Página de acceso denegado
  NOT_FOUND: '/404',
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

// Course Levels
export const COURSE_LEVEL_LABELS = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  EXPERT: 'Experto',
} as const;

// Course Levels Colors
export const COURSE_LEVEL_COLORS = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-orange-100 text-orange-800',
  EXPERT: 'bg-red-100 text-red-800',
} as const;

// Toast Duration
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// JWT Refresh
export const JWT_REFRESH_THRESHOLD = parseInt(import.meta.env.VITE_JWT_REFRESH_THRESHOLD || '300000'); // 5 minutes before expiry
