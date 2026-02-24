/**
 * useAuth hook
 * Provides authentication functionality using the auth store
 */

import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  } = useAuthStore();

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  /**
   * Check if user is an instructor
   */
  const isInstructor = (): boolean => {
    return hasRole(UserRole.INSTRUCTOR);
  };

  /**
   * Check if user is a student
   */
  const isStudent = (): boolean => {
    return hasRole(UserRole.STUDENT);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isInstructor,
    isStudent,
  };
}
