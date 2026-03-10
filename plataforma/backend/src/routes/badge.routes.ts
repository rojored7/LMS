/**
 * Badge Routes
 * Define los endpoints para gestión de badges y gamificación
 * HU-029: Sistema de badges y logros
 */

import { Router } from 'express';
import { badgeController } from '../controllers/badge.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * IMPORTANTE: Rutas específicas ANTES de rutas con parámetros
 */

/**
 * GET /api/badges
 * Obtener todos los badges disponibles (público para mostrar catálogo)
 *
 * Roles permitidos: Público (sin autenticación)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badges obtenidos exitosamente",
 *   data: {
 *     badges: [
 *       {
 *         id, name, slug, description, icon, color,
 *         xpReward, usersCount, createdAt
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/',
  asyncHandler(badgeController.getAllBadges.bind(badgeController))
);

/**
 * GET /api/badges/my-badges
 * Obtener badges del usuario actual
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badges del usuario obtenidos exitosamente",
 *   data: {
 *     badges: [
 *       {
 *         id, userId, badgeId, awardedAt,
 *         badge: { id, name, slug, description, icon, color, xpReward }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/my-badges',
  authenticate,
  asyncHandler(badgeController.getMyBadges.bind(badgeController))
);

/**
 * GET /api/badges/users/:userId/badges
 * Obtener badges de un usuario específico (público para perfiles)
 *
 * Roles permitidos: Público (sin autenticación)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badges del usuario obtenidos exitosamente",
 *   data: {
 *     badges: [
 *       {
 *         id, userId, badgeId, awardedAt,
 *         badge: { id, name, slug, description, icon, color, xpReward }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/users/:userId/badges',
  asyncHandler(badgeController.getUserBadges.bind(badgeController))
);

/**
 * GET /api/badges/:badgeId
 * Obtener badge por ID
 *
 * Roles permitidos: Público (sin autenticación)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badge obtenido exitosamente",
 *   data: {
 *     badge: { id, name, slug, description, icon, color, xpReward, usersCount }
 *   }
 * }
 */
router.get(
  '/:badgeId',
  asyncHandler(badgeController.getBadgeById.bind(badgeController))
);

/**
 * POST /api/badges (ADMIN only)
 * Crear nuevo badge
 *
 * Roles permitidos: ADMIN
 *
 * Body:
 * {
 *   "name": "Maestro de Módulo 1",
 *   "slug": "modulo-1-completado",
 *   "description": "Completaste el módulo 1 con éxito",
 *   "icon": "shield",
 *   "color": "#3B82F6",
 *   "xpReward": 100
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badge creado exitosamente",
 *   data: {
 *     badge: { id, name, slug, description, icon, color, xpReward }
 *   }
 * }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(badgeController.createBadge.bind(badgeController))
);

/**
 * DELETE /api/badges/:badgeId (ADMIN only)
 * Eliminar badge
 *
 * Roles permitidos: ADMIN
 *
 * Response:
 * {
 *   success: true,
 *   message: "Badge 'Maestro de Módulo 1' eliminado exitosamente",
 *   data: null
 * }
 */
router.delete(
  '/:badgeId',
  authenticate,
  requireAdmin,
  asyncHandler(badgeController.deleteBadge.bind(badgeController))
);

export default router;
