/**
 * Project Routes
 * Define los endpoints para gestión de proyectos finales
 * HU-027: Entregas de proyectos finales, HU-028: Calificación de proyectos
 */

import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/authenticate';
import { requireInstructor } from '../middleware/authorize';
import { asyncHandler } from '../middleware/errorHandler';
import { storageService } from '../services/storage.service';

const router = Router();

// Configurar multer para subida de archivos de proyectos
const upload = storageService.getProjectStorage();

/**
 * POST /api/projects/:projectId/submit
 * Enviar proyecto con archivos adjuntos
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Body (multipart/form-data):
 * - files: Array de archivos (máx 10 archivos, 10MB cada uno)
 * - repositoryUrl: URL del repositorio (opcional)
 * - description: Descripción del proyecto (opcional)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Proyecto enviado exitosamente",
 *   data: {
 *     submission: {
 *       id, projectId, userId, status: "PENDING",
 *       repositoryUrl, files, description, submittedAt
 *     }
 *   }
 * }
 */
router.post(
  '/:projectId/submit',
  authenticate,
  upload.array('files', 10),
  asyncHandler(projectController.submitProject.bind(projectController))
);

/**
 * GET /api/projects/:projectId/submissions
 * Obtener submissions pendientes de un proyecto (para instructores)
 *
 * Roles permitidos: INSTRUCTOR, ADMIN
 *
 * Response:
 * {
 *   success: true,
 *   message: "Submissions obtenidos exitosamente",
 *   data: {
 *     submissions: [
 *       {
 *         id, user: {...}, project: {...},
 *         status, score, feedback, submittedAt, reviewedAt
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/:projectId/submissions',
  authenticate,
  requireInstructor,
  asyncHandler(projectController.getSubmissions.bind(projectController))
);

/**
 * PUT /api/projects/submissions/:submissionId/grade
 * Calificar un proyecto (solo INSTRUCTOR/ADMIN)
 *
 * Roles permitidos: INSTRUCTOR, ADMIN
 *
 * Body:
 * {
 *   "score": 85,
 *   "feedback": "Excelente trabajo, bien documentado...",
 *   "status": "APPROVED" // o "REJECTED"
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Proyecto calificado exitosamente",
 *   data: {
 *     submission: {
 *       id, status, score, feedback, reviewedBy, reviewedAt, ...
 *     }
 *   }
 * }
 */
router.put(
  '/submissions/:submissionId/grade',
  authenticate,
  requireInstructor,
  asyncHandler(projectController.gradeSubmission.bind(projectController))
);

/**
 * GET /api/projects/my-submissions
 * Obtener submissions del usuario actual
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Query params:
 * - courseId: Filtrar por curso (opcional)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Submissions obtenidos exitosamente",
 *   data: {
 *     submissions: [
 *       { id, project: {...}, status, score, feedback, submittedAt }
 *     ]
 *   }
 * }
 */
router.get(
  '/my-submissions',
  authenticate,
  asyncHandler(projectController.getMySubmissions.bind(projectController))
);

/**
 * GET /api/projects/submissions/:submissionId
 * Obtener detalle de un submission
 *
 * Roles permitidos: Propietario del submission o INSTRUCTOR/ADMIN
 *
 * Response:
 * {
 *   success: true,
 *   message: "Submission obtenido exitosamente",
 *   data: {
 *     submission: {
 *       id, user: {...}, project: {...}, status, score,
 *       feedback, repositoryUrl, files, submittedAt, reviewedAt
 *     }
 *   }
 * }
 */
router.get(
  '/submissions/:submissionId',
  authenticate,
  asyncHandler(projectController.getSubmissionDetail.bind(projectController))
);

export default router;
