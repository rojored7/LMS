/**
 * Progress Controller
 * Maneja las solicitudes HTTP relacionadas con el progreso del usuario
 * HU-015: Seguimiento de progreso por módulo
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import progressService from '../services/progress.service';
import badgeService from '../services/badge.service';
import notificationService from '../services/notification.service';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Schema de validación para completar quiz
 */
const completeQuizSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
});

/**
 * Progress Controller
 * Proporciona endpoints para seguimiento de progreso del usuario
 */
export class ProgressController {
  /**
   * POST /api/progress/lesson/:lessonId/complete
   * Marcar lección como completada
   */
  async completeLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const userId = req.user!.userId;

    // Obtener lección y módulo
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    // Verificar enrollment en el curso
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    // Crear o actualizar progreso
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_moduleId_lessonId: {
          userId,
          moduleId: lesson.moduleId,
          lessonId,
        },
      },
      update: {
        completed: true,
        lastAccess: new Date(),
      },
      create: {
        userId,
        moduleId: lesson.moduleId,
        lessonId,
        completed: true,
        lastAccess: new Date(),
      },
    });

    // Otorgar 10 XP por completar lección
    const xpResult = await badgeService.awardXP(userId, 10);

    // Calcular progreso del módulo
    const moduleProgress = await progressService.getModuleProgress(userId, lesson.moduleId);

    // Si módulo completo (100%), otorgar badge
    if (moduleProgress === 100) {
      await badgeService.checkAndAwardModuleBadge(userId, lesson.moduleId);

      // Crear notificación de módulo completado
      await notificationService.createNotification({
        userId,
        type: 'COURSE_COMPLETED',
        title: '¡Módulo completado!',
        message: `Has completado el módulo "${lesson.module.title}"`,
        data: { moduleId: lesson.moduleId, moduleTitle: lesson.module.title },
      });
    }

    // Actualizar progreso del enrollment
    await progressService.updateEnrollmentProgress(userId, lesson.module.courseId);

    res.status(200).json({
      success: true,
      message: 'Lección completada exitosamente',
      data: {
        progress,
        moduleProgress,
        xpGained: 10,
      },
    });
  }

  /**
   * POST /api/progress/quiz/:quizId/complete
   * Marcar quiz como completado
   */
  async completeQuiz(req: Request, res: Response): Promise<void> {
    const { quizId } = req.params;
    const userId = req.user!.userId;

    // Validar datos
    const { score, passed } = completeQuizSchema.parse(req.body);

    // Obtener quiz y módulo
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundError('Quiz no encontrado');
    }

    // Verificar enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    // Registrar intento del quiz
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        passed,
      },
    });

    let xpGained = 0;

    // Si pasó el quiz, otorgar XP
    if (passed) {
      xpGained = 20;
      await badgeService.awardXP(userId, xpGained);

      // Crear notificación
      await notificationService.notifyQuizPassed(userId, quiz.title, score);
    }

    // Calcular progreso del módulo
    const moduleProgress = await progressService.getModuleProgress(userId, quiz.moduleId);

    // Si módulo completo, otorgar badge
    if (moduleProgress === 100) {
      await badgeService.checkAndAwardModuleBadge(userId, quiz.moduleId);
    }

    // Actualizar progreso del enrollment
    await progressService.updateEnrollmentProgress(userId, quiz.module.courseId);

    res.status(200).json({
      success: true,
      message: passed ? 'Quiz aprobado exitosamente' : 'Quiz completado',
      data: {
        attempt,
        moduleProgress,
        xpGained,
        passed,
      },
    });
  }

  /**
   * POST /api/progress/lab/:labId/complete
   * Marcar lab como completado
   */
  async completeLab(req: Request, res: Response): Promise<void> {
    const { labId } = req.params;
    const userId = req.user!.userId;

    // Obtener lab y módulo
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!lab) {
      throw new NotFoundError('Lab no encontrado');
    }

    // Verificar enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lab.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    // Verificar si ya completó el lab
    const existingSubmission = await prisma.labSubmission.findFirst({
      where: {
        userId,
        labId,
        passed: true,
      },
    });

    if (existingSubmission) {
      res.status(200).json({
        success: true,
        message: 'Lab ya completado anteriormente',
        data: {
          submission: existingSubmission,
          alreadyCompleted: true,
          xpGained: 0,
        },
      });
      return;
    }

    // Crear submission del lab
    const submission = await prisma.labSubmission.create({
      data: {
        userId,
        labId,
        passed: true,
      },
    });

    // Otorgar 50 XP por completar lab
    const xpGained = 50;
    await badgeService.awardXP(userId, xpGained);

    // Crear notificación
    await notificationService.notifyLabPassed(userId, lab.title);

    // Calcular progreso del módulo
    const moduleProgress = await progressService.getModuleProgress(userId, lab.moduleId);

    // Si módulo completo, otorgar badge
    if (moduleProgress === 100) {
      await badgeService.checkAndAwardModuleBadge(userId, lab.moduleId);
    }

    // Actualizar progreso del enrollment
    await progressService.updateEnrollmentProgress(userId, lab.module.courseId);

    res.status(200).json({
      success: true,
      message: 'Lab completado exitosamente',
      data: {
        submission,
        moduleProgress,
        xpGained,
        alreadyCompleted: false,
      },
    });
  }

  /**
   * GET /api/progress/course/:courseId
   * Obtener progreso detallado del usuario en un curso
   */
  async getUserProgress(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    // Verificar que el curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Verificar enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    // Obtener progreso detallado
    const detailedProgress = await progressService.getDetailedCourseProgress(userId, courseId);

    res.status(200).json({
      success: true,
      message: 'Progreso obtenido exitosamente',
      data: {
        courseId,
        courseTitle: course.title,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        ...detailedProgress,
      },
    });
  }

  /**
   * GET /api/progress/module/:moduleId
   * Obtener progreso del usuario en un módulo específico
   */
  async getModuleProgress(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const userId = req.user!.userId;

    // Verificar que el módulo existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundError('Módulo no encontrado');
    }

    // Verificar enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    // Obtener progreso del módulo
    const progress = await progressService.getModuleProgress(userId, moduleId);

    res.status(200).json({
      success: true,
      message: 'Progreso del módulo obtenido exitosamente',
      data: {
        moduleId,
        moduleTitle: module.title,
        courseId: module.courseId,
        courseTitle: module.course.title,
        progress,
      },
    });
  }
}

// Exportar instancia singleton del controlador
export const progressController = new ProgressController();
