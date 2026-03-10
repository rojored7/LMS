/**
 * Progress Routes
 * Define los endpoints para seguimiento de progreso del usuario
 * HU-015: Seguimiento de progreso por módulo
 */

import { Router } from 'express';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/progress/lesson/:lessonId/complete
 * Marcar lección como completada
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Body: No requiere
 *
 * Response:
 * {
 *   success: true,
 *   message: "Lección completada exitosamente",
 *   data: {
 *     progress: {...},
 *     moduleProgress: 50,
 *     xpGained: 10
 *   }
 * }
 */
router.post(
  '/lesson/:lessonId/complete',
  authenticate,
  asyncHandler(progressController.completeLesson.bind(progressController))
);

/**
 * POST /api/progress/quiz/:quizId/complete
 * Marcar quiz como completado
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Body:
 * {
 *   "score": 85,
 *   "passed": true
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Quiz aprobado exitosamente",
 *   data: {
 *     attempt: {...},
 *     moduleProgress: 75,
 *     xpGained: 50,
 *     passed: true
 *   }
 * }
 */
router.post(
  '/quiz/:quizId/complete',
  authenticate,
  asyncHandler(progressController.completeQuiz.bind(progressController))
);

/**
 * POST /api/progress/lab/:labId/complete
 * Marcar lab como completado
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Body: No requiere
 *
 * Response:
 * {
 *   success: true,
 *   message: "Lab completado exitosamente",
 *   data: {
 *     submission: {...},
 *     moduleProgress: 100,
 *     xpGained: 100
 *   }
 * }
 */
router.post(
  '/lab/:labId/complete',
  authenticate,
  asyncHandler(progressController.completeLab.bind(progressController))
);

/**
 * GET /api/progress/course/:courseId
 * Obtener progreso detallado del usuario en un curso
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Progreso obtenido exitosamente",
 *   data: {
 *     courseId: "...",
 *     courseTitle: "Fundamentos de Ciberseguridad",
 *     overallProgress: 65,
 *     modules: [
 *       {
 *         moduleId: "...",
 *         moduleTitle: "Introducción",
 *         progress: 100,
 *         lessons: { total: 5, completed: 5 },
 *         quizzes: { total: 2, passed: 2 },
 *         labs: { total: 1, passed: 1 }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/course/:courseId',
  authenticate,
  asyncHandler(progressController.getUserProgress.bind(progressController))
);

/**
 * GET /api/progress/module/:moduleId
 * Obtener progreso del usuario en un módulo específico
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Progreso del módulo obtenido exitosamente",
 *   data: {
 *     moduleId: "...",
 *     moduleTitle: "Introducción",
 *     courseId: "...",
 *     courseTitle: "Fundamentos de Ciberseguridad",
 *     progress: 100
 *   }
 * }
 */
router.get(
  '/module/:moduleId',
  authenticate,
  asyncHandler(progressController.getModuleProgress.bind(progressController))
);

export default router;
