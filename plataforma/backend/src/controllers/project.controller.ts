/**
 * Project Controller
 * Maneja las solicitudes HTTP relacionadas con proyectos finales
 * HU-027: Entregas de proyectos finales, HU-028: Calificación de proyectos
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import projectService from '../services/project.service';
import { storageService } from '../services/storage.service';

/**
 * Schema de validación para calificar proyecto
 */
const gradeProjectSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(10, 'El feedback debe tener al menos 10 caracteres'),
  status: z.enum(['APPROVED', 'REJECTED']),
});

/**
 * Project Controller
 * Proporciona endpoints para gestión de proyectos finales
 */
export class ProjectController {
  /**
   * POST /api/projects/:projectId/submit
   * Enviar proyecto (con archivos adjuntos)
   */
  async submitProject(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const userId = req.user!.userId;
    const { repositoryUrl, description } = req.body;

    // Procesar archivos subidos (vienen de multer middleware)
    const files = ((req as any).files as any[] | undefined) || [];

    const filesMetadata = files.map((file: any) =>
      storageService.getFileMetadata(file)
    );

    // Enviar proyecto
    const submission = await projectService.submitProject({
      projectId,
      userId,
      repositoryUrl,
      description,
      files: filesMetadata,
    });

    res.status(201).json({
      success: true,
      message: 'Proyecto enviado exitosamente',
      data: { submission },
    });
  }

  /**
   * GET /api/projects/:projectId/submissions
   * Obtener submissions de un proyecto (para instructores)
   */
  async getSubmissions(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const userId = req.user!.userId;

    // El servicio ya verifica que sea instructor/admin
    const submissions = await projectService.getPendingSubmissions(userId, projectId);

    res.status(200).json({
      success: true,
      message: 'Submissions obtenidos exitosamente',
      data: { submissions },
    });
  }

  /**
   * PUT /api/projects/submissions/:submissionId/grade
   * Calificar un proyecto (solo INSTRUCTOR/ADMIN)
   */
  async gradeSubmission(req: Request, res: Response): Promise<void> {
    const { submissionId } = req.params;
    const userId = req.user!.userId;

    // Validar datos
    const { score, feedback, status } = gradeProjectSchema.parse(req.body);

    // Calificar proyecto
    const gradedSubmission = await projectService.gradeProject({
      submissionId,
      instructorId: userId,
      score,
      feedback,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Proyecto calificado exitosamente',
      data: { submission: gradedSubmission },
    });
  }

  /**
   * GET /api/projects/my-submissions
   * Obtener submissions del usuario actual
   */
  async getMySubmissions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { courseId } = req.query;

    const submissions = await projectService.getUserSubmissions(
      userId,
      courseId as string | undefined
    );

    res.status(200).json({
      success: true,
      message: 'Submissions obtenidos exitosamente',
      data: { submissions },
    });
  }

  /**
   * GET /api/projects/submissions/:submissionId
   * Obtener detalle de un submission
   */
  async getSubmissionDetail(req: Request, res: Response): Promise<void> {
    const { submissionId } = req.params;
    const userId = req.user!.userId;

    const submission = await projectService.getSubmissionDetail(submissionId, userId);

    res.status(200).json({
      success: true,
      message: 'Submission obtenido exitosamente',
      data: { submission },
    });
  }
}

// Exportar instancia singleton del controlador
export const projectController = new ProjectController();
