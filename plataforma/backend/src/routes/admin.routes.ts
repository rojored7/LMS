/**
 * Admin Routes
 * Define los endpoints para operaciones administrativas
 * Gestión de enrollments, progreso de usuarios y estadísticas del sistema
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Todas las rutas admin requieren autenticación y rol ADMIN
 * El middleware authenticate verifica el JWT y adjunta req.user
 * El middleware requireAdmin verifica que el usuario sea ADMIN
 */
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Obtener estadísticas del sistema para dashboard admin
 *
 * Roles permitidos: ADMIN
 *
 * Response:
 * {
 *   users: { total, byRole: { ADMIN, INSTRUCTOR, STUDENT } },
 *   courses: { total, published },
 *   enrollments: { total, active, completed },
 *   systemHealth: { averageProgress, activeUsers }
 * }
 */
router.get('/stats', asyncHandler(adminController.getDashboardStats.bind(adminController)));

/**
 * GET /api/admin/enrollments
 * Listar todos los enrollments del sistema con paginación
 *
 * Roles permitidos: ADMIN
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: límite por página (default: 20, max: 100)
 *
 * Response:
 * {
 *   enrollments: [...],
 *   pagination: { total, page, limit, totalPages }
 * }
 */
router.get('/enrollments', asyncHandler(adminController.getAllEnrollments.bind(adminController)));

/**
 * POST /api/admin/enrollments
 * Asignar curso a usuario (como administrador)
 *
 * Roles permitidos: ADMIN
 *
 * Body:
 * {
 *   "userId": "user-id-here",
 *   "courseId": "course-id-or-slug-here"
 * }
 *
 * Response:
 * {
 *   enrollment: {
 *     id, enrolledAt, progress, course: {...}, user: {...}
 *   }
 * }
 */
router.post(
  '/enrollments',
  asyncHandler(adminController.assignCourseToUser.bind(adminController))
);

/**
 * DELETE /api/admin/enrollments/:enrollmentId
 * Retirar curso de usuario (eliminar enrollment)
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - enrollmentId: ID del enrollment a eliminar
 *
 * Response:
 * {
 *   success: true,
 *   message: "Curso retirado exitosamente"
 * }
 */
router.delete(
  '/enrollments/:enrollmentId',
  asyncHandler(adminController.removeEnrollment.bind(adminController))
);

/**
 * GET /api/admin/users/:userId/enrollments
 * Obtener enrollments de un usuario con progreso
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - userId: ID del usuario a consultar
 *
 * Response:
 * {
 *   id, email, name, role, avatar, createdAt,
 *   enrollments: [
 *     { id, enrolledAt, progress, course: {...} }
 *   ]
 * }
 */
router.get(
  '/users/:userId/enrollments',
  asyncHandler(adminController.getUserEnrollments.bind(adminController))
);

/**
 * GET /api/admin/users/:userId/courses/:courseId/progress
 * Obtener progreso detallado de un usuario en un curso específico
 *
 * Roles permitidos: ADMIN
 *
 * Params:
 * - userId: ID del usuario
 * - courseId: ID del curso
 *
 * Response:
 * {
 *   enrollment: { id, enrolledAt, completedAt },
 *   user: { name, email },
 *   course: { title },
 *   progress: {
 *     overallProgress: 75,
 *     modules: [
 *       {
 *         moduleId, moduleTitle, progress,
 *         lessons: { total, completed },
 *         quizzes: { total, passed },
 *         labs: { total, passed }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/users/:userId/courses/:courseId/progress',
  asyncHandler(adminController.getUserCourseProgress.bind(adminController))
);

export default router;
