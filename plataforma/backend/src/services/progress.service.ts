/**
 * Progress Service
 * Centralized business logic for user progress tracking and calculations
 */

import { prisma } from '../utils/prisma';

class ProgressService {
  /**
   * Get overall course progress for a user
   * Calculates average progress across all modules
   * @param userId - User ID
   * @param courseId - Course ID
   */
  async getCourseProgress(userId: string, courseId: string): Promise<number> {
    // Get all modules for the course
    const modules = await prisma.module.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (modules.length === 0) {
      return 0;
    }

    // Calculate progress for each module
    const moduleProgresses = await Promise.all(
      modules.map((module) => this.getModuleProgress(userId, module.id))
    );

    // Average progress across all modules
    const totalProgress = moduleProgresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / modules.length);
  }

  /**
   * Get progress for a specific module
   * Progress = (completed lessons / total lessons) * 0.4 +
   *            (passed quizzes / total quizzes) * 0.3 +
   *            (passed labs / total labs) * 0.3
   * @param userId - User ID
   * @param moduleId - Module ID
   */
  async getModuleProgress(userId: string, moduleId: string): Promise<number> {
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

    // Count passed quizzes (using groupBy to get unique quizzes)
    const passedQuizzes = await prisma.quizAttempt.groupBy({
      by: ['quizId'],
      where: {
        userId,
        quizId: { in: module.quizzes.map((q) => q.id) },
        passed: true,
      },
    });

    // Count passed labs (using groupBy to get unique labs)
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
      progress =
        (completedLessons / totalLessons) * 60 + (passedQuizzes.length / totalQuizzes) * 40;
    }

    return Math.round(progress);
  }

  /**
   * Get detailed progress breakdown for a user in a course
   * @param userId - User ID
   * @param courseId - Course ID
   */
  async getDetailedCourseProgress(userId: string, courseId: string) {
    const modules = await prisma.module.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      include: {
        lessons: { select: { id: true } },
        quizzes: { select: { id: true } },
        labs: { select: { id: true } },
      },
      orderBy: { order: 'asc' },
    });

    const detailedProgress = await Promise.all(
      modules.map(async (module) => {
        const totalLessons = module.lessons.length;
        const totalQuizzes = module.quizzes.length;
        const totalLabs = module.labs.length;

        const completedLessons = await prisma.userProgress.count({
          where: {
            userId,
            moduleId: module.id,
            lessonId: { in: module.lessons.map((l) => l.id) },
            completed: true,
          },
        });

        const passedQuizzes = await prisma.quizAttempt.groupBy({
          by: ['quizId'],
          where: {
            userId,
            quizId: { in: module.quizzes.map((q) => q.id) },
            passed: true,
          },
        });

        const passedLabs = await prisma.labSubmission.groupBy({
          by: ['labId'],
          where: {
            userId,
            labId: { in: module.labs.map((l) => l.id) },
            passed: true,
          },
        });

        const moduleProgress = await this.getModuleProgress(userId, module.id);

        return {
          moduleId: module.id,
          moduleTitle: module.title,
          progress: moduleProgress,
          lessons: {
            total: totalLessons,
            completed: completedLessons,
          },
          quizzes: {
            total: totalQuizzes,
            passed: passedQuizzes.length,
          },
          labs: {
            total: totalLabs,
            passed: passedLabs.length,
          },
        };
      })
    );

    const overallProgress = await this.getCourseProgress(userId, courseId);

    return {
      overallProgress,
      modules: detailedProgress,
    };
  }

  /**
   * Update enrollment progress based on current course completion
   * @param userId - User ID
   * @param courseId - Course ID
   */
  async updateEnrollmentProgress(userId: string, courseId: string) {
    const progress = await this.getCourseProgress(userId, courseId);

    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        progress,
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    return progress;
  }

  /**
   * Check if user has completed all prerequisites for a lesson
   * @param userId - User ID
   * @param lessonId - Lesson ID
   */
  async hasCompletedPrerequisites(userId: string, lessonId: string): Promise<boolean> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        order: true,
        moduleId: true,
      },
    });

    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Check if all previous lessons in the module are completed
    const previousLessons = await prisma.lesson.findMany({
      where: {
        moduleId: lesson.moduleId,
        order: { lt: lesson.order },
      },
      select: { id: true },
    });

    if (previousLessons.length === 0) {
      // First lesson, no prerequisites
      return true;
    }

    const completedPreviousLessons = await prisma.userProgress.count({
      where: {
        userId,
        moduleId: lesson.moduleId,
        lessonId: { in: previousLessons.map((l) => l.id) },
        completed: true,
      },
    });

    return completedPreviousLessons === previousLessons.length;
  }
}

export default new ProgressService();
