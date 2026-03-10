/**
 * Training Profile Routes
 * Define los endpoints para gestión de perfiles de entrenamiento
 * CRUD completo y asignación de cursos
 */

import { Router } from 'express';
import { trainingProfileController } from '../controllers/trainingProfile.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/training-profiles
 * Obtener todos los perfiles de entrenamiento
 *
 * Roles permitidos: Todos (público)
 *
 * Response:
 * {
 *   profiles: [
 *     {
 *       id, name, slug, description, icon, color,
 *       usersCount, coursesCount
 *     }
 *   ]
 * }
 */
router.get('/', asyncHandler(trainingProfileController.getAllProfiles.bind(trainingProfileController)));

/**
 * GET /api/training-profiles/slug/:slug
 * Obtener perfil por slug con cursos asignados
 *
 * Roles permitidos: Todos (público)
 *
 * Params:
 * - slug: Slug del perfil
 *
 * Response:
 * {
 *   profile: {
 *     id, name, slug, description, icon, color,
 *     usersCount,
 *     courses: [{ id, slug, title, level, duration, required, order }]
 *   }
 * }
 */
router.get('/slug/:slug', asyncHandler(trainingProfileController.getProfileBySlug.bind(trainingProfileController)));

/**
 * GET /api/training-profiles/:id
 * Obtener perfil por ID con cursos asignados
 *
 * Roles permitidos: Todos (público)
 *
 * Params:
 * - id: ID del perfil
 *
 * Response:
 * {
 *   profile: {
 *     id, name, slug, description, icon, color,
 *     usersCount,
 *     courses: [{ id, slug, title, level, duration, required, order }]
 *   }
 * }
 */
router.get('/:id', asyncHandler(trainingProfileController.getProfileById.bind(trainingProfileController)));

/**
 * POST /api/training-profiles
 * Crear nuevo perfil de entrenamiento
 *
 * Roles permitidos: ADMIN
 *
 * Body:
 * {
 *   "name": "SOC Analyst",
 *   "slug": "soc-analyst",
 *   "description": "Perfil para analistas de seguridad...",
 *   "icon": "shield",
 *   "color": "#3B82F6"
 * }
 *
 * Response:
 * {
 *   profile: { id, name, slug, description, icon, color }
 * }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(trainingProfileController.createProfile.bind(trainingProfileController))
);

/**
 * PUT /api/training-profiles/:id
 * Actualizar perfil de entrenamiento
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - id: ID del perfil
 *
 * Body (todos opcionales):
 * {
 *   "name": "SOC Analyst",
 *   "slug": "soc-analyst",
 *   "description": "Perfil actualizado...",
 *   "icon": "shield",
 *   "color": "#3B82F6"
 * }
 *
 * Response:
 * {
 *   profile: { id, name, slug, description, icon, color }
 * }
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(trainingProfileController.updateProfile.bind(trainingProfileController))
);

/**
 * DELETE /api/training-profiles/:id
 * Eliminar perfil de entrenamiento
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - id: ID del perfil
 *
 * Response:
 * {
 *   success: true,
 *   message: "Perfil eliminado exitosamente"
 * }
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(trainingProfileController.deleteProfile.bind(trainingProfileController))
);

/**
 * POST /api/training-profiles/:id/courses
 * Asignar cursos a un perfil
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - id: ID del perfil
 *
 * Body:
 * {
 *   "courses": [
 *     { "courseId": "...", "required": true, "order": 1 },
 *     { "courseId": "...", "required": false, "order": 2 }
 *   ]
 * }
 *
 * Response:
 * {
 *   assignments: [
 *     { courseId, profileId, required, order, course: {...} }
 *   ]
 * }
 */
router.post(
  '/:id/courses',
  authenticate,
  requireAdmin,
  asyncHandler(trainingProfileController.assignCourses.bind(trainingProfileController))
);

export default router;
