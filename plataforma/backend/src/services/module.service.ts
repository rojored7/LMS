/**
 * Module Service
 * Business logic for course modules
 */

import { prisma } from '../utils/prisma';

class ModuleService {
  /**
   * Get all modules for a course with user progress
   * @param courseId - Course ID
   * @param userId - User ID to calculate progress (optional)
   */
  async getCourseModules(courseId: string, userId?: string) {
    const modules = await prisma.module.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            estimatedTime: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
            attempts: true,
          },
        },
        labs: {
          select: {
            id: true,
            title: true,
            description: true,
            language: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Calculate progress for each module if userId provided
    if (userId) {
      const modulesWithProgress = await Promise.all(
        modules.map(async (module) => {
          const progress = await this.calculateModuleProgress(userId, module.id);

          // Get completion status for lessons
          const lessonIds = module.lessons.map(l => l.id);
          const completedLessonIds = await prisma.userProgress.findMany({
            where: {
              userId,
              moduleId: module.id,
              lessonId: { in: lessonIds },
              completed: true,
            },
            select: { lessonId: true },
          });
          const completedSet = new Set(completedLessonIds.map(l => l.lessonId));

          // Get passed quiz IDs
          const quizIds = module.quizzes.map(q => q.id);
          const passedQuizAttempts = await prisma.quizAttempt.findMany({
            where: {
              userId,
              quizId: { in: quizIds },
              passed: true,
            },
            select: { quizId: true },
            distinct: ['quizId'],
          });
          const passedQuizSet = new Set(passedQuizAttempts.map(q => q.quizId));

          // Get passed lab IDs
          const labIds = module.labs.map(l => l.id);
          const passedLabSubmissions = await prisma.labSubmission.findMany({
            where: {
              userId,
              labId: { in: labIds },
              passed: true,
            },
            select: { labId: true },
            distinct: ['labId'],
          });
          const passedLabSet = new Set(passedLabSubmissions.map(l => l.labId));

          // Add completion status to each item
          const lessonsWithStatus = module.lessons.map(lesson => ({
            ...lesson,
            isCompleted: completedSet.has(lesson.id),
          }));

          const quizzesWithStatus = module.quizzes.map(quiz => ({
            ...quiz,
            isPassed: passedQuizSet.has(quiz.id),
          }));

          const labsWithStatus = module.labs.map(lab => ({
            ...lab,
            isPassed: passedLabSet.has(lab.id),
          }));

          return {
            ...module,
            lessons: lessonsWithStatus,
            quizzes: quizzesWithStatus,
            labs: labsWithStatus,
            userProgress: progress,
          };
        })
      );
      return modulesWithProgress;
    }

    return modules;
  }

  /**
   * Get a single module by ID
   * @param moduleId - Module ID
   * @param userId - User ID to calculate progress (optional)
   */
  async getModule(moduleId: string, userId?: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            type: true,
            content: true,
            estimatedTime: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
            maxAttempts: true,
          },
        },
        labs: {
          select: {
            id: true,
            title: true,
            description: true,
            language: true,
            starterCode: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!module) {
      throw new Error('Módulo no encontrado');
    }

    // Calculate progress if userId provided
    let userProgress = 0;
    if (userId) {
      userProgress = await this.calculateModuleProgress(userId, moduleId);
    }

    return {
      ...module,
      userProgress,
    };
  }

  /**
   * Calculate module progress for a user
   * Progress = (completed lessons / total lessons) * 0.4 +
   *            (passed quizzes / total quizzes) * 0.3 +
   *            (passed labs / total labs) * 0.3
   */
  async calculateModuleProgress(userId: string, moduleId: string): Promise<number> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: { select: { id: true } },
        quizzes: { select: { id: true } },
        labs: { select: { id: true } },
      },
    });

    if (!module) return 0;

    const totalLessons = module.lessons.length;
    const totalQuizzes = module.quizzes.length;
    const totalLabs = module.labs.length;

    // If no content, module is 100% complete
    if (totalLessons === 0 && totalQuizzes === 0 && totalLabs === 0) {
      return 100;
    }

    // Count completed lessons
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId,
        moduleId,
        lessonId: { in: module.lessons.map((l) => l.id) },
        completed: true,
      },
    });

    // Count passed quizzes
    const passedQuizzes = await prisma.quizAttempt.groupBy({
      by: ['quizId'],
      where: {
        userId,
        quizId: { in: module.quizzes.map((q) => q.id) },
        passed: true,
      },
    });

    // Count passed labs
    const passedLabs = await prisma.labSubmission.groupBy({
      by: ['labId'],
      where: {
        userId,
        labId: { in: module.labs.map((l) => l.id) },
        passed: true,
      },
    });

    // Calculate weighted progress
    let progress = 0;

    if (totalLessons > 0) {
      progress += (completedLessons / totalLessons) * 40;
    }

    if (totalQuizzes > 0) {
      progress += (passedQuizzes.length / totalQuizzes) * 30;
    }

    if (totalLabs > 0) {
      progress += (passedLabs.length / totalLabs) * 30;
    }

    // If there are no quizzes or labs, redistribute weight to lessons
    if (totalQuizzes === 0 && totalLabs === 0 && totalLessons > 0) {
      progress = (completedLessons / totalLessons) * 100;
    } else if (totalQuizzes === 0 && totalLessons > 0 && totalLabs > 0) {
      progress = (completedLessons / totalLessons) * 60 + (passedLabs.length / totalLabs) * 40;
    } else if (totalLabs === 0 && totalLessons > 0 && totalQuizzes > 0) {
      progress = (completedLessons / totalLessons) * 60 + (passedQuizzes.length / totalQuizzes) * 40;
    }

    return Math.round(progress);
  }
}

export default new ModuleService();
