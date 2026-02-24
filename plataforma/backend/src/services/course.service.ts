import { prisma } from '../utils/prisma';
import { Course, CourseLevel, Prisma } from '@prisma/client';

export interface GetCoursesOptions {
  page?: number;
  limit?: number;
  level?: CourseLevel;
  tag?: string;
  search?: string;
  isPublished?: boolean;
}

export interface CourseWithModules extends Course {
  modules: Array<{
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
  }>;
  _count?: {
    enrollments: number;
  };
}

class CourseService {
  /**
   * Get all courses with optional filtering and pagination
   */
  async getCourses(options: GetCoursesOptions = {}) {
    const {
      page = 1,
      limit = 10,
      level,
      tag,
      search,
      isPublished = true,
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      isPublished,
    };

    if (level) {
      where.level = level;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              order: true,
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single course by ID or slug
   */
  async getCourse(idOrSlug: string) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        modules: {
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
                passingScore: true,
                timeLimit: true,
              },
            },
            labs: {
              select: {
                id: true,
                title: true,
                language: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    return course;
  }

  /**
   * Get course statistics
   */
  async getCourseStats(courseId: string) {
    const [course, enrollmentsCount, completionsCount] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
      }),
      prisma.enrollment.count({
        where: { courseId },
      }),
      prisma.enrollment.count({
        where: {
          courseId,
          completedAt: { not: null },
        },
      }),
    ]);

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    const completionRate =
      enrollmentsCount > 0 ? (completionsCount / enrollmentsCount) * 100 : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      enrollmentsCount,
      completionsCount,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Enroll a user in a course
   */
  async enrollUser(userId: string, courseId: string) {
    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    if (!course.isPublished) {
      throw new Error('El curso no está publicado');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error('Ya estás inscrito en este curso');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
            level: true,
            duration: true,
          },
        },
      },
    });

    return enrollment;
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalModules = enrollment.course.modules.length;
        const completedModules = await prisma.userProgress.count({
          where: {
            userId,
            moduleId: {
              in: enrollment.course.modules.map((m) => m.id),
            },
            completed: true,
          },
        });

        const progress =
          totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return {
          ...enrollment,
          progress,
        };
      })
    );

    return enrollmentsWithProgress;
  }
}

export default new CourseService();
