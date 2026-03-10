/**
 * Notification Routes
 * Define los endpoints para gestión de notificaciones
 * HU-035: Sistema de notificaciones in-app
 */

import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * IMPORTANTE: Rutas específicas ANTES de rutas genéricas con parámetros
 */

/**
 * GET /api/notifications/unread-count
 * Obtener conteo de notificaciones no leídas
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Conteo obtenido exitosamente",
 *   data: { unreadCount: 5 }
 * }
 */
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(notificationController.getUnreadCount.bind(notificationController))
);

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario actual
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Query params:
 * - unreadOnly: "true" para obtener solo no leídas (opcional)
 * - limit: Número máximo de notificaciones (default: 50)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Notificaciones obtenidas exitosamente",
 *   data: {
 *     notifications: [
 *       {
 *         id, type, title, message, data,
 *         read, createdAt
 *       }
 *     ],
 *     unreadCount: 5
 *   }
 * }
 */
router.get(
  '/',
  authenticate,
  asyncHandler(notificationController.getNotifications.bind(notificationController))
);

/**
 * PUT /api/notifications/:notificationId/read
 * Marcar notificación como leída
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Notificación marcada como leída",
 *   data: {
 *     notification: { id, read: true, ... }
 *   }
 * }
 */
router.put(
  '/:notificationId/read',
  authenticate,
  asyncHandler(notificationController.markAsRead.bind(notificationController))
);

/**
 * PUT /api/notifications/mark-all-read
 * Marcar todas las notificaciones como leídas
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "5 notificaciones marcadas como leídas",
 *   data: { count: 5 }
 * }
 */
router.put(
  '/mark-all-read',
  authenticate,
  asyncHandler(notificationController.markAllAsRead.bind(notificationController))
);

/**
 * DELETE /api/notifications/:notificationId
 * Eliminar notificación
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Notificación eliminada exitosamente",
 *   data: null
 * }
 */
router.delete(
  '/:notificationId',
  authenticate,
  asyncHandler(notificationController.deleteNotification.bind(notificationController))
);

/**
 * DELETE /api/notifications
 * Eliminar todas las notificaciones del usuario
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "10 notificaciones eliminadas",
 *   data: { count: 10 }
 * }
 */
router.delete(
  '/',
  authenticate,
  asyncHandler(notificationController.deleteAllNotifications.bind(notificationController))
);

export default router;
