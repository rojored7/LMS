/**
 * User Routes
 * Define los endpoints relacionados con gestión de usuarios
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC3: Rutas backend protegidas correctamente por rol
 */

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin, requireAuth } from '../middleware/authorize';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Todas las rutas de usuarios requieren autenticación
 * El middleware authenticate verifica el JWT y adjunta req.user
 */
router.use(authenticate);

/**
 * GET /api/users/me
 * Obtener perfil del usuario autenticado
 * AC3: Cualquier usuario autenticado puede ver su propio perfil
 *
 * Roles permitidos: ADMIN, INSTRUCTOR, STUDENT (todos)
 */
router.get('/me', requireAuth, asyncHandler(userController.getMyProfile.bind(userController)));

/**
 * GET /api/users/stats/roles
 * Obtener estadísticas de roles
 * AC3: Solo ADMIN puede ver estadísticas del sistema
 *
 * Roles permitidos: ADMIN
 */
router.get(
  '/stats/roles',
  requireAdmin,
  asyncHandler(userController.getRoleStats.bind(userController))
);

/**
 * GET /api/users
 * Obtener todos los usuarios
 * AC3: Solo ADMIN puede ver todos los usuarios
 *
 * Roles permitidos: ADMIN
 */
router.get('/', requireAdmin, asyncHandler(userController.getAllUsers.bind(userController)));

/**
 * GET /api/users/:userId
 * Obtener un usuario por ID
 * AC3: ADMIN puede ver cualquier usuario, usuarios pueden ver su propio perfil
 *
 * Roles permitidos: ADMIN (cualquier usuario), o el propio usuario
 * Nota: La lógica de verificación está en el service
 */
router.get(
  '/:userId',
  requireAuth,
  asyncHandler(userController.getUserById.bind(userController))
);

/**
 * PUT /api/users/role
 * Cambiar rol de un usuario
 * AC3: Solo ADMIN puede cambiar roles
 *
 * Roles permitidos: ADMIN
 *
 * Body:
 * {
 *   "userId": "user-id-here",
 *   "newRole": "ADMIN" | "INSTRUCTOR" | "STUDENT"
 * }
 */
router.put('/role', requireAdmin, asyncHandler(userController.changeUserRole.bind(userController)));

/**
 * DELETE /api/users/:userId
 * Eliminar usuario
 * AC3: Solo ADMIN puede eliminar usuarios
 *
 * Roles permitidos: ADMIN
 */
router.delete(
  '/:userId',
  requireAdmin,
  asyncHandler(userController.deleteUser.bind(userController))
);

export default router;
