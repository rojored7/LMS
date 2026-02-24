/**
 * Protected Route component
 * Restricts access based on authentication and user role
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC3: Rutas frontend protegidas por rol
 * AC6: Redirección a página 403 cuando no tiene permisos
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ROUTES } from '../../utils/constants';
import { Loader } from '../common/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
}

/**
 * ProtectedRoute Component
 * Protege rutas según autenticación y roles del usuario
 *
 * @example
 * ```tsx
 * // Solo usuarios autenticados
 * <ProtectedRoute>
 *   <ProfilePage />
 * </ProtectedRoute>
 *
 * // Solo ADMIN
 * <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * // ADMIN o INSTRUCTOR
 * <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
 *   <InstructorPanel />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true,
}) => {
  const { isAuthenticated, user, isLoading, hasAnyRole } = useAuth();
  const location = useLocation();

  // AC3: Mostrar loader mientras se verifica autenticación
  if (isLoading) {
    return <Loader fullScreen text="Verificando autenticación..." />;
  }

  // AC3: Redirigir a login si se requiere autenticación y el usuario no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // AC3, AC6: Verificar si el usuario tiene el rol requerido
  if (requiredRoles.length > 0 && isAuthenticated) {
    const hasRequiredRole = hasAnyRole(requiredRoles);

    if (!hasRequiredRole) {
      // AC6: Redirigir a página 403 (Forbidden) cuando no tiene permisos
      return <Navigate to={ROUTES.FORBIDDEN} state={{ from: location }} replace />;
    }
  }

  // Usuario autenticado y con rol requerido
  return <>{children}</>;
};
