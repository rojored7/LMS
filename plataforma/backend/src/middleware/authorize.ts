/**
 * Authorization Middleware
 * Verifica que el usuario autenticado tenga los roles necesarios para acceder a un recurso
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC2: Middleware de autorización que verifica rol extraído del JWT
 * AC3: Rutas backend protegidas correctamente por rol
 */

import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, AuthenticationError } from './errorHandler';
import { UserRole } from '../types/auth';

/**
 * Middleware de autorización por roles
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 *
 * @param allowedRoles - Array de roles que tienen permiso para acceder
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Solo ADMIN puede acceder
 * router.get('/admin/users', authorize([UserRole.ADMIN]), getUsersController);
 *
 * // ADMIN o INSTRUCTOR pueden acceder
 * router.post('/grade', authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]), gradeController);
 *
 * // Cualquier usuario autenticado puede acceder
 * router.get('/profile', authorize([UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT]), profileController);
 * ```
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // AC2: Verificar que el usuario esté autenticado
    // El usuario debe estar adjunto al request por el middleware de autenticación
    if (!req.user) {
      throw new AuthenticationError('No autenticado. Se requiere iniciar sesión.');
    }

    // AC3: Verificar que el rol del usuario esté en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
      );
    }

    // Usuario autorizado, continuar con la siguiente middleware/controller
    next();
  };
}

/**
 * Middleware específico para solo ADMIN
 * Atajo para authorize([UserRole.ADMIN])
 *
 * @example
 * ```typescript
 * router.get('/admin/users', requireAdmin, getUsersController);
 * router.delete('/admin/users/:id', requireAdmin, deleteUserController);
 * ```
 */
export const requireAdmin = authorize([UserRole.ADMIN]);

/**
 * Middleware para ADMIN o INSTRUCTOR
 * Permite acceso a funcionalidades de gestión educativa
 *
 * @example
 * ```typescript
 * router.get('/instructor/students', requireInstructor, getStudentsController);
 * router.post('/instructor/grade', requireInstructor, gradeController);
 * ```
 */
export const requireInstructor = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]);

/**
 * Middleware para cualquier usuario autenticado
 * Permite acceso a todos los roles (ADMIN, INSTRUCTOR, STUDENT)
 *
 * @example
 * ```typescript
 * router.get('/profile', requireAuth, getProfileController);
 * router.get('/courses', requireAuth, getCoursesController);
 * ```
 */
export const requireAuth = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT]);

/**
 * Verifica si un usuario tiene un rol específico
 * Función helper para usar en lógica de negocio
 *
 * @param user - Usuario autenticado
 * @param role - Rol a verificar
 * @returns true si el usuario tiene el rol
 */
export function hasRole(user: { role: UserRole } | undefined, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Verifica si un usuario tiene alguno de los roles especificados
 * Función helper para usar en lógica de negocio
 *
 * @param user - Usuario autenticado
 * @param roles - Array de roles a verificar
 * @returns true si el usuario tiene alguno de los roles
 */
export function hasAnyRole(user: { role: UserRole } | undefined, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Verifica si un usuario es administrador
 * Función helper para usar en lógica de negocio
 *
 * @param user - Usuario autenticado
 * @returns true si el usuario es ADMIN
 */
export function isAdmin(user: { role: UserRole } | undefined): boolean {
  return hasRole(user, UserRole.ADMIN);
}

/**
 * Verifica si un usuario es instructor o admin
 * Función helper para usar en lógica de negocio
 *
 * @param user - Usuario autenticado
 * @returns true si el usuario es INSTRUCTOR o ADMIN
 */
export function isInstructor(user: { role: UserRole } | undefined): boolean {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.INSTRUCTOR]);
}
