/**
 * Notification Service
 * Maneja la lógica de negocio para notificaciones in-app
 * Sistema de notificaciones para eventos del sistema
 */

import { prisma } from '../utils/prisma';
import { NotFoundError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

/**
 * Tipos de notificación disponibles
 */
export type NotificationType =
  | 'BADGE_AWARDED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'QUIZ_PASSED'
  | 'LAB_PASSED'
  | 'PROJECT_GRADED'
  | 'COURSE_ASSIGNED';

/**
 * Interfaz para crear notificación
 */
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

/**
 * Notification Service
 * Proporciona operaciones para gestionar notificaciones de usuarios
 */
class NotificationService {
  /**
   * Crear notificación para un usuario
   * @param data - Datos de la notificación
   * @returns Notificación creada
   */
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || null,
      },
    });

    logger.info(`Notificación creada para usuario ${data.userId}: ${data.title}`);

    return notification;
  }

  /**
   * Obtener notificaciones de un usuario
   * @param userId - ID del usuario
   * @param unreadOnly - Si solo se deben obtener las no leídas
   * @param limit - Límite de notificaciones
   * @returns Lista de notificaciones
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50) {
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications;
  }

  /**
   * Obtener conteo de notificaciones no leídas
   * @param userId - ID del usuario
   * @returns Número de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  }

  /**
   * Marcar notificación como leída
   * @param notificationId - ID de la notificación
   * @param userId - ID del usuario (para verificar permisos)
   * @returns Notificación actualizada
   */
  async markAsRead(notificationId: string, userId: string) {
    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para marcar esta notificación como leída');
    }

    if (notification.read) {
      return notification; // Ya está marcada como leída
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    logger.info(`Notificación ${notificationId} marcada como leída por usuario ${userId}`);

    return updated;
  }

  /**
   * Marcar todas las notificaciones como leídas
   * @param userId - ID del usuario
   * @returns Número de notificaciones actualizadas
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    logger.info(`${result.count} notificaciones marcadas como leídas para usuario ${userId}`);

    return result.count;
  }

  /**
   * Eliminar notificación
   * @param notificationId - ID de la notificación
   * @param userId - ID del usuario (para verificar permisos)
   * @returns Confirmación de eliminación
   */
  async deleteNotification(notificationId: string, userId: string) {
    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para eliminar esta notificación');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    logger.info(`Notificación ${notificationId} eliminada por usuario ${userId}`);

    return {
      success: true,
      message: 'Notificación eliminada exitosamente',
    };
  }

  /**
   * Eliminar todas las notificaciones de un usuario
   * @param userId - ID del usuario
   * @returns Número de notificaciones eliminadas
   */
  async deleteAllNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info(`${result.count} notificaciones eliminadas para usuario ${userId}`);

    return result.count;
  }

  /**
   * Notificar asignación de curso por admin
   * @param userId - ID del usuario
   * @param courseTitle - Título del curso
   * @param courseId - ID del curso
   */
  async notifyCourseAssignment(userId: string, courseTitle: string, courseId: string) {
    await this.createNotification({
      userId,
      type: 'COURSE_ASSIGNED',
      title: 'Nuevo curso asignado',
      message: `Se te ha asignado el curso "${courseTitle}"`,
      data: { courseId, courseTitle },
    });
  }

  /**
   * Notificar curso completado
   * @param userId - ID del usuario
   * @param courseTitle - Título del curso
   * @param courseId - ID del curso
   */
  async notifyCourseCompleted(userId: string, courseTitle: string, courseId: string) {
    await this.createNotification({
      userId,
      type: 'COURSE_COMPLETED',
      title: '¡Curso completado!',
      message: `Has completado el curso "${courseTitle}"`,
      data: { courseId, courseTitle },
    });
  }

  /**
   * Notificar certificado emitido
   * @param userId - ID del usuario
   * @param courseTitle - Título del curso
   * @param certificateUrl - URL del certificado
   */
  async notifyCertificateIssued(userId: string, courseTitle: string, certificateUrl: string) {
    await this.createNotification({
      userId,
      type: 'CERTIFICATE_ISSUED',
      title: '¡Certificado disponible!',
      message: `Tu certificado del curso "${courseTitle}" está listo`,
      data: { courseTitle, certificateUrl },
    });
  }

  /**
   * Notificar quiz aprobado
   * @param userId - ID del usuario
   * @param quizTitle - Título del quiz
   * @param score - Puntuación obtenida
   */
  async notifyQuizPassed(userId: string, quizTitle: string, score: number) {
    await this.createNotification({
      userId,
      type: 'QUIZ_PASSED',
      title: '¡Quiz aprobado!',
      message: `Has aprobado "${quizTitle}" con ${score}%`,
      data: { quizTitle, score },
    });
  }

  /**
   * Notificar lab completado
   * @param userId - ID del usuario
   * @param labTitle - Título del lab
   */
  async notifyLabPassed(userId: string, labTitle: string) {
    await this.createNotification({
      userId,
      type: 'LAB_PASSED',
      title: '¡Lab completado!',
      message: `Has completado exitosamente el lab "${labTitle}"`,
      data: { labTitle },
    });
  }

  /**
   * Notificar proyecto calificado
   * @param userId - ID del usuario
   * @param projectTitle - Título del proyecto
   * @param score - Calificación obtenida
   * @param status - Estado del proyecto
   */
  async notifyProjectGraded(
    userId: string,
    projectTitle: string,
    score: number,
    status: string
  ) {
    const statusMessages: Record<string, string> = {
      APPROVED: 'aprobado',
      REJECTED: 'requiere cambios',
    };

    await this.createNotification({
      userId,
      type: 'PROJECT_GRADED',
      title: 'Proyecto calificado',
      message: `Tu proyecto "${projectTitle}" ha sido ${statusMessages[status] || 'evaluado'} - Calificación: ${score}%`,
      data: { projectTitle, score, status },
    });
  }
}

// Exportar instancia singleton
export default new NotificationService();
