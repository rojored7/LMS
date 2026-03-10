/**
 * Badge Service
 * Maneja la lógica de negocio para badges y gamificación
 * Sistema de logros y recompensas XP
 */

import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import notificationService from './notification.service';

/**
 * Interfaz para crear badge
 */
export interface CreateBadgeData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  xpReward: number;
}

/**
 * Badge Service
 * Proporciona operaciones CRUD para badges y otorgamiento a usuarios
 */
class BadgeService {
  /**
   * Obtener todos los badges
   * @returns Lista de badges
   */
  async getAllBadges() {
    const badges = await prisma.badge.findMany({
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return badges.map((badge) => ({
      ...badge,
      usersCount: badge._count.userBadges,
    }));
  }

  /**
   * Obtener badge por ID
   * @param badgeId - ID del badge
   * @returns Badge con información completa
   */
  async getBadgeById(badgeId: string) {
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundError('Badge no encontrado');
    }

    return {
      ...badge,
      usersCount: badge._count.userBadges,
    };
  }

  /**
   * Crear badge
   * @param data - Datos del badge
   * @returns Badge creado
   */
  async createBadge(data: CreateBadgeData) {
    // Verificar que el slug no exista
    const existingBadge = await prisma.badge.findUnique({
      where: { slug: data.slug },
    });

    if (existingBadge) {
      throw new ValidationError('Ya existe un badge con ese slug');
    }

    const badge = await prisma.badge.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        xpReward: data.xpReward,
      },
    });

    logger.info(`Badge creado: ${badge.name} (${badge.slug}) - ${badge.xpReward} XP`);

    return badge;
  }

  /**
   * Otorgar badge a usuario
   * @param userId - ID del usuario
   * @param badgeId - ID del badge
   * @returns UserBadge creado con información del badge
   */
  async awardBadgeToUser(userId: string, badgeId: string) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, xp: true },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar que el badge existe
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundError('Badge no encontrado');
    }

    // Verificar si el usuario ya tiene este badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existingUserBadge) {
      logger.warn(`Usuario ${user.email} ya tiene el badge ${badge.name}`);
      return {
        ...existingUserBadge,
        badge,
        alreadyAwarded: true,
      };
    }

    // Crear UserBadge y actualizar XP en transacción
    const [userBadge, updatedUser] = await prisma.$transaction([
      prisma.userBadge.create({
        data: {
          userId,
          badgeId,
        },
        include: {
          badge: true,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: badge.xpReward,
          },
        },
      }),
    ]);

    logger.info(
      `Badge "${badge.name}" otorgado a ${user.email} (+${badge.xpReward} XP, total: ${updatedUser.xp} XP)`
    );

    // Crear notificación
    await notificationService.createNotification({
      userId,
      type: 'BADGE_AWARDED',
      title: '¡Nuevo badge desbloqueado!',
      message: `Has conseguido el badge "${badge.name}". +${badge.xpReward} XP`,
      data: {
        badgeId: badge.id,
        badgeName: badge.name,
        xpReward: badge.xpReward,
      },
    });

    return {
      ...userBadge,
      alreadyAwarded: false,
    };
  }

  /**
   * Obtener badges de un usuario
   * @param userId - ID del usuario
   * @returns Lista de badges del usuario
   */
  async getUserBadges(userId: string) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        awardedAt: 'desc',
      },
    });

    return userBadges;
  }

  /**
   * Otorgar XP a un usuario y verificar subida de nivel
   * @param userId - ID del usuario
   * @param amount - Cantidad de XP a otorgar
   * @returns XP total y nivel actual del usuario
   */
  async awardXP(userId: string, amount: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });

    // Verificar nivel según XP (cada 100 XP = 1 nivel)
    const newLevel = Math.floor(user.xp / 100);
    const oldLevel = Math.floor((user.xp - amount) / 100);

    if (newLevel > oldLevel) {
      // Usuario subió de nivel
      logger.info(`Usuario ${userId} subió al nivel ${newLevel} (${user.xp} XP)`);

      await notificationService.createNotification({
        userId,
        type: 'BADGE_AWARDED',
        title: '¡Subiste de nivel!',
        message: `Alcanzaste el nivel ${newLevel}`,
        data: { level: newLevel, xp: user.xp },
      });
    }

    return { xp: user.xp, level: newLevel };
  }

  /**
   * Verificar y otorgar badges automáticos por completar módulo
   * @param userId - ID del usuario
   * @param moduleId - ID del módulo completado
   */
  async checkAndAwardModuleBadge(userId: string, moduleId: string) {
    // Obtener información del módulo
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        title: true,
        order: true,
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!module) {
      return;
    }

    // Buscar badge asociado al módulo (convención: slug = "modulo-{order}-completado")
    const badgeSlug = `modulo-${module.order}-completado`;
    const badge = await prisma.badge.findUnique({
      where: { slug: badgeSlug },
    });

    if (badge) {
      try {
        await this.awardBadgeToUser(userId, badge.id);
      } catch (error) {
        logger.warn(`Error al otorgar badge de módulo ${module.title}: ${error}`);
      }
    }
  }

  /**
   * Verificar y otorgar badge por completar curso
   * @param userId - ID del usuario
   * @param courseId - ID del curso completado
   */
  async checkAndAwardCourseBadge(userId: string, courseId: string) {
    // Obtener información del curso
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        slug: true,
        title: true,
      },
    });

    if (!course) {
      return;
    }

    // Buscar badge asociado al curso (convención: slug = "curso-{slug}-completado")
    const badgeSlug = `curso-${course.slug}-completado`;
    const badge = await prisma.badge.findUnique({
      where: { slug: badgeSlug },
    });

    if (badge) {
      try {
        await this.awardBadgeToUser(userId, badge.id);
      } catch (error) {
        logger.warn(`Error al otorgar badge de curso ${course.title}: ${error}`);
      }
    }
  }

  /**
   * Eliminar badge
   * @param badgeId - ID del badge
   * @returns Confirmación de eliminación
   */
  async deleteBadge(badgeId: string) {
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundError('Badge no encontrado');
    }

    if (badge._count.userBadges > 0) {
      throw new ValidationError(
        `No se puede eliminar el badge "${badge.name}" porque ${badge._count.userBadges} usuarios lo tienen`
      );
    }

    await prisma.badge.delete({
      where: { id: badgeId },
    });

    logger.info(`Badge eliminado: ${badge.name}`);

    return {
      success: true,
      message: `Badge "${badge.name}" eliminado exitosamente`,
    };
  }
}

// Exportar instancia singleton
export default new BadgeService();
