/**
 * User types and role definitions
 * Adapted for FastAPI backend (returns `name` instead of firstName/lastName)
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  xp?: number;
  theme?: string;
  locale?: string;
  createdAt?: string;
  lastLoginAt?: string;
  // Legacy snake_case aliases (backend migrated to camelCase)
  created_at?: string;
  last_login_at?: string;
  // Computed for backward compat with components that use firstName/lastName
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserProfile extends User {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  theme?: string;
  locale?: string;
}

export interface UserStats {
  userId: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalProgress: number;
  certificatesEarned: number;
  lastActivity: string;
}
