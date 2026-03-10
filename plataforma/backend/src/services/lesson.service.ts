/**
 * Lesson Service
 * Business logic for lessons and user progress
 */

import { prisma } from '../utils/prisma';

class LessonService {
  /**
   * Get all lessons for a module
   * @param moduleId - Module ID
   * @param userId - User ID to get progress (optional)
   */
  async getModuleLessons(moduleId: string, userId?: string) {
    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        estimatedTime: true,
        order: true,
        createdAt: true,
      },
      orderBy: { order: 'asc' },
    });

    // Add progress information if userId provided
    if (userId) {
      const lessonsWithProgress = await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await prisma.userProgress.findUnique({
            where: {
              userId_moduleId_lessonId: {
                userId,
                moduleId,
                lessonId: lesson.id,
              },
            },
            select: {
              completed: true,
              completedAt: true,
              timeSpent: true,
            },
          });

          return {
            ...lesson,
            userProgress: progress
              ? {
                  completed: progress.completed,
                  completedAt: progress.completedAt,
                  timeSpent: progress.timeSpent,
                }
              : {
                  completed: false,
                  completedAt: null,
                  timeSpent: 0,
                },
          };
        })
      );

      return lessonsWithProgress;
    }

    return lessons;
  }

  /**
   * Get a single lesson by ID with full content
   * @param lessonId - Lesson ID
   * @param userId - User ID to get progress (optional)
   */
  async getLesson(lessonId: string, userId?: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Check if user is enrolled in the course
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.module.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new Error('No estás inscrito en este curso');
      }

      // Get user progress for this lesson
      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_moduleId_lessonId: {
            userId,
            moduleId: lesson.moduleId,
            lessonId: lesson.id,
          },
        },
      });

      return {
        ...lesson,
        userProgress: progress
          ? {
              completed: progress.completed,
              completedAt: progress.completedAt,
              timeSpent: progress.timeSpent,
            }
          : {
              completed: false,
              completedAt: null,
              timeSpent: 0,
            },
      };
    }

    return lesson;
  }

  /**
   * Mark a lesson as complete
   * @param lessonId - Lesson ID
   * @param userId - User ID
   * @param timeSpent - Time spent on lesson in seconds (optional)
   */
  async completeLesson(lessonId: string, userId: string, timeSpent?: number) {
    // Get lesson to retrieve moduleId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        moduleId: true,
        module: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Create or update user progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_moduleId_lessonId: {
          userId,
          moduleId: lesson.moduleId,
          lessonId: lesson.id,
        },
      },
      update: {
        completed: true,
        lastAccess: new Date(),
        progress: 100,
      },
      create: {
        userId,
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
        completed: true,
        lastAccess: new Date(),
        progress: 100,
      },
    });

    return progress;
  }

  /**
   * Get lesson progress for a user
   * @param lessonId - Lesson ID
   * @param userId - User ID
   */
  async getLessonProgress(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        moduleId: true,
        module: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Get user progress
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_moduleId_lessonId: {
          userId,
          moduleId: lesson.moduleId,
          lessonId: lesson.id,
        },
      },
    });

    if (!progress) {
      return {
        completed: false,
        completedAt: null,
        timeSpent: 0,
      };
    }

    return {
      completed: progress.completed,
      completedAt: progress.completedAt,
      timeSpent: progress.timeSpent,
    };
  }
}

export default new LessonService();
