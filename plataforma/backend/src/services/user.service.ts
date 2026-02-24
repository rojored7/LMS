/**
 * User Service
 * Maneja la lógica de negocio relacionada con gestión de usuarios y roles
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC3: Implementa la lógica de gestión de usuarios por roles
 */

import { prisma } from '../utils/prisma';
import { UserRole } from '../types/auth';
import { NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

/**
 * Interfaz para usuario con información básica
 */
interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
  trainingProfile?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * User Service
 * Proporciona operaciones de gestión de usuarios
 */
export class UserService {
  /**
   * Obtener todos los usuarios (solo ADMIN)
   * AC3: Admin tiene acceso a TODAS las rutas
   *
   * @param requestingUserId - ID del usuario que hace la petición
   * @returns Lista de usuarios con información básica
   * @throws AuthorizationError si el usuario no es ADMIN
   */
  async getAllUsers(requestingUserId: string): Promise<UserInfo[]> {
    // Verificar que el usuario solicitante sea ADMIN
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (!requestingUser || requestingUser.role !== UserRole.ADMIN) {
      logger.warn(
        `Intento no autorizado de listar usuarios - userId: ${requestingUserId}`
      );
      throw new AuthorizationError('Solo administradores pueden ver todos los usuarios');
    }

    // Obtener todos los usuarios con información básica
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        trainingProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`Admin ${requestingUserId} listó ${users.length} usuarios`);

    return users;
  }

  /**
   * Obtener un usuario por ID
   * AC3: Usuarios pueden ver su propio perfil, admins pueden ver cualquiera
   *
   * @param requestingUserId - ID del usuario que hace la petición
   * @param targetUserId - ID del usuario a consultar
   * @returns Información del usuario
   * @throws NotFoundError si el usuario no existe
   * @throws AuthorizationError si no tiene permisos
   */
  async getUserById(requestingUserId: string, targetUserId: string): Promise<UserInfo> {
    // Verificar rol del solicitante
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (!requestingUser) {
      throw new NotFoundError('Usuario solicitante no encontrado');
    }

    // Solo ADMIN puede ver otros usuarios, o el mismo usuario puede verse a sí mismo
    if (requestingUserId !== targetUserId && requestingUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('No tienes permiso para ver este usuario');
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        trainingProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Cambiar rol de un usuario (solo ADMIN)
   * AC3: Admin tiene control sobre roles
   *
   * @param adminId - ID del administrador que hace el cambio
   * @param targetUserId - ID del usuario a modificar
   * @param newRole - Nuevo rol a asignar
   * @returns Usuario actualizado
   * @throws AuthorizationError si el usuario no es ADMIN
   * @throws NotFoundError si el usuario no existe
   */
  async changeUserRole(
    adminId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<UserInfo> {
    // Verificar que el solicitante sea ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, email: true },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      logger.warn(`Intento no autorizado de cambiar rol - userId: ${adminId}`);
      throw new AuthorizationError('Solo administradores pueden cambiar roles');
    }

    // No permitir que un admin se quite a sí mismo el rol de admin
    if (adminId === targetUserId && newRole !== UserRole.ADMIN) {
      logger.warn(`Admin ${adminId} intentó quitarse el rol de administrador`);
      throw new AuthorizationError('No puedes quitarte a ti mismo el rol de administrador');
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Cambiar rol
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        trainingProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    logger.info(
      `Admin ${admin.email} cambió rol de ${targetUser.email} de ${targetUser.role} a ${newRole}`
    );

    return updatedUser;
  }

  /**
   * Eliminar usuario (solo ADMIN)
   * AC3: Admin puede gestionar usuarios
   *
   * @param adminId - ID del administrador
   * @param targetUserId - ID del usuario a eliminar
   * @throws AuthorizationError si el usuario no es ADMIN
   * @throws NotFoundError si el usuario no existe
   */
  async deleteUser(adminId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    // Verificar que el solicitante sea ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, email: true },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      logger.warn(`Intento no autorizado de eliminar usuario - userId: ${adminId}`);
      throw new AuthorizationError('Solo administradores pueden eliminar usuarios');
    }

    // No permitir que un admin se elimine a sí mismo
    if (adminId === targetUserId) {
      logger.warn(`Admin ${adminId} intentó eliminarse a sí mismo`);
      throw new AuthorizationError('No puedes eliminarte a ti mismo');
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true },
    });

    if (!targetUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Eliminar usuario (Prisma eliminará en cascada las relaciones)
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    logger.info(`Admin ${admin.email} eliminó usuario ${targetUser.email}`);

    return { success: true, message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Obtener estadísticas de roles
   * AC3: Admin puede ver estadísticas del sistema
   *
   * @param adminId - ID del administrador
   * @returns Estadísticas de usuarios por rol
   * @throws AuthorizationError si el usuario no es ADMIN
   */
  async getRoleStats(adminId: string): Promise<{
    total: number;
    byRole: {
      ADMIN: number;
      INSTRUCTOR: number;
      STUDENT: number;
    };
  }> {
    // Verificar que el solicitante sea ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Solo administradores pueden ver estadísticas');
    }

    // Contar usuarios por rol
    const [total, adminCount, instructorCount, studentCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { role: UserRole.INSTRUCTOR } }),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
    ]);

    return {
      total,
      byRole: {
        ADMIN: adminCount,
        INSTRUCTOR: instructorCount,
        STUDENT: studentCount,
      },
    };
  }
}

// Exportar instancia singleton del servicio
export const userService = new UserService();
