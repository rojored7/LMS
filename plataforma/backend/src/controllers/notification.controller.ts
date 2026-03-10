/**
 * Notification Controller
 * Maneja las solicitudes HTTP relacionadas con notificaciones
 * HU-035: Sistema de notificaciones in-app
 */

import { Request, Response } from 'express';
import notificationService from '../services/notification.service';

/**
 * Notification Controller
 * Proporciona endpoints para gestión de notificaciones del usuario
 */
export class NotificationController {
  /**
   * GET /api/notifications
   * Obtener notificaciones del usuario actual
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { unreadOnly, limit } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      unreadOnly === 'true',
      limit ? parseInt(limit as string, 10) : 50
    );

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      data: {
        notifications,
        unreadCount,
      },
    });
  }

  /**
   * GET /api/notifications/unread-count
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Conteo obtenido exitosamente',
      data: { unreadCount },
    });
  }

  /**
   * PUT /api/notifications/:notificationId/read
   * Marcar notificación como leída
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída',
      data: { notification },
    });
  }

  /**
   * PUT /api/notifications/mark-all-read
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${count} notificaciones marcadas como leídas`,
      data: { count },
    });
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Eliminar notificación
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const result = await notificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  /**
   * DELETE /api/notifications
   * Eliminar todas las notificaciones del usuario
   */
  async deleteAllNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const count = await notificationService.deleteAllNotifications(userId);

    res.status(200).json({
      success: true,
      message: `${count} notificaciones eliminadas`,
      data: { count },
    });
  }
}

// Exportar instancia singleton del controlador
export const notificationController = new NotificationController();
