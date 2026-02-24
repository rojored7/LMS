/**
 * User Controller
 * Maneja las solicitudes HTTP relacionadas con gestión de usuarios
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC3: Implementa endpoints protegidos por rol
 */

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { z } from 'zod';
import { UserRole } from '../types/auth';

/**
 * Schema de validación para cambio de rol
 */
const changeRoleSchema = z.object({
  userId: z.string().cuid('ID de usuario inválido'),
  newRole: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Rol inválido. Debe ser ADMIN, INSTRUCTOR o STUDENT' }),
  }),
});

/**
 * User Controller
 * Proporciona endpoints para gestión de usuarios (solo ADMIN)
 */
export class UserController {
  /**
   * GET /api/users
   * Obtener todos los usuarios (solo ADMIN)
   * AC3: Admin tiene acceso a TODAS las rutas
   *
   * @param req - Request con usuario autenticado
   * @param res - Response con lista de usuarios
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    // El middleware authorize ya verificó que sea ADMIN
    const users = await userService.getAllUsers(req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users,
        total: users.length,
      },
    });
  }

  /**
   * GET /api/users/:userId
   * Obtener un usuario por ID
   * AC3: Admin puede ver cualquier usuario, usuarios pueden ver su propio perfil
   *
   * @param req - Request con userId en params
   * @param res - Response con datos del usuario
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
      return;
    }

    const user = await userService.getUserById(req.user!.userId, userId);

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: { user },
    });
  }

  /**
   * PUT /api/users/role
   * Cambiar rol de un usuario (solo ADMIN)
   * AC3: Admin puede cambiar roles
   *
   * @param req - Request con userId y newRole en body
   * @param res - Response con usuario actualizado
   */
  async changeUserRole(req: Request, res: Response): Promise<void> {
    // Validar datos
    const { userId, newRole } = changeRoleSchema.parse(req.body);

    // Cambiar rol
    const updatedUser = await userService.changeUserRole(
      req.user!.userId,
      userId,
      newRole
    );

    res.status(200).json({
      success: true,
      message: `Rol actualizado exitosamente a ${newRole}`,
      data: { user: updatedUser },
    });
  }

  /**
   * DELETE /api/users/:userId
   * Eliminar usuario (solo ADMIN)
   * AC3: Admin puede gestionar usuarios
   *
   * @param req - Request con userId en params
   * @param res - Response con confirmación
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
      return;
    }

    const result = await userService.deleteUser(req.user!.userId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  /**
   * GET /api/users/stats/roles
   * Obtener estadísticas de roles (solo ADMIN)
   * AC3: Admin puede ver estadísticas del sistema
   *
   * @param req - Request con usuario autenticado
   * @param res - Response con estadísticas
   */
  async getRoleStats(req: Request, res: Response): Promise<void> {
    const stats = await userService.getRoleStats(req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats,
    });
  }

  /**
   * GET /api/users/me
   * Obtener perfil del usuario autenticado
   * AC3: Cualquier usuario autenticado puede ver su propio perfil
   *
   * @param req - Request con usuario autenticado
   * @param res - Response con datos del usuario
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    const user = await userService.getUserById(req.user!.userId, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: { user },
    });
  }
}

// Exportar instancia singleton del controlador
export const userController = new UserController();
