/**
 * TypeScript Decorators for Role-Based Access Control
 * Provides decorators to mark methods with required roles
 *
 * HU-003: Sistema de Roles (RBAC)
 *
 * Note: Para usar decoradores en TypeScript, asegúrate de tener en tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "experimentalDecorators": true,
 *     "emitDecoratorMetadata": true
 *   }
 * }
 */

import 'reflect-metadata';
import { UserRole } from '../types/auth';

/**
 * Metadata key para almacenar roles requeridos en un endpoint
 */
export const ROLES_KEY = 'roles';

/**
 * Metadata key para almacenar permisos requeridos
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para marcar qué roles pueden acceder a un método
 * Almacena los roles requeridos como metadata que puede ser leída por middleware
 *
 * @param roles - Array de roles que pueden acceder al método
 *
 * @example
 * ```typescript
 * class UserController {
 *   @RequireRoles([UserRole.ADMIN])
 *   async deleteUser(req: Request, res: Response) {
 *     // Solo ADMIN puede ejecutar este método
 *   }
 *
 *   @RequireRoles([UserRole.ADMIN, UserRole.INSTRUCTOR])
 *   async gradeStudent(req: Request, res: Response) {
 *     // ADMIN o INSTRUCTOR pueden ejecutar este método
 *   }
 * }
 * ```
 */
export function RequireRoles(roles: UserRole[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Almacenar los roles requeridos como metadata
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
    return descriptor;
  };
}

/**
 * Decorador específico para métodos que solo ADMIN puede ejecutar
 *
 * @example
 * ```typescript
 * class UserController {
 *   @AdminOnly
 *   async getAllUsers(req: Request, res: Response) {
 *     // Solo ADMIN puede ejecutar este método
 *   }
 * }
 * ```
 */
export function AdminOnly(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return RequireRoles([UserRole.ADMIN])(target, propertyKey, descriptor);
}

/**
 * Decorador para métodos que ADMIN o INSTRUCTOR pueden ejecutar
 *
 * @example
 * ```typescript
 * class CourseController {
 *   @InstructorAccess
 *   async manageCourse(req: Request, res: Response) {
 *     // ADMIN o INSTRUCTOR pueden ejecutar este método
 *   }
 * }
 * ```
 */
export function InstructorAccess(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return RequireRoles([UserRole.ADMIN, UserRole.INSTRUCTOR])(target, propertyKey, descriptor);
}

/**
 * Lee los roles requeridos de un método decorado
 *
 * @param target - Función decorada
 * @returns Array de roles requeridos o undefined si no hay metadata
 *
 * @example
 * ```typescript
 * const roles = getRolesFromMetadata(controller.deleteUser);
 * // roles = [UserRole.ADMIN]
 * ```
 */
export function getRolesFromMetadata(target: any): UserRole[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, target);
}

/**
 * Decorador para documentar permisos específicos (para futuras extensiones)
 * Útil para sistemas de permisos más granulares que roles
 *
 * @param permissions - Array de permisos requeridos
 *
 * @example
 * ```typescript
 * class UserController {
 *   @RequirePermissions(['user:delete', 'user:manage'])
 *   async deleteUser(req: Request, res: Response) {
 *     // Requiere permisos específicos
 *   }
 * }
 * ```
 */
export function RequirePermissions(permissions: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
    return descriptor;
  };
}

/**
 * Lee los permisos requeridos de un método decorado
 *
 * @param target - Función decorada
 * @returns Array de permisos requeridos o undefined si no hay metadata
 */
export function getPermissionsFromMetadata(target: any): string[] | undefined {
  return Reflect.getMetadata(PERMISSIONS_KEY, target);
}

/**
 * Decorador de clase para marcar un controlador con roles por defecto
 * Aplica roles a todos los métodos del controlador a menos que se sobrescriban
 *
 * @param roles - Roles por defecto para todos los métodos
 *
 * @example
 * ```typescript
 * @ControllerRoles([UserRole.ADMIN])
 * class AdminController {
 *   // Todos los métodos requieren ADMIN por defecto
 *   async method1() {}
 *   async method2() {}
 * }
 * ```
 */
export function ControllerRoles(roles: UserRole[]) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Almacenar roles como metadata de la clase
    Reflect.defineMetadata(ROLES_KEY, roles, constructor);
    return constructor;
  };
}

/**
 * Lee los roles de un controlador (clase)
 *
 * @param target - Clase del controlador
 * @returns Array de roles requeridos o undefined si no hay metadata
 */
export function getControllerRoles(target: any): UserRole[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, target);
}
