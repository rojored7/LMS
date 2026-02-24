/**
 * Authorized Component
 * Componente para mostrar/ocultar contenido basado en roles del usuario
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC4: Interfaz frontend adaptativa que muestra/oculta elementos según rol
 */

import { ReactNode } from 'react';
import { useAuth } from '../../hooks';
import { UserRole } from '../../types';

/**
 * Props del componente Authorized
 */
interface AuthorizedProps {
  /**
   * Roles que tienen permiso para ver el contenido
   */
  roles: UserRole[];

  /**
   * Contenido a mostrar si el usuario tiene permiso
   */
  children: ReactNode;

  /**
   * Contenido alternativo a mostrar si el usuario no tiene permiso
   * Por defecto: null (no muestra nada)
   */
  fallback?: ReactNode;

  /**
   * Si es true, muestra el fallback cuando el usuario NO autenticado
   * Por defecto: false
   */
  requireAuth?: boolean;
}

/**
 * Componente Authorized
 * Muestra contenido condicionalmente basado en el rol del usuario
 *
 * @example
 * ```tsx
 * // Solo ADMIN puede ver el botón de eliminar
 * <Authorized roles={[UserRole.ADMIN]}>
 *   <Button onClick={handleDelete}>Eliminar Usuario</Button>
 * </Authorized>
 *
 * // ADMIN o INSTRUCTOR pueden ver el panel
 * <Authorized roles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
 *   <InstructorPanel />
 * </Authorized>
 *
 * // Mostrar contenido alternativo si no tiene permiso
 * <Authorized
 *   roles={[UserRole.ADMIN]}
 *   fallback={<p>No tienes permiso para ver esto</p>}
 * >
 *   <AdminContent />
 * </Authorized>
 *
 * // Requiere autenticación
 * <Authorized
 *   roles={[UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT]}
 *   requireAuth={true}
 *   fallback={<p>Debes iniciar sesión</p>}
 * >
 *   <AuthenticatedContent />
 * </Authorized>
 * ```
 */
export function Authorized({
  roles,
  children,
  fallback = null,
  requireAuth = false,
}: AuthorizedProps) {
  const { isAuthenticated, hasAnyRole } = useAuth();

  // Si requireAuth es true, verificar autenticación
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  // Usuario autorizado, mostrar contenido
  return <>{children}</>;
}

/**
 * Componente AdminOnly
 * Atajo para contenido que solo ADMIN puede ver
 *
 * @example
 * ```tsx
 * <AdminOnly>
 *   <Button onClick={handleDeleteUser}>Eliminar Usuario</Button>
 * </AdminOnly>
 * ```
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Authorized roles={[UserRole.ADMIN]} fallback={fallback}>
      {children}
    </Authorized>
  );
}

/**
 * Componente InstructorAccess
 * Atajo para contenido que ADMIN o INSTRUCTOR pueden ver
 *
 * @example
 * ```tsx
 * <InstructorAccess>
 *   <GradingPanel />
 * </InstructorAccess>
 * ```
 */
export function InstructorAccess({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Authorized roles={[UserRole.ADMIN, UserRole.INSTRUCTOR]} fallback={fallback}>
      {children}
    </Authorized>
  );
}

/**
 * Componente StudentOnly
 * Atajo para contenido que solo STUDENT puede ver
 *
 * @example
 * ```tsx
 * <StudentOnly>
 *   <CourseEnrollButton />
 * </StudentOnly>
 * ```
 */
export function StudentOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Authorized roles={[UserRole.STUDENT]} fallback={fallback}>
      {children}
    </Authorized>
  );
}

/**
 * Componente RequireAuth
 * Muestra contenido solo a usuarios autenticados (cualquier rol)
 *
 * @example
 * ```tsx
 * <RequireAuth fallback={<LoginPrompt />}>
 *   <MyProfile />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Authorized
      roles={[UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT]}
      requireAuth={true}
      fallback={fallback}
    >
      {children}
    </Authorized>
  );
}
