/**
 * Project Service
 * Maneja la lógica de negocio para proyectos finales
 * Entrega, revisión y calificación de proyectos
 */

import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import notificationService from './notification.service';

/**
 * Interfaz para enviar proyecto
 */
export interface SubmitProjectData {
  projectId: string;
  userId: string;
  repositoryUrl?: string;
  files?: Array<{ name: string; url: string; size: number }>;
  description?: string;
}

/**
 * Interfaz para calificar proyecto
 */
export interface GradeProjectData {
  submissionId: string;
  instructorId: string;
  score: number;
  feedback: string;
  status: 'APPROVED' | 'REJECTED';
}

/**
 * Project Service
 * Proporciona operaciones para gestión de proyectos finales
 */
class ProjectService {
  /**
   * Obtener proyecto por ID
   * @param projectId - ID del proyecto
   * @param userId - ID del usuario (para verificar enrollment)
   * @returns Proyecto con información completa
   */
  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    // Verificar que el usuario está inscrito en el curso
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: project.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ValidationError('No estás inscrito en este curso');
    }

    // Obtener entregas del usuario
    const userSubmissions = await prisma.projectSubmission.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        score: true,
        feedback: true,
        submittedAt: true,
        reviewedAt: true,
      },
    });

    return {
      ...project,
      userSubmissions,
    };
  }

  /**
   * Enviar proyecto
   * @param data - Datos del proyecto
   * @returns Submission creado
   */
  async submitProject(data: SubmitProjectData) {
    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    // Verificar enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: data.userId,
          courseId: project.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ValidationError('No estás inscrito en este curso');
    }

    // Verificar si ya tiene una entrega pendiente
    const pendingSubmission = await prisma.projectSubmission.findFirst({
      where: {
        projectId: data.projectId,
        userId: data.userId,
        status: { in: ['PENDING', 'REVIEWING'] },
      },
    });

    if (pendingSubmission) {
      throw new ValidationError('Ya tienes una entrega en revisión para este proyecto');
    }

    // Crear submission
    const submission = await prisma.projectSubmission.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        repositoryUrl: data.repositoryUrl,
        files: data.files || null,
        description: data.description,
        status: 'PENDING',
      },
      include: {
        project: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(
      `Proyecto "${submission.project.title}" enviado por ${submission.user.email}`
    );

    return submission;
  }

  /**
   * Obtener submissions pendientes de revisión (para instructores)
   * @param instructorId - ID del instructor
   * @param courseId - ID del curso (opcional)
   * @returns Lista de submissions pendientes
   */
  async getPendingSubmissions(instructorId: string, courseId?: string) {
    // Verificar que el usuario es INSTRUCTOR o ADMIN
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
      select: { role: true },
    });

    if (!instructor || !['INSTRUCTOR', 'ADMIN'].includes(instructor.role)) {
      throw new ValidationError('Solo instructores pueden revisar proyectos');
    }

    const where: any = {
      status: { in: ['PENDING', 'REVIEWING'] },
    };

    if (courseId) {
      where.project = {
        courseId,
      };
    }

    const submissions = await prisma.projectSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    return submissions;
  }

  /**
   * Calificar proyecto
   * @param data - Datos de la calificación
   * @returns Submission calificado
   */
  async gradeProject(data: GradeProjectData) {
    // Verificar que el submission existe
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: data.submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError('Entrega de proyecto no encontrada');
    }

    // Verificar que el instructor tiene permisos
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId },
      select: { role: true, name: true },
    });

    if (!instructor || !['INSTRUCTOR', 'ADMIN'].includes(instructor.role)) {
      throw new ValidationError('Solo instructores pueden calificar proyectos');
    }

    // Validar score
    if (data.score < 0 || data.score > 100) {
      throw new ValidationError('La calificación debe estar entre 0 y 100');
    }

    // Actualizar submission
    const updated = await prisma.projectSubmission.update({
      where: { id: data.submissionId },
      data: {
        status: data.status,
        score: data.score,
        feedback: data.feedback,
        reviewedBy: data.instructorId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            title: true,
          },
        },
      },
    });

    logger.info(
      `Proyecto "${updated.project.title}" de ${updated.user.email} calificado: ${data.score}% - ${data.status}`
    );

    // Crear notificación
    await notificationService.notifyProjectGraded(
      submission.user.id,
      submission.project.title,
      data.score,
      data.status
    );

    return updated;
  }

  /**
   * Obtener submissions de un usuario
   * @param userId - ID del usuario
   * @param courseId - ID del curso (opcional)
   * @returns Lista de submissions del usuario
   */
  async getUserSubmissions(userId: string, courseId?: string) {
    const where: any = {
      userId,
    };

    if (courseId) {
      where.project = {
        courseId,
      };
    }

    const submissions = await prisma.projectSubmission.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return submissions;
  }

  /**
   * Obtener detalle de submission
   * @param submissionId - ID del submission
   * @param userId - ID del usuario (para verificar permisos)
   * @returns Submission completo
   */
  async getSubmissionDetail(submissionId: string, userId: string) {
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError('Entrega de proyecto no encontrada');
    }

    // Verificar permisos: debe ser el autor o un instructor/admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (submission.userId !== userId && !['INSTRUCTOR', 'ADMIN'].includes(user?.role || '')) {
      throw new ValidationError('No tienes permiso para ver esta entrega');
    }

    return submission;
  }
}

// Exportar instancia singleton
export default new ProjectService();
