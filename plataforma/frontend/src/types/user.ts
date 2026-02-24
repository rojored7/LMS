/**
 * User types and role definitions
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  enrolledCourses?: string[]; // Course IDs
  isActive: boolean;
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
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserStats {
  userId: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalProgress: number;
  certificatesEarned: number;
  lastActivity: string;
}
